/**
 * Grace - Jeff Buckley Experience
 * A dedicated space for her favorite artist and album
 * Embeds the Grace YouTube playlist for listening/watching
 */

import gsap from 'gsap';

export class Grace {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.element = null;
    this.resizeHandler = null;
  }

  /**
   * Show the experience
   */
  show() {
    this.element = this.createExperienceElement();
    document.body.appendChild(this.element);

    // Animate in
    gsap.fromTo(this.element,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1.5,
        ease: 'power2.out'
      }
    );

    this.addEventListeners();
  }

  /**
   * Create the experience HTML
   */
  createExperienceElement() {
    const experience = document.createElement('div');
    experience.className = 'grace-experience';
    experience.innerHTML = `
      <div class="grace-container">
        <div class="grace-header">
          <div class="grace-title">Grace</div>
          <div class="grace-artist">Jeff Buckley</div>
          <div class="grace-message">
            "There's a light in you that shines through everything"
          </div>
        </div>

        <div class="grace-player">
          <iframe
            class="grace-youtube-embed"
            src="https://www.youtube.com/embed/videoseries?list=PLOJWuc3CN301JqbcCyHNPdvOSN0JkJ3f_&autoplay=0"
            title="Jeff Buckley - Grace (Full Album)"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>

        <div class="grace-tracklist">
          <div class="tracklist-title">Album Tracks</div>
          <div class="track-item">1. Mojo Pin</div>
          <div class="track-item">2. Grace</div>
          <div class="track-item">3. Last Goodbye</div>
          <div class="track-item">4. Lilac Wine</div>
          <div class="track-item">5. So Real</div>
          <div class="track-item">6. Hallelujah</div>
          <div class="track-item">7. Lover, You Should've Come Over</div>
          <div class="track-item">8. Corpus Christi Carol</div>
          <div class="track-item">9. Eternal Life</div>
          <div class="track-item">10. Dream Brother</div>
        </div>

        <button class="grace-close">Close</button>
      </div>

      <style>
        .grace-experience {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #0a0a15 0%, #1a0a1a 50%, #0a0515 100%);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          overflow-y: auto;
          padding: 20px;
        }

        .grace-container {
          width: 100%;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 2rem;
        }

        .grace-header {
          text-align: center;
          color: rgba(255, 255, 255, 0.95);
        }

        .grace-title {
          font-size: 4rem;
          font-weight: 300;
          font-style: italic;
          background: linear-gradient(135deg, #E8D5C4 0%, #FFB6C1 50%, #C9A0DC 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
          text-shadow: 0 0 40px rgba(232, 213, 196, 0.3);
        }

        .grace-artist {
          font-size: 2rem;
          font-weight: 300;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 1.5rem;
        }

        .grace-message {
          font-size: 1.3rem;
          font-style: italic;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
        }

        .grace-player {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%; /* 16:9 aspect ratio */
          border-radius: 16px;
          overflow: hidden;
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.6),
            0 0 40px rgba(232, 213, 196, 0.2);
          border: 1px solid rgba(232, 213, 196, 0.3);
        }

        .grace-youtube-embed {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .grace-tracklist {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(232, 213, 196, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
        }

        .tracklist-title {
          font-size: 1.5rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 1rem;
          text-align: center;
        }

        .track-item {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.7);
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.2s ease;
        }

        .track-item:last-child {
          border-bottom: none;
        }

        .track-item:hover {
          color: rgba(232, 213, 196, 1);
          background: rgba(232, 213, 196, 0.05);
          padding-left: 1.5rem;
        }

        .grace-close {
          align-self: center;
          padding: 0.75rem 2rem;
          background: rgba(232, 213, 196, 0.15);
          border: 1px solid rgba(232, 213, 196, 0.4);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.9);
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .grace-close:hover {
          background: rgba(232, 213, 196, 0.3);
          border-color: rgba(232, 213, 196, 0.6);
          transform: scale(1.05);
        }

        .grace-close:active {
          transform: scale(0.98);
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .grace-container {
            padding: 1rem;
            gap: 1.5rem;
          }

          .grace-title {
            font-size: 3rem;
          }

          .grace-artist {
            font-size: 1.5rem;
          }

          .grace-message {
            font-size: 1.1rem;
          }

          .track-item {
            font-size: 1rem;
            padding: 0.6rem 0.8rem;
          }
        }
      </style>
    `;

    return experience;
  }

  /**
   * Add event listeners
   */
  addEventListeners() {
    const closeBtn = this.element.querySelector('.grace-close');

    // Support both click and touch
    const handleClose = () => this.close();

    closeBtn.addEventListener('click', handleClose);
    closeBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleClose();
    }, { passive: false });
  }

  /**
   * Close the experience
   */
  close() {
    gsap.to(this.element, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.in',
      onComplete: () => {
        // Cleanup
        if (this.element && this.element.parentNode) {
          this.element.remove();
        }

        // Mark complete
        if (this.onComplete) {
          this.onComplete();
        }
      }
    });
  }

  /**
   * Hide without marking complete
   */
  hide() {
    this.close();
  }
}
