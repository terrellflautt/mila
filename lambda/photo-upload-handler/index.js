const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

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
    // Get userId from headers or query params (defaulting to 'mila' for now)
    const userId = event.headers?.['x-user-id'] || event.queryStringParameters?.userId || 'mila';

    // GET - List all photos from DynamoDB
    if (method === 'GET') {
      const photos = await getPhotosFromDynamoDB(userId);
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

      const result = await uploadPhoto(body.photo, userId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          ...result,
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
 * Upload photo to S3 and save metadata to DynamoDB
 */
async function uploadPhoto(photo, userId) {
  const bucketName = process.env.GALLERY_BUCKET_NAME;
  const galleryTableName = process.env.GALLERY_TABLE_NAME;

  // Decode base64 photo data
  const base64Data = photo.data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  // Determine content type
  const contentType = photo.data.match(/data:(image\/\w+);/)?.[1] || 'image/jpeg';

  // Generate unique filename
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(8).toString('hex');
  const extension = contentType.split('/')[1] || 'jpg';
  const photoId = `${timestamp}-${randomId}`;

  // TODO: In future, create thumbnail version here with sharp
  // For now, just upload the full image
  const filename = `uploads/${photoId}.${extension}`;

  // Upload to S3
  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: filename,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'max-age=31536000',  // 1 year
  }));

  // Construct URLs
  const photoUrl = `https://${bucketName}.s3.amazonaws.com/${filename}`;

  // Create metadata object
  const photoMetadata = {
    photoId,
    url: photoUrl,
    thumbnailUrl: photoUrl, // TODO: Update when we add thumbnail generation
    caption: photo.caption || '',
    uploadedAt: new Date().toISOString(),
    s3Key: filename
  };

  // Get existing photos from DynamoDB
  const existingData = await docClient.send(new GetCommand({
    TableName: galleryTableName,
    Key: { userId }
  }));

  const existingPhotos = existingData.Item?.photos || [];
  const updatedPhotos = [...existingPhotos, photoMetadata];

  // Save to DynamoDB
  await docClient.send(new PutCommand({
    TableName: galleryTableName,
    Item: {
      userId,
      photos: updatedPhotos,
      updatedAt: new Date().toISOString()
    }
  }));

  return photoMetadata;
}

/**
 * Get all photos for a user from DynamoDB
 */
async function getPhotosFromDynamoDB(userId) {
  const galleryTableName = process.env.GALLERY_TABLE_NAME;

  const result = await docClient.send(new GetCommand({
    TableName: galleryTableName,
    Key: { userId }
  }));

  if (!result.Item || !result.Item.photos) {
    return [];
  }

  // Return photos sorted by newest first
  return result.Item.photos.sort((a, b) =>
    new Date(b.uploadedAt) - new Date(a.uploadedAt)
  );
}
