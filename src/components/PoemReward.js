/**
 * Poem Reward Component
 * Beautiful presentation of classic love poems as rewards for completing experiences
 */

import gsap from 'gsap';

export class PoemReward {
  constructor(poem, onClose) {
    this.poem = poem;
    this.onClose = onClose;
    this.element = null;
  }

  /**
   * Show the poem reward with beautiful sequential animation
   */
  async show() {
    this.element = this.createPoemElement();
    document.body.appendChild(this.element);

    // Sequence of reveals:
    // 1. Fade in overlay and container
    await this.animateIn();

    // 2. Reveal title and poet
    await this.revealHeader();

    // 3. Wait a moment, then reveal poem text
    await new Promise(resolve => setTimeout(resolve, 800));
    await this.revealPoem();

    // 4. Wait, then reveal story
    await new Promise(resolve => setTimeout(resolve, 1200));
    await this.revealStory();

    // 5. Show close button
    await this.revealCloseButton();
  }

  /**
   * Create the poem HTML structure
   */
  createPoemElement() {
    const isFavorite = this.poem.isFavorite || false;

    const overlay = document.createElement('div');
    overlay.className = 'poem-reward-overlay';

    overlay.innerHTML = `
      <div class="poem-reward-container">
        <div class="poem-reward-content">
          ${isFavorite ? `
            <div class="poem-personal-message">
              <div class="poem-personal-text">
                If I could describe how I feel in words, I would write you poems.<br>
                So instead, I'll share these with you.
              </div>
            </div>
            <div class="poem-favorite-badge">Her Favorite ♥</div>
          ` : ''}

          <div class="poem-header">
            <h1 class="poem-title">${this.poem.title}</h1>
            <div class="poem-attribution">
              <span class="poem-poet">${this.poem.poet}</span>
              <span class="poem-year">${this.poem.year}</span>
            </div>
          </div>

          <div class="poem-text-container">
            <div class="poem-text">${this.formatPoemText(this.poem.text)}</div>
          </div>

          <div class="poem-story-container">
            <div class="poem-story-title">The Story Behind the Poem</div>
            <div class="poem-story">${this.poem.story}</div>
          </div>

          <button class="poem-close-btn">Continue</button>
        </div>
      </div>
    `;

    // Add close handler
    const closeBtn = overlay.querySelector('.poem-close-btn');
    closeBtn.addEventListener('click', () => this.close());

    // Allow closing by clicking overlay background
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    return overlay;
  }

  /**
   * Format poem text with line breaks preserved
   */
  formatPoemText(text) {
    return text
      .split('\n')
      .map(line => {
        if (line.trim() === '') {
          return '<div class="poem-line poem-line-blank"></div>';
        }
        return `<div class="poem-line">${line}</div>`;
      })
      .join('');
  }

  /**
   * Animation: Fade in overlay and container
   */
  async animateIn() {
    const overlay = this.element;
    const container = overlay.querySelector('.poem-reward-container');

    gsap.set(overlay, { opacity: 0 });
    gsap.set(container, { scale: 0.95, y: 30 });

    await gsap.to(overlay, {
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out'
    });

    await gsap.to(container, {
      scale: 1,
      y: 0,
      duration: 0.8,
      ease: 'back.out(1.2)'
    });
  }

  /**
   * Animation: Reveal header (title and poet)
   */
  async revealHeader() {
    const header = this.element.querySelector('.poem-header');
    const title = header.querySelector('.poem-title');
    const attribution = header.querySelector('.poem-attribution');
    const favorite = this.element.querySelector('.poem-favorite-badge');

    // Set initial state
    gsap.set([title, attribution], { opacity: 0, y: 20 });
    if (favorite) gsap.set(favorite, { opacity: 0, scale: 0.8 });

    // Animate favorite badge first if present
    if (favorite) {
      await gsap.to(favorite, {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: 'back.out(2)'
      });
    }

    // Animate title
    await gsap.to(title, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out'
    });

    // Animate attribution
    await gsap.to(attribution, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out'
    });
  }

  /**
   * Animation: Reveal poem text line by line
   */
  async revealPoem() {
    const textContainer = this.element.querySelector('.poem-text-container');
    const lines = this.element.querySelectorAll('.poem-line');

    // Fade in container
    gsap.set(textContainer, { opacity: 0 });
    await gsap.to(textContainer, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out'
    });

    // Reveal lines with stagger
    gsap.set(lines, { opacity: 0, x: -10 });

    await gsap.to(lines, {
      opacity: 1,
      x: 0,
      duration: 0.4,
      stagger: 0.05,
      ease: 'power2.out'
    });
  }

  /**
   * Animation: Reveal story section
   */
  async revealStory() {
    const storyContainer = this.element.querySelector('.poem-story-container');
    const storyTitle = storyContainer.querySelector('.poem-story-title');
    const storyText = storyContainer.querySelector('.poem-story');

    gsap.set(storyContainer, { opacity: 0 });
    gsap.set([storyTitle, storyText], { opacity: 0, y: 15 });

    // Fade in container
    await gsap.to(storyContainer, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out'
    });

    // Reveal title
    await gsap.to(storyTitle, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out'
    });

    // Reveal story text
    await gsap.to(storyText, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out'
    });
  }

  /**
   * Animation: Reveal close button
   */
  async revealCloseButton() {
    const closeBtn = this.element.querySelector('.poem-close-btn');

    gsap.set(closeBtn, { opacity: 0, y: 15 });

    await gsap.to(closeBtn, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out'
    });
  }

  /**
   * Close the poem reward
   */
  close() {
    const overlay = this.element;
    const container = overlay.querySelector('.poem-reward-container');

    gsap.to(container, {
      scale: 0.95,
      y: 20,
      duration: 0.3,
      ease: 'power2.in'
    });

    gsap.to(overlay, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        if (this.element && this.element.isConnected) {
          this.element.remove();
        }
        if (this.onClose) {
          this.onClose();
        }
      }
    });
  }
}

// Inject styles
const styles = `
.poem-reward-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height for mobile */
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  padding-bottom: max(20px, env(safe-area-inset-bottom)); /* Safe area for notched phones */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
}

.poem-reward-container {
  position: relative;
  max-width: 900px;
  width: 100%;
  max-height: calc(100vh - 40px);
  max-height: calc(100dvh - 40px - env(safe-area-inset-bottom)); /* Account for safe areas */
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%);
  border-radius: 24px;
  border: 1px solid rgba(255, 182, 193, 0.2);
  box-shadow:
    0 20px 80px rgba(0, 0, 0, 0.6),
    0 0 100px rgba(255, 182, 193, 0.1);
  overflow: hidden;
  margin: auto; /* Center vertically when smaller than viewport */
}

.poem-reward-content {
  padding: 3rem 2.5rem 2rem;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(100vh - 40px);
  max-height: calc(100dvh - 40px - env(safe-area-inset-bottom));
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
}

.poem-personal-message {
  text-align: center;
  padding: 2rem 1.5rem 1.5rem;
  margin-bottom: 1rem;
}

.poem-personal-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.25rem;
  font-style: italic;
  line-height: 1.8;
  color: rgba(255, 182, 193, 0.9);
  max-width: 600px;
  margin: 0 auto;
}

.poem-favorite-badge {
  display: inline-block;
  padding: 0.5rem 1.2rem;
  background: rgba(255, 182, 193, 0.15);
  border: 1px solid rgba(255, 182, 193, 0.4);
  border-radius: 20px;
  color: var(--color-highlight, #FFB6C1);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
  letter-spacing: 0.5px;
}

.poem-header {
  text-align: center;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 182, 193, 0.15);
}

.poem-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.5rem;
  font-weight: 400;
  font-style: italic;
  color: var(--color-primary, #FFF8F0);
  line-height: 1.3;
  margin-bottom: 1rem;
  letter-spacing: 0.5px;
}

.poem-attribution {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  color: var(--color-secondary, #FFE4E1);
}

.poem-poet {
  font-weight: 500;
}

.poem-year {
  font-weight: 300;
  opacity: 0.7;
}

.poem-text-container {
  margin-bottom: 3rem;
}

.poem-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.35rem;
  line-height: 2;
  color: var(--color-primary, #FFF8F0);
  text-align: center;
  padding: 0 1rem;
}

.poem-line {
  min-height: 2.7rem;
}

.poem-line-blank {
  min-height: 1.35rem;
}

.poem-story-container {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 182, 193, 0.15);
}

.poem-story-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-highlight, #FFB6C1);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  text-align: center;
  margin-bottom: 1.5rem;
}

.poem-story {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.85);
  text-align: left;
  max-width: 700px;
  margin: 0 auto;
}

.poem-close-btn {
  display: block;
  margin: 3rem auto 1rem;
  padding: 1rem 2.5rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  color: #1a1a1a;
  background: var(--color-highlight, #FFB6C1);
  border: 2px solid var(--color-highlight, #FFB6C1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  /* Ensure button is always visible on mobile */
  margin-bottom: max(2rem, env(safe-area-inset-bottom, 1rem));
}

.poem-close-btn:hover {
  background: var(--color-secondary, #FFE4E1);
  border-color: var(--color-secondary, #FFE4E1);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 182, 193, 0.4);
}

/* Scrollbar styling */
.poem-reward-content::-webkit-scrollbar {
  width: 8px;
}

.poem-reward-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
}

.poem-reward-content::-webkit-scrollbar-thumb {
  background: rgba(255, 182, 193, 0.3);
  border-radius: 4px;
}

.poem-reward-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 182, 193, 0.5);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .poem-reward-overlay {
    padding: 15px;
    padding-bottom: max(15px, env(safe-area-inset-bottom));
  }

  .poem-reward-container {
    border-radius: 20px;
    max-height: calc(100vh - 30px);
    max-height: calc(100dvh - 30px - env(safe-area-inset-bottom));
  }

  .poem-reward-content {
    padding: 2rem 1.5rem 1rem;
    max-height: calc(100vh - 30px);
    max-height: calc(100dvh - 30px - env(safe-area-inset-bottom));
  }

  .poem-title {
    font-size: 2rem;
  }

  .poem-attribution {
    font-size: 0.875rem;
    flex-direction: column;
    gap: 0.25rem;
  }

  .poem-text {
    font-size: 1.2rem;
    line-height: 1.8;
    padding: 0 0.5rem;
  }

  .poem-line {
    min-height: 2.4rem;
  }

  .poem-story {
    font-size: 0.9rem;
  }

  .poem-close-btn {
    padding: 0.875rem 2rem;
    font-size: 0.9rem;
    margin: 2.5rem auto 1rem;
    margin-bottom: max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem));
  }
}

@media (max-width: 480px) {
  .poem-reward-overlay {
    padding: 10px;
    padding-bottom: max(10px, env(safe-area-inset-bottom));
  }

  .poem-reward-container {
    max-height: calc(100vh - 20px);
    max-height: calc(100dvh - 20px - env(safe-area-inset-bottom));
  }

  .poem-reward-content {
    padding: 1.5rem 1rem 0.5rem;
    max-height: calc(100vh - 20px);
    max-height: calc(100dvh - 20px - env(safe-area-inset-bottom));
  }

  .poem-title {
    font-size: 1.75rem;
  }

  .poem-text {
    font-size: 1.1rem;
  }

  .poem-favorite-badge {
    font-size: 0.75rem;
    padding: 0.4rem 1rem;
  }

  .poem-close-btn {
    margin: 2rem auto 1rem;
    margin-bottom: max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem));
  }
}
`;

// Inject styles into document
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
