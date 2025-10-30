/**
 * Gallery Storage - Manages photo uploads and syncing with S3
 */

const PHOTO_UPLOAD_API = 'https://hazcz0r7kk.execute-api.us-east-1.amazonaws.com/gallery';

/**
 * Upload photo to S3
 */
export async function uploadPhotoToS3(photoData) {
  try {
    const response = await fetch(PHOTO_UPLOAD_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        photo: {
          data: photoData, // Base64 data URL
          caption: 'Memory',
          uploadedAt: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.url; // Returns CloudFront URL
  } catch (error) {
    console.error('Failed to upload to S3:', error);
    // Return null on failure - we'll still store locally
    return null;
  }
}

/**
 * Load photos from S3
 */
export async function loadPhotosFromS3() {
  try {
    const response = await fetch(PHOTO_UPLOAD_API, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Load failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.photos || [];
  } catch (error) {
    console.error('Failed to load from S3:', error);
    return [];
  }
}

/**
 * Sync local photos with S3
 * - Uploads any local-only photos to S3
 * - Downloads any S3-only photos to local
 */
export async function syncGalleryPhotos(localPhotos) {
  try {
    // Load photos from S3
    const s3Photos = await loadPhotosFromS3();

    // Merge: S3 photos take precedence
    const merged = [...s3Photos];

    // Add any local photos that aren't in S3
    for (const localPhoto of localPhotos) {
      if (localPhoto.type === 'uploaded' && !localPhoto.isDefault) {
        // Check if this photo exists in S3
        const existsInS3 = s3Photos.some(s3Photo =>
          s3Photo.url === localPhoto.url ||
          s3Photo.uploadedAt === localPhoto.uploadedAt
        );

        if (!existsInS3) {
          // Upload to S3
          const s3Url = await uploadPhotoToS3(localPhoto.url);
          if (s3Url) {
            merged.push({
              type: 'uploaded',
              url: s3Url,
              caption: localPhoto.caption,
              uploadedAt: localPhoto.uploadedAt
            });
          } else {
            // Keep local if upload failed
            merged.push(localPhoto);
          }
        }
      }
    }

    return merged;
  } catch (error) {
    console.error('Sync failed:', error);
    // Return local photos if sync fails
    return localPhotos;
  }
}
