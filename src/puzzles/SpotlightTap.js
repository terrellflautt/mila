/**
 * Spotlight Tap Puzzle (Act I - Puzzle 1)
 * Tap three spotlights in the correct sequence
 * Difficulty: Easy - welcoming first interaction
 */

import gsap from 'gsap';
import confetti from 'canvas-confetti';

export class SpotlightTap {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.spotlights = [];
    this.sequence = []; // Correct sequence
    this.userSequence = []; // User's attempts
    this.isActive = false;
    this.element = null;
  }

  /**
   * Initialize and show puzzle
   */
  show() {
    this.element = this.createPuzzleElement();
    document.body.appendChild(this.element);

    // Animate in
    gsap.fromTo(this.element,
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: 'back.out(1.4)',
        onComplete: () => {
          this.startPuzzle();
        }
      }
    );
  }

  /**
   * Create puzzle UI
   */
  createPuzzleElement() {
    const puzzle = document.createElement('div');
    puzzle.className = 'spotlight-puzzle';
    puzzle.innerHTML = `
      <div class="puzzle-container">
        <div class="puzzle-header">
          <div class="puzzle-title">First Light</div>
          <div class="puzzle-instruction">Watch the sequence, then tap in order</div>
        </div>

        <div class="spotlights-container">
          <div class="spotlight" data-id="0">
            <div class="spotlight-beam"></div>
            <div class="spotlight-number">1</div>
          </div>
          <div class="spotlight" data-id="1">
            <div class="spotlight-beam"></div>
            <div class="spotlight-number">2</div>
          </div>
          <div class="spotlight" data-id="2">
            <div class="spotlight-beam"></div>
            <div class="spotlight-number">3</div>
          </div>
        </div>

        <div class="puzzle-status"></div>

        <button class="puzzle-hint-btn">Need a hint?</button>
      </div>
    `;

    return puzzle;
  }

  /**
   * Start puzzle sequence
   */
  async startPuzzle() {
    // Generate sequence
    this.sequence = [0, 1, 2]; // Simple left to right for first puzzle

    // Show sequence to user
    await this.showSequence();

    // Enable interaction
    this.enableInteraction();
  }

  /**
   * Show sequence animation
   */
  async showSequence() {
    const status = this.element.querySelector('.puzzle-status');
    status.textContent = 'Watch carefully...';

    for (const spotlightId of this.sequence) {
      await this.flashSpotlight(spotlightId);
      await this.wait(800);
    }

    status.textContent = 'Your turn! Tap them in order.';
  }

  /**
   * Flash spotlight animation
   */
  flashSpotlight(id) {
    return new Promise((resolve) => {
      const spotlight = this.element.querySelector(`[data-id="${id}"]`);
      const beam = spotlight.querySelector('.spotlight-beam');

      spotlight.classList.add('active');

      gsap.to(beam, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
        onComplete: () => {
          setTimeout(() => {
            gsap.to(beam, {
              opacity: 0,
              scale: 0.8,
              duration: 0.3,
              ease: 'power2.in',
              onComplete: () => {
                spotlight.classList.remove('active');
                resolve();
              }
            });
          }, 500);
        }
      });
    });
  }

  /**
   * Enable user interaction
   */
  enableInteraction() {
    this.isActive = true;
    const spotlights = this.element.querySelectorAll('.spotlight');

    spotlights.forEach((spotlight, index) => {
      spotlight.style.cursor = 'pointer';
      spotlight.addEventListener('click', () => this.handleTap(index));
    });

    // Hint button
    const hintBtn = this.element.querySelector('.puzzle-hint-btn');
    hintBtn.addEventListener('click', () => this.showHint());
  }

  /**
   * Handle spotlight tap
   */
  async handleTap(id) {
    if (!this.isActive) return;

    this.userSequence.push(id);
    await this.flashSpotlight(id);

    // Check if correct
    const currentIndex = this.userSequence.length - 1;
    if (this.userSequence[currentIndex] !== this.sequence[currentIndex]) {
      this.onIncorrect();
    } else if (this.userSequence.length === this.sequence.length) {
      this.onCorrect();
    }
  }

  /**
   * Handle incorrect answer
   */
  async onIncorrect() {
    this.isActive = false;
    const status = this.element.querySelector('.puzzle-status');
    status.textContent = 'Not quite... let\'s try again';
    status.style.color = '#ff6b6b';

    // Shake animation
    gsap.to(this.element.querySelector('.puzzle-container'), {
      x: -10,
      duration: 0.1,
      repeat: 3,
      yoyo: true,
      onComplete: () => {
        gsap.to(this.element.querySelector('.puzzle-container'), { x: 0 });
      }
    });

    await this.wait(1500);

    // Reset and show sequence again
    this.userSequence = [];
    status.style.color = 'var(--color-primary)';
    await this.showSequence();
    this.isActive = true;
  }

  /**
   * Handle correct answer
   */
  async onCorrect() {
    this.isActive = false;
    const status = this.element.querySelector('.puzzle-status');
    status.textContent = 'Perfect! ✨';
    status.style.color = 'var(--color-highlight)';

    // All spotlights flash together
    await Promise.all([
      this.flashSpotlight(0),
      this.flashSpotlight(1),
      this.flashSpotlight(2)
    ]);

    // Confetti celebration
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#FFB6C1', '#FFE4E1', '#E8D5C4']
    });

    await this.wait(1000);

    // Show reward
    this.showReward();
  }

  /**
   * Show puzzle hint
   */
  showHint() {
    const status = this.element.querySelector('.puzzle-status');
    status.textContent = 'Try left to right... 1, 2, 3';
    status.style.color = 'var(--color-highlight)';

    setTimeout(() => {
      status.textContent = 'Your turn! Tap them in order.';
      status.style.color = 'var(--color-primary)';
    }, 3000);
  }

  /**
   * Show reward after completion
   */
  showReward() {
    const reward = document.createElement('div');
    reward.className = 'puzzle-reward';
    reward.innerHTML = `
      <div class="reward-content">
        <div class="reward-title">You discovered something</div>
        <div class="reward-poem">
          "I remember the way quiet made your laugh louder."
        </div>
        <div class="reward-description">
          A poem line, just for you.
        </div>
        <button class="reward-continue-btn">Continue</button>
      </div>
    `;

    this.element.appendChild(reward);

    gsap.fromTo(reward,
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.4)'
      }
    );

    // Continue button
    const continueBtn = reward.querySelector('.reward-continue-btn');
    continueBtn.addEventListener('click', () => {
      this.close();
    });
  }

  /**
   * Close puzzle
   */
  close() {
    gsap.to(this.element, {
      opacity: 0,
      scale: 0.9,
      duration: 0.6,
      ease: 'power2.in',
      onComplete: () => {
        this.element.remove();
        if (this.onComplete) {
          this.onComplete({
            puzzleId: 'spotlight-tap',
            completed: true,
            attempts: Math.ceil(this.userSequence.length / this.sequence.length)
          });
        }
      }
    });
  }

  /**
   * Utility wait function
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Styles
const styles = `
.spotlight-puzzle {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 2000;
  padding: 20px;
}

.puzzle-container {
  max-width: 600px;
  width: 100%;
  background: rgba(20, 20, 20, 0.9);
  border-radius: 20px;
  padding: 2.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.puzzle-header {
  text-align: center;
  margin-bottom: 3rem;
}

.puzzle-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 0.5rem;
}

.puzzle-instruction {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 300;
  color: var(--color-secondary, #FFE4E1);
}

.spotlights-container {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.spotlight {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.spotlight:hover {
  transform: scale(1.1);
}

.spotlight-beam {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, var(--color-highlight, #FFB6C1) 0%, transparent 70%);
  border-radius: 50%;
  opacity: 0;
  scale: 0.8;
}

.spotlight.active .spotlight-beam {
  opacity: 1;
  scale: 1;
}

.spotlight-number {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  z-index: 1;
}

.puzzle-status {
  text-align: center;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  min-height: 1.5rem;
  margin-bottom: 1.5rem;
}

.puzzle-hint-btn {
  display: block;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.puzzle-hint-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-highlight, #FFB6C1);
  border-color: var(--color-highlight, #FFB6C1);
}

.puzzle-reward {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 500px;
  background: rgba(0, 0, 0, 0.95);
  border-radius: 20px;
  padding: 3rem;
  border: 1px solid var(--color-highlight, #FFB6C1);
  text-align: center;
}

.reward-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--color-highlight, #FFB6C1);
  margin-bottom: 1.5rem;
}

.reward-poem {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.75rem;
  font-weight: 400;
  font-style: italic;
  color: var(--color-primary, #FFF8F0);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.reward-description {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 300;
  color: var(--color-secondary, #FFE4E1);
  margin-bottom: 2rem;
}

.reward-continue-btn {
  padding: 1rem 2rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  background: var(--color-highlight, #FFB6C1);
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.reward-continue-btn:hover {
  background: var(--color-secondary, #FFE4E1);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .puzzle-container {
    padding: 1.5rem;
  }

  .puzzle-title {
    font-size: 1.5rem;
  }

  .spotlights-container {
    gap: 1rem;
  }

  .spotlight {
    width: 80px;
    height: 80px;
  }

  .spotlight-number {
    font-size: 2.5rem;
  }

  .puzzle-reward {
    padding: 2rem;
  }

  .reward-poem {
    font-size: 1.5rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
