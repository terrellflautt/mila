/**
 * Act I - Puzzle 2: "The Echo Chamber"
 * Audio rhythm puzzle with chimes and visual waves
 */

import gsap from 'gsap';
import confetti from 'canvas-confetti';

export class EchoChamber {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.element = null;
    this.audioContext = null;
    this.sequence = [];
    this.userSequence = [];
    this.currentRound = 1;
    this.maxRounds = 3;
    this.chimes = [];
    this.isPlaying = false;
    this.isListening = false;
  }

  /**
   * Show the puzzle
   */
  show() {
    this.element = this.createPuzzleElement();
    document.body.appendChild(this.element);

    // Initialize Web Audio
    this.initAudio();

    // Animate in
    gsap.fromTo(this.element,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => {
          this.startRound();
        }
      }
    );
  }

  /**
   * Create puzzle HTML
   */
  createPuzzleElement() {
    const puzzle = document.createElement('div');
    puzzle.className = 'echo-chamber-puzzle';
    puzzle.innerHTML = `
      <div class="echo-container">
        <div class="echo-header">
          <div class="puzzle-title">The Echo Chamber</div>
          <div class="puzzle-instruction">Listen carefully, then echo back the rhythm</div>
        </div>

        <div class="echo-stage">
          <!-- Visual wave container -->
          <svg class="wave-visual" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#FFB6C1;stop-opacity:0.3" />
                <stop offset="50%" style="stop-color:#FFE4E1;stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:#FFB6C1;stop-opacity:0.3" />
              </linearGradient>
            </defs>
            <path class="wave-path" d="M 0 200 L 800 200" stroke="url(#waveGradient)"
                  stroke-width="3" fill="none" stroke-linecap="round"/>
            <circle class="wave-pulse" cx="400" cy="200" r="0"
                    fill="none" stroke="#FFB6C1" stroke-width="2" opacity="0"/>
          </svg>

          <!-- Chimes -->
          <div class="chimes-container">
            <div class="chime" data-note="0">
              <div class="chime-circle"></div>
              <div class="chime-label">1</div>
            </div>
            <div class="chime" data-note="1">
              <div class="chime-circle"></div>
              <div class="chime-label">2</div>
            </div>
            <div class="chime" data-note="2">
              <div class="chime-circle"></div>
              <div class="chime-label">3</div>
            </div>
            <div class="chime" data-note="3">
              <div class="chime-circle"></div>
              <div class="chime-label">4</div>
            </div>
          </div>

          <div class="status-message">Round 1 of 3</div>
        </div>

        <div class="pattern-display">
          <div class="pattern-orb pattern-orb-1"></div>
          <div class="pattern-orb pattern-orb-2"></div>
          <div class="pattern-orb pattern-orb-3"></div>
        </div>
      </div>
    `;

    return puzzle;
  }

  /**
   * Initialize Web Audio Context
   */
  initAudio() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Frequencies for our 4 chimes (pentatonic scale)
    this.chimeFrequencies = [523.25, 587.33, 659.25, 783.99]; // C5, D5, E5, G5
  }

  /**
   * Play a chime sound
   */
  playChime(noteIndex, visualize = true) {
    if (!this.audioContext) return;

    const frequency = this.chimeFrequencies[noteIndex];

    // Create oscillator (bell-like sound)
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    // Envelope for bell-like decay
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 1);

    // Visual feedback
    if (visualize) {
      this.animateChime(noteIndex);
      this.createWavePulse();
    }
  }

  /**
   * Animate chime when played
   */
  animateChime(noteIndex) {
    const chime = this.element.querySelector(`[data-note="${noteIndex}"]`);
    const circle = chime.querySelector('.chime-circle');

    gsap.timeline()
      .to(circle, {
        scale: 1.4,
        backgroundColor: 'var(--color-highlight)',
        boxShadow: '0 0 30px rgba(255, 182, 193, 0.8)',
        duration: 0.1,
        ease: 'power2.out'
      })
      .to(circle, {
        scale: 1,
        backgroundColor: 'rgba(255, 182, 193, 0.2)',
        boxShadow: '0 0 15px rgba(255, 182, 193, 0.3)',
        duration: 0.4,
        ease: 'power2.in'
      });
  }

  /**
   * Create wave pulse animation
   */
  createWavePulse() {
    const pulse = this.element.querySelector('.wave-pulse');

    gsap.timeline()
      .set(pulse, { attr: { r: 0 }, opacity: 1 })
      .to(pulse, {
        attr: { r: 80 },
        opacity: 0,
        duration: 1,
        ease: 'power2.out'
      });
  }

  /**
   * Start a new round
   */
  async startRound() {
    this.userSequence = [];
    this.isListening = false;

    const statusMsg = this.element.querySelector('.status-message');
    statusMsg.textContent = `Round ${this.currentRound} of ${this.maxRounds} - Listen...`;

    // Generate sequence (increases with rounds)
    const sequenceLength = 2 + this.currentRound;
    this.sequence = [];
    for (let i = 0; i < sequenceLength; i++) {
      this.sequence.push(Math.floor(Math.random() * 4));
    }

    // Wait a moment
    await this.wait(1000);

    // Play sequence
    await this.playSequence();

    // Now listen for user input
    this.isListening = true;
    statusMsg.textContent = 'Your turn!';
    this.enableChimes();
  }

  /**
   * Play the sequence
   */
  async playSequence() {
    this.isPlaying = true;

    for (const note of this.sequence) {
      this.playChime(note, true);
      await this.wait(600);
    }

    this.isPlaying = false;
  }

  /**
   * Enable chimes for user interaction
   */
  enableChimes() {
    const chimes = this.element.querySelectorAll('.chime');

    chimes.forEach((chime, index) => {
      chime.style.cursor = 'pointer';
      chime.style.pointerEvents = 'auto';

      const handler = () => this.handleChimeClick(index);
      const touchHandler = (e) => {
        e.preventDefault();
        this.handleChimeClick(index);
      };

      chime.addEventListener('click', handler);
      chime.addEventListener('touchend', touchHandler, { passive: false });

      chime._handler = handler;
      chime._touchHandler = touchHandler;
    });
  }

  /**
   * Disable chimes
   */
  disableChimes() {
    const chimes = this.element.querySelectorAll('.chime');

    chimes.forEach(chime => {
      chime.style.cursor = 'default';
      chime.style.pointerEvents = 'none';
      if (chime._handler) {
        chime.removeEventListener('click', chime._handler);
        delete chime._handler;
      }
      if (chime._touchHandler) {
        chime.removeEventListener('touchend', chime._touchHandler);
        delete chime._touchHandler;
      }
    });
  }

  /**
   * Handle chime click
   */
  handleChimeClick(noteIndex) {
    if (!this.isListening || this.isPlaying) return;

    this.playChime(noteIndex, true);
    this.userSequence.push(noteIndex);

    // Check if correct so far
    const currentIndex = this.userSequence.length - 1;

    if (this.userSequence[currentIndex] !== this.sequence[currentIndex]) {
      // Wrong!
      this.onIncorrect();
    } else if (this.userSequence.length === this.sequence.length) {
      // Complete and correct!
      this.onRoundComplete();
    }
  }

  /**
   * Handle incorrect sequence
   */
  async onIncorrect() {
    this.isListening = false;
    this.disableChimes();

    const statusMsg = this.element.querySelector('.status-message');
    statusMsg.textContent = 'Not quite... let\'s try again';
    statusMsg.style.color = '#ff6b6b';

    // Shake animation
    gsap.to('.chimes-container', {
      x: -10,
      duration: 0.1,
      repeat: 3,
      yoyo: true,
      onComplete: () => {
        gsap.set('.chimes-container', { x: 0 });
      }
    });

    await this.wait(1500);
    statusMsg.style.color = 'var(--color-primary)';

    // Restart round
    this.startRound();
  }

  /**
   * Handle round completion
   */
  async onRoundComplete() {
    this.isListening = false;
    this.disableChimes();

    const statusMsg = this.element.querySelector('.status-message');
    statusMsg.textContent = 'Perfect!';
    statusMsg.style.color = 'var(--color-highlight)';

    // Light up the corresponding orb
    this.lightUpOrb(this.currentRound);

    await this.wait(1000);

    if (this.currentRound >= this.maxRounds) {
      // Puzzle complete!
      this.onPuzzleComplete();
    } else {
      // Next round
      this.currentRound++;
      statusMsg.style.color = 'var(--color-primary)';
      this.startRound();
    }
  }

  /**
   * Light up pattern orb
   */
  lightUpOrb(orbNumber) {
    const orb = this.element.querySelector(`.pattern-orb-${orbNumber}`);

    gsap.to(orb, {
      scale: 1,
      opacity: 1,
      backgroundColor: 'var(--color-highlight)',
      boxShadow: '0 0 30px rgba(255, 182, 193, 0.8)',
      duration: 0.6,
      ease: 'back.out(1.4)'
    });
  }

  /**
   * Handle puzzle completion
   */
  async onPuzzleComplete() {
    const statusMsg = this.element.querySelector('.status-message');
    statusMsg.textContent = 'You found the rhythm...';

    console.log('🎵 Echo Chamber puzzle complete!');

    // All orbs pulse together
    gsap.to('.pattern-orb', {
      scale: 1.2,
      duration: 0.5,
      repeat: 2,
      yoyo: true,
      stagger: 0.1
    });

    await this.wait(1500);

    // Animate orbs flying to center and merging
    console.log('🎵 Animating orbs flying to center...');
    const orbs = this.element.querySelectorAll('.pattern-orb');
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Get the container's position to calculate relative positions
    const container = this.element.querySelector('.pattern-display');
    const containerRect = container.getBoundingClientRect();

    orbs.forEach((orb, index) => {
      const orbRect = orb.getBoundingClientRect();
      const deltaX = centerX - (orbRect.left + orbRect.width / 2);
      const deltaY = centerY - (orbRect.top + orbRect.height / 2);

      gsap.to(orb, {
        x: deltaX,
        y: deltaY,
        scale: 2,
        opacity: 1,
        duration: 1,
        delay: index * 0.1,
        ease: 'power2.inOut'
      });
    });

    await this.wait(1200);

    // Merge into single bright point
    console.log('🎵 Merging orbs...');
    gsap.to('.pattern-orb', {
      scale: 3,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.in',
      onComplete: () => {
        console.log('🎵 Animation complete, closing puzzle...');
        // Close and trigger completion flow
        this.close();
      }
    });
  }

  /**
   * Close puzzle
   */
  close() {
    // Clean up audio
    if (this.audioContext) {
      this.audioContext.close();
    }

    gsap.to(this.element, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.in',
      onComplete: () => {
        if (this.element && this.element.parentNode) {
          this.element.remove();
        }
        if (this.onComplete) {
          this.onComplete();
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
.echo-chamber-puzzle {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 100%);
  z-index: 2000;
  overflow: hidden;
}

.echo-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2rem;
}

.echo-header {
  text-align: center;
  margin-bottom: 3rem;
}

.echo-stage {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3rem;
}

.wave-visual {
  width: 100%;
  max-width: 800px;
  height: 200px;
  margin-bottom: 2rem;
}

.chimes-container {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
}

.chime {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  transition: transform 0.2s ease;
  pointer-events: none;
}

.chime:hover {
  transform: translateY(-5px);
}

.chime-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 182, 193, 0.2);
  border: 2px solid rgba(255, 182, 193, 0.4);
  box-shadow: 0 0 15px rgba(255, 182, 193, 0.3);
  transition: all 0.3s ease;
}

.chime-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-secondary, #FFE4E1);
}

.status-message {
  text-align: center;
  font-family: 'Montserrat', sans-serif;
  font-size: 1.125rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  margin-top: 2rem;
}

.pattern-display {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-top: 2rem;
}

.pattern-orb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  opacity: 0.3;
  scale: 0.8;
  transition: all 0.3s ease;
}

@media (max-width: 768px) {
  .echo-container {
    padding: 1rem;
  }

  .puzzle-title {
    font-size: 2rem;
  }

  .wave-visual {
    height: 150px;
  }

  .chimes-container {
    gap: 1rem;
  }

  .chime-circle {
    width: 60px;
    height: 60px;
  }

  .chime-label {
    font-size: 1rem;
  }

  .status-message {
    font-size: 1rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
