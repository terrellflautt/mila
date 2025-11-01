/**
 * Gallery of Us - A Place for Our Memories
 * Blurred images that fade in to reveal photos of us together
 * Upload feature to add new memories
 */

import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { uploadPhotoToS3, syncGalleryPhotos } from '../utils/galleryStorage.js';
import { getStorageKey } from '../utils/storage.js';

export class GalleryOfUs {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.element = null;
    this.photos = [];
    this.revealedPhotos = 0;
    this.totalPhotos = 4; // Start with 4 slots (mobile-friendly)
    this.isComplete = false;
  }

  /**
   * Load saved photos from localStorage and sync with S3
   */
  async loadPhotos() {
    const saved = localStorage.getItem(getStorageKey('gallery-photos'));
    let localPhotos = [];

    if (saved) {
      try {
        localPhotos = JSON.parse(saved);
      } catch (e) {
        localPhotos = [];
      }
    }

    // Start with empty gallery - she builds it herself by uploading photos
    // No default photos shown until she adds her own memories

    // Try to sync with S3 (non-blocking, will use local if sync fails)
    try {
      const syncedPhotos = await syncGalleryPhotos(localPhotos);
      this.photos = syncedPhotos;
      this.savePhotos(); // Update local storage with synced data
    } catch (error) {
      console.log('Using local photos only');
      this.photos = localPhotos;
    }

    // Ensure we have at least placeholder slots
    while (this.photos.length < this.totalPhotos) {
      this.photos.push({
        type: 'placeholder',
        message: 'A memory waiting to be captured...'
      });
    }
  }

  /**
   * Save photos to localStorage
   */
  savePhotos() {
    localStorage.setItem(getStorageKey('gallery-photos'), JSON.stringify(this.photos));
  }

  /**
   * Show the gallery
   */
  async show() {
    await this.loadPhotos();
    this.element = this.createGalleryElement();
    document.body.appendChild(this.element);

    // Animate in
    gsap.fromTo(this.element,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
        onComplete: () => {
          // Show continue button after intro (photos now reveal on hover)
          setTimeout(() => {
            const continueBtn = this.element.querySelector('.continue-btn');
            if (continueBtn) {
              continueBtn.style.display = 'flex';
              gsap.fromTo(continueBtn,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5 }
              );
            }
          }, 1000);
        }
      }
    );
  }

  /**
   * Create gallery HTML
   */
  createGalleryElement() {
    const gallery = document.createElement('div');
    gallery.className = 'gallery-of-us';
    gallery.innerHTML = `
      <div class="gallery-container">
        <button class="gallery-exit-btn" title="Exit">✕</button>
        <div class="gallery-header">
          <div class="gallery-title">Gallery of Us</div>
          <div class="gallery-subtitle">A place to keep our memories</div>
          <div class="gallery-description">
            ${this.photos.length === 0
              ? 'Start building your collection of memories.<br>Upload photos and they\'ll be saved across all your devices.'
              : 'Every moment we share deserves to be remembered.<br>Watch as our story unfolds, one memory at a time.'}
          </div>
        </div>

        <div class="photo-grid">
          ${this.photos.map((photo, index) => this.createPhotoHTML(photo, index)).join('')}
        </div>

        <div class="gallery-actions">
          <button class="upload-btn">
            <span class="upload-icon">📸</span>
            Add a Memory
          </button>
          <button class="continue-btn" style="display: none;">
            Continue
          </button>
        </div>

        <input type="file" class="photo-upload-input" accept="image/*" capture="environment" style="display: none;" multiple>
      </div>

      <style>
        .gallery-of-us {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          height: 100dvh;
          background: linear-gradient(135deg, #0a0a15 0%, #1a0a1a 100%);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          overflow-y: auto;
          padding: 2rem 1rem;
          padding: max(2rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) max(2rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
        }

        .gallery-container {
          position: relative;
          width: 100%;
          max-width: 1200px;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .gallery-exit-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 44px;
          height: 44px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.3s ease;
          line-height: 1;
          padding: 0;
        }

        .gallery-exit-btn:hover {
          background: rgba(255, 107, 157, 0.8);
          border-color: rgba(255, 182, 193, 0.6);
          transform: scale(1.1);
        }

        .gallery-header {
          text-align: center;
          color: rgba(255, 255, 255, 0.9);
        }

        .gallery-title {
          font-size: 3rem;
          font-weight: 300;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #FF6B9D 0%, #FFB6C1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .gallery-subtitle {
          font-size: 1.5rem;
          font-weight: 300;
          font-style: italic;
          color: rgba(255, 235, 240, 0.95);
          margin-bottom: 1rem;
        }

        .gallery-description {
          font-size: 1.1rem;
          color: rgba(255, 235, 240, 0.9);
          font-style: italic;
          line-height: 1.6;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          padding: 1rem;
        }

        .photo-frame {
          position: relative;
          aspect-ratio: 4/3;
          max-width: 500px;
          border-radius: 16px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(255, 182, 193, 0.2);
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .photo-frame:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 48px rgba(255, 107, 157, 0.3);
          border-color: rgba(255, 182, 193, 0.4);
        }

        .photo-content {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .photo-blur {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 2;
          transition: opacity 0.6s ease, backdrop-filter 0.6s ease;
          opacity: 1;
        }

        .photo-frame:hover .photo-blur {
          opacity: 0;
          backdrop-filter: blur(0px);
          -webkit-backdrop-filter: blur(0px);
        }

        /* Different colored tints for each photo */
        .photo-blur[data-tint="pink"] {
          background: rgba(255, 182, 193, 0.3);
        }

        .photo-blur[data-tint="lavender"] {
          background: rgba(230, 190, 255, 0.3);
        }

        .photo-blur[data-tint="peach"] {
          background: rgba(255, 218, 185, 0.3);
        }

        .photo-blur[data-tint="mint"] {
          background: rgba(189, 252, 201, 0.25);
        }

        .photo-blur[data-tint="rose"] {
          background: rgba(255, 150, 180, 0.3);
        }

        .photo-blur[data-tint="sky"] {
          background: rgba(176, 224, 230, 0.3);
        }

        .photo-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 1;
        }

        .photo-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 2rem;
          text-align: center;
          background: linear-gradient(135deg, rgba(255, 107, 157, 0.1) 0%, rgba(255, 182, 193, 0.1) 100%);
        }

        .placeholder-icon {
          font-size: 3rem;
          opacity: 0.3;
        }

        .placeholder-text {
          font-size: 1rem;
          color: rgba(255, 235, 240, 0.85);
          font-style: italic;
        }

        .photo-caption {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 1rem;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
          color: white;
          font-size: 0.9rem;
          font-style: italic;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 3;
        }

        .photo-frame:hover .photo-caption {
          opacity: 1;
        }

        .gallery-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .upload-btn, .continue-btn {
          padding: 1rem 2rem;
          border-radius: 12px;
          border: none;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .upload-btn {
          background: linear-gradient(135deg, #FF6B9D 0%, #FFB6C1 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(255, 107, 157, 0.3);
        }

        .upload-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 107, 157, 0.5);
        }

        .continue-btn {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
          border: 2px solid rgba(255, 182, 193, 0.3);
        }

        .continue-btn:hover {
          background: rgba(255, 182, 193, 0.2);
          border-color: rgba(255, 182, 193, 0.5);
        }

        .upload-icon {
          font-size: 1.5rem;
        }

        @media (max-width: 768px) {
          .gallery-of-us {
            padding: max(0.5rem, env(safe-area-inset-top)) max(0.75rem, env(safe-area-inset-right)) max(0.5rem, env(safe-area-inset-bottom)) max(0.75rem, env(safe-area-inset-left));
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .gallery-container {
            gap: 0.75rem;
            padding: 0;
            max-width: 100%;
            min-height: 0;
          }

          .gallery-header {
            padding-top: 0;
            padding-bottom: 0.5rem;
          }

          .gallery-title {
            font-size: 1.5rem;
            margin-bottom: 0.25rem;
          }

          .gallery-subtitle {
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
          }

          .gallery-description {
            font-size: 0.8rem;
            line-height: 1.3;
          }

          .photo-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
            padding: 0;
            width: 100%;
          }

          .photo-frame {
            margin: 0 auto;
            max-width: 100%;
            width: 100%;
            aspect-ratio: 2/1;
            max-height: 150px;
            min-height: 120px;
          }

          .placeholder-icon {
            font-size: 1.5rem;
          }

          .placeholder-text {
            font-size: 0.75rem;
            padding: 0 0.5rem;
          }

          .photo-caption {
            font-size: 0.75rem;
            padding: 0.5rem;
          }

          .gallery-exit-btn {
            top: max(0.5rem, env(safe-area-inset-top));
            right: max(0.5rem, env(safe-area-inset-right));
            width: 36px;
            height: 36px;
            font-size: 1.25rem;
          }

          .upload-btn, .continue-btn {
            padding: 0.65rem 1.25rem;
            font-size: 0.9rem;
          }

          .upload-icon {
            font-size: 1.1rem;
          }

          .gallery-actions {
            gap: 0.75rem;
            flex-wrap: wrap;
          }
        }
      </style>
    `;

    // Add event listeners
    setTimeout(() => this.attachEventListeners(), 100);

    return gallery;
  }

  /**
   * Create HTML for a single photo
   */
  createPhotoHTML(photo, index) {
    // Rotating tint colors for variety
    const tints = ['pink', 'lavender', 'peach', 'mint', 'rose', 'sky'];
    const tint = tints[index % tints.length];

    if (photo.type === 'placeholder') {
      return `
        <div class="photo-frame" data-index="${index}">
          <div class="photo-content">
            <div class="photo-blur" data-tint="${tint}"></div>
            <div class="photo-placeholder">
              <div class="placeholder-icon">🖼️</div>
              <div class="placeholder-text">${photo.message}</div>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="photo-frame" data-index="${index}">
          <div class="photo-content">
            <div class="photo-blur" data-tint="${tint}"></div>
            <img class="photo-image" src="${photo.url}" alt="Memory ${index + 1}">
            ${photo.caption ? `<div class="photo-caption">${photo.caption}</div>` : ''}
          </div>
        </div>
      `;
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const uploadBtn = this.element.querySelector('.upload-btn');
    const uploadInput = this.element.querySelector('.photo-upload-input');
    const continueBtn = this.element.querySelector('.continue-btn');
    const exitBtn = this.element.querySelector('.gallery-exit-btn');

    uploadBtn?.addEventListener('click', () => {
      uploadInput.click();
    });

    uploadInput?.addEventListener('change', (e) => {
      this.handlePhotoUpload(e);
    });

    continueBtn?.addEventListener('click', () => {
      this.complete();
    });

    exitBtn?.addEventListener('click', () => {
      this.hide();
    });

    // Add click handlers to photo frames to show fullscreen
    const photoFrames = this.element.querySelectorAll('.photo-frame');
    photoFrames.forEach((frame, index) => {
      frame.addEventListener('click', () => {
        const photo = this.photos[index];
        if (photo && photo.url) {
          this.showFullscreenPhoto(photo, index);
        }
      });
    });
  }

  /**
   * Handle photo upload
   */
  async handlePhotoUpload(e) {
    const files = Array.from(e.target.files);

    if (files.length === 0) return;

    console.log(`Uploading ${files.length} photo(s)...`);

    // Show upload feedback
    const uploadBtn = this.element.querySelector('.upload-btn');
    const originalText = uploadBtn?.innerHTML;
    if (uploadBtn) {
      uploadBtn.innerHTML = '<span class="upload-icon">⏳</span>Uploading...';
      uploadBtn.disabled = true;
    }

    for (const file of files) {
      if (file && file.type.startsWith('image/')) {
        try {
          await this.processPhotoFile(file);
        } catch (error) {
          console.error('Error processing photo:', error);
        }
      }
    }

    // Restore button
    if (uploadBtn) {
      uploadBtn.innerHTML = originalText;
      uploadBtn.disabled = false;
    }

    // Clear input
    e.target.value = '';
  }

  /**
   * Process a single photo file
   */
  async processPhotoFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const photoData = event.target.result;

          // Find first placeholder slot
          const placeholderIndex = this.photos.findIndex(p => p.type === 'placeholder');

          // Create photo object
          const newPhoto = {
            type: 'uploaded',
            url: photoData, // Temporarily use base64
            caption: `Memory ${placeholderIndex !== -1 ? placeholderIndex + 1 : this.photos.length + 1}`,
            uploadedAt: new Date().toISOString()
          };

          // Try to upload to S3
          try {
            const s3Url = await uploadPhotoToS3(photoData);
            if (s3Url) {
              newPhoto.url = s3Url; // Use S3 URL if upload succeeded
              console.log('Photo uploaded to S3:', s3Url);
            }
          } catch (error) {
            console.log('S3 upload failed, using local storage:', error);
          }

          if (placeholderIndex !== -1) {
            // Replace placeholder
            this.photos[placeholderIndex] = newPhoto;
          } else {
            // Add new slot
            this.photos.push(newPhoto);
            this.totalPhotos = this.photos.length;
          }

          this.savePhotos();
          this.refreshPhotoGrid();

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Refresh the photo grid after upload
   */
  refreshPhotoGrid() {
    const grid = this.element.querySelector('.photo-grid');
    if (!grid) return;

    grid.innerHTML = this.photos.map((photo, index) => this.createPhotoHTML(photo, index)).join('');

    // Animate new photos in
    const frames = grid.querySelectorAll('.photo-frame');
    frames.forEach((frame, index) => {
      gsap.fromTo(frame,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          delay: index * 0.05,
          ease: 'back.out(1.5)'
        }
      );
    });
  }

  /**
   * Start the photo reveal sequence
   */
  startRevealSequence() {
    const frames = this.element.querySelectorAll('.photo-frame');

    frames.forEach((frame, index) => {
      setTimeout(() => {
        this.revealPhoto(frame, index);
      }, index * 800); // Stagger reveals by 800ms
    });

    // Show continue button after all reveals
    setTimeout(() => {
      const continueBtn = this.element.querySelector('.continue-btn');
      if (continueBtn) {
        continueBtn.style.display = 'flex';
        gsap.fromTo(continueBtn,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5 }
        );
      }
    }, frames.length * 800 + 1000);
  }

  /**
   * Reveal a single photo
   */
  revealPhoto(frame, index) {
    const blur = frame.querySelector('.photo-blur');
    const image = frame.querySelector('.photo-image');

    // Animate blur away
    if (blur) {
      blur.classList.add('revealed');
    }

    // Fade in image
    if (image) {
      image.classList.add('revealed');
    }

    // Subtle scale animation
    gsap.fromTo(frame,
      { scale: 0.95 },
      {
        scale: 1,
        duration: 1.5,
        ease: 'power2.out'
      }
    );

    this.revealedPhotos++;
  }

  /**
   * Complete the gallery experience
   */
  complete() {
    if (this.isComplete) return;
    this.isComplete = true;

    console.log('🎨 Gallery of Us complete!');

    // Celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B9D', '#FFB6C1', '#FFC0CB']
    });

    setTimeout(() => {
      this.hide();
    }, 1500);
  }

  /**
   * Show photo in fullscreen overlay
   */
  showFullscreenPhoto(photo, index) {
    const overlay = document.createElement('div');
    overlay.className = 'photo-fullscreen-overlay';
    overlay.innerHTML = `
      <div class="fullscreen-photo-container">
        <img src="${photo.url}" alt="Memory ${index + 1}" class="fullscreen-photo">
        ${photo.caption ? `<div class="fullscreen-caption">${photo.caption}</div>` : ''}
        <button class="fullscreen-close">×</button>
      </div>

      <style>
        .photo-fullscreen-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.95);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .fullscreen-photo-container {
          position: relative;
          max-width: 95vw;
          max-height: 95vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .fullscreen-photo {
          max-width: 100%;
          max-height: 85vh;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .fullscreen-caption {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          color: rgba(255, 255, 255, 0.9);
          text-align: center;
          font-style: italic;
        }

        .fullscreen-close {
          position: absolute;
          top: -15px;
          right: -15px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          font-size: 2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          font-family: Arial, sans-serif;
          line-height: 1;
        }

        .fullscreen-close:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          transform: scale(1.1);
        }

        @media (max-width: 768px) {
          .fullscreen-photo {
            max-height: 80vh;
          }

          .fullscreen-caption {
            font-size: 1.2rem;
          }

          .fullscreen-close {
            top: 10px;
            right: 10px;
          }
        }
      </style>
    `;

    document.body.appendChild(overlay);

    // Close handlers
    const closeBtn = overlay.querySelector('.fullscreen-close');
    const closeOverlay = () => {
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => overlay.remove()
      });
    };

    closeBtn.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeOverlay();
    });

    // Animate in
    gsap.fromTo(overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
  }

  /**
   * Hide and cleanup
   */
  hide() {
    gsap.to(this.element, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.in',
      onComplete: () => {
        this.element.remove();
        if (this.onComplete) this.onComplete();
      }
    });
  }
}
