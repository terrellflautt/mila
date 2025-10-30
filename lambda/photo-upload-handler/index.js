const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const method = event.requestContext?.http?.method || event.httpMethod || 'GET';

  try {
    // GET - List all photos
    if (method === 'GET') {
      const photos = await listPhotos();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ photos })
      };
    }

    // POST - Upload new photo
    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');

      if (!body.photo || !body.photo.data) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'No photo data provided' })
        };
      }

      const photoUrl = await uploadPhoto(body.photo);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          url: photoUrl,
          message: 'Photo uploaded successfully'
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

/**
 * Upload photo to S3
 */
async function uploadPhoto(photo) {
  const bucketName = process.env.BUCKET_NAME;

  // Decode base64 photo data
  const base64Data = photo.data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // Determine content type
  const contentType = photo.data.match(/data:(image\/\w+);/)?.[1] || 'image/jpeg';

  // Generate unique filename
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString('hex');
  const extension = contentType.split('/')[1] || 'jpg';
  const filename = `gallery/uploads/${timestamp}-${randomId}.${extension}`;

  // Upload to S3
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: filename,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'max-age=31536000',  // 1 year
    Metadata: {
      caption: photo.caption || '',
      uploadedAt: new Date().toISOString()
    }
  }));

  // Return CloudFront URL
  const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
  return `https://${cloudFrontDomain}/${filename}`;
}

/**
 * List all uploaded photos
 */
async function listPhotos() {
  const bucketName = process.env.BUCKET_NAME;
  const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;

  const response = await s3Client.send(new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: 'gallery/uploads/'
  }));

  if (!response.Contents) {
    return [];
  }

  return response.Contents
    .filter(item => item.Key !== 'gallery/uploads/') // Skip folder marker
    .map(item => ({
      url: `https://${cloudFrontDomain}/${item.Key}`,
      key: item.Key,
      uploadedAt: item.LastModified,
      size: item.Size
    }))
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)); // Newest first
}
