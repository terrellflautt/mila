/**
 * Act I - Puzzle 1: "The Curtain Rises"
 * Draggable curtains that reveal a poem line and a Three.js dancer
 */

import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import confetti from 'canvas-confetti';

gsap.registerPlugin(Draggable);

export class CurtainRises {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.element = null;
    this.leftCurtainPos = 0;
    this.rightCurtainPos = 0;
    this.revealThreshold = 200; // pixels curtains must move
    this.isRevealed = false;
  }

  /**
   * Show the puzzle
   */
  show() {
    this.element = this.createPuzzleElement();
    document.body.appendChild(this.element);

    // Animate in
    gsap.fromTo(this.element,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => {
          this.initDraggable();
        }
      }
    );
  }

  /**
   * Create puzzle HTML
   */
  createPuzzleElement() {
    const puzzle = document.createElement('div');
    puzzle.className = 'curtain-rises-puzzle';
    puzzle.innerHTML = `
      <div class="curtain-container">
        <div class="curtain-header">
          <div class="puzzle-title">The Curtain Rises</div>
          <div class="puzzle-instruction">Drag the curtains to reveal what waits behind</div>
        </div>

        <div class="stage-area">
          <!-- Hidden content behind curtains -->
          <div class="hidden-content">
            <div class="poem-line">
              "Before the stage knew your name,<br/>
              it already waited for your light."
            </div>
            <div class="dancer-silhouette"></div>
          </div>

          <!-- Left curtain -->
          <div class="curtain curtain-left">
            <div class="curtain-fabric"></div>
            <div class="curtain-handle">
              <div class="handle-icon">👈</div>
              <div class="handle-text">Drag</div>
            </div>
          </div>

          <!-- Right curtain -->
          <div class="curtain curtain-right">
            <div class="curtain-fabric"></div>
            <div class="curtain-handle">
              <div class="handle-icon">👉</div>
              <div class="handle-text">Drag</div>
            </div>
          </div>

          <div class="progress-indicator">
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            <div class="progress-text">Keep going...</div>
          </div>
        </div>
      </div>
    `;

    return puzzle;
  }

  /**
   * Initialize draggable curtains
   */
  initDraggable() {
    const leftCurtain = this.element.querySelector('.curtain-left');
    const rightCurtain = this.element.querySelector('.curtain-right');
    const progressFill = this.element.querySelector('.progress-fill');
    const progressText = this.element.querySelector('.progress-text');

    // Left curtain draggable
    Draggable.create(leftCurtain, {
      type: 'x',
      bounds: {
        minX: -this.revealThreshold,
        maxX: 0
      },
      inertia: true,
      onDrag: () => {
        this.leftCurtainPos = Math.abs(gsap.getProperty(leftCurtain, 'x'));
        this.checkProgress();
      },
      onDragEnd: () => {
        this.checkCompletion();
      }
    });

    // Right curtain draggable
    Draggable.create(rightCurtain, {
      type: 'x',
      bounds: {
        minX: 0,
        maxX: this.revealThreshold
      },
      inertia: true,
      onDrag: () => {
        this.rightCurtainPos = Math.abs(gsap.getProperty(rightCurtain, 'x'));
        this.checkProgress();
      },
      onDragEnd: () => {
        this.checkCompletion();
      }
    });

    // Pulse the handles
    gsap.to('.curtain-handle', {
      scale: 1.1,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }

  /**
   * Check progress as curtains are dragged
   */
  checkProgress() {
    const totalProgress = (this.leftCurtainPos + this.rightCurtainPos) / (this.revealThreshold * 2);
    const progressFill = this.element.querySelector('.progress-fill');
    const progressText = this.element.querySelector('.progress-text');

    gsap.to(progressFill, {
      width: `${totalProgress * 100}%`,
      duration: 0.2
    });

    if (totalProgress > 0.5 && totalProgress < 1) {
      progressText.textContent = 'Almost there...';
    } else if (totalProgress === 0) {
      progressText.textContent = 'Keep going...';
    }

    // Fade in hidden content as curtains open
    const hiddenContent = this.element.querySelector('.hidden-content');
    gsap.to(hiddenContent, {
      opacity: totalProgress,
      duration: 0.3
    });
  }

  /**
   * Check if curtains are fully open
   */
  checkCompletion() {
    if (this.isRevealed) return;

    const totalProgress = (this.leftCurtainPos + this.rightCurtainPos) / (this.revealThreshold * 2);

    if (totalProgress >= 0.95) {
      this.isRevealed = true;
      this.onReveal();
    }
  }

  /**
   * Handle successful reveal
   */
  onReveal() {
    const progressText = this.element.querySelector('.progress-text');
    progressText.textContent = 'The stage is yours...';

    // Disable dragging
    Draggable.get('.curtain-left').disable();
    Draggable.get('.curtain-right').disable();

    // Animate handles away
    gsap.to('.curtain-handle', {
      opacity: 0,
      duration: 0.5
    });

    // Animate dancer silhouette
    this.animateDancer();

    // Confetti after a delay
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FFB6C1', '#FFE4E1', '#E8D5C4']
      });
    }, 1500);

    // Show continue button
    setTimeout(() => {
      this.showContinueButton();
    }, 3000);
  }

  /**
   * Animate the dancer silhouette
   */
  animateDancer() {
    const dancer = this.element.querySelector('.dancer-silhouette');

    // Fade in
    gsap.to(dancer, {
      opacity: 1,
      scale: 1,
      duration: 1.5,
      ease: 'power2.out'
    });

    // Bow animation
    setTimeout(() => {
      gsap.to(dancer, {
        rotationX: 15,
        duration: 1,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: 1
      });
    }, 1500);
  }

  /**
   * Show continue button
   */
  showContinueButton() {
    const button = document.createElement('button');
    button.className = 'curtain-continue-btn';
    button.textContent = 'Ready for the next act?';

    const stageArea = this.element.querySelector('.stage-area');
    stageArea.appendChild(button);

    gsap.fromTo(button,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'back.out(1.4)'
      }
    );

    button.addEventListener('click', () => {
      this.close();
    });
  }

  /**
   * Close the puzzle
   */
  close() {
    gsap.to(this.element, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.in',
      onComplete: () => {
        this.element.remove();
        if (this.onComplete) {
          this.onComplete({
            puzzleId: 'curtain-rises',
            completed: true,
            poemLine: "Before the stage knew your name, it already waited for your light."
          });
        }
      }
    });
  }
}

// Styles
const styles = `
.curtain-rises-puzzle {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  z-index: 2000;
  overflow: hidden;
}

.curtain-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.curtain-header {
  text-align: center;
  padding: 3rem 2rem 2rem;
  background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%);
  position: relative;
  z-index: 10;
}

.puzzle-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.5rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 0.5rem;
}

.puzzle-instruction {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 300;
  font-style: italic;
  color: var(--color-secondary, #FFE4E1);
}

.stage-area {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hidden-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  opacity: 0;
  z-index: 1;
  max-width: 80%;
}

.poem-line {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2rem;
  font-weight: 400;
  font-style: italic;
  color: var(--color-primary, #FFF8F0);
  line-height: 1.6;
  margin-bottom: 3rem;
  text-shadow: 0 2px 10px rgba(255, 182, 193, 0.3);
}

.dancer-silhouette {
  width: 120px;
  height: 180px;
  margin: 0 auto;
  background: linear-gradient(180deg, var(--color-highlight, #FFB6C1) 0%, transparent 100%);
  clip-path: polygon(50% 0%, 60% 15%, 65% 40%, 70% 70%, 65% 100%, 50% 95%, 35% 100%, 30% 70%, 35% 40%, 40% 15%);
  opacity: 0;
  transform: scale(0.8);
  filter: blur(2px);
}

.curtain {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  z-index: 5;
  cursor: grab;
  touch-action: none;
}

.curtain:active {
  cursor: grabbing;
}

.curtain-left {
  left: 0;
}

.curtain-right {
  right: 0;
}

.curtain-fabric {
  width: 100%;
  height: 100%;
  background:
    /* Stage light highlights from top */
    radial-gradient(ellipse 100% 30% at 50% 0%,
      rgba(255, 200, 150, 0.15) 0%,
      transparent 50%
    ),
    /* Center spotlight glow */
    radial-gradient(ellipse 60% 40% at 50% 40%,
      rgba(220, 20, 60, 0.2) 0%,
      transparent 70%
    ),
    /* Subtle edge lighting from stage */
    linear-gradient(90deg,
      rgba(255, 255, 255, 0.08) 0%,
      transparent 3%,
      transparent 97%,
      rgba(255, 255, 255, 0.08) 100%
    ),
    /* Deep burgundy/maroon velvet with realistic folds */
    linear-gradient(90deg,
      #4A0E0E 0%,
      #6B0000 5%,
      #722F37 12%,
      #8B0000 18%,
      #A0153E 25%,
      #8B0000 32%,
      #6B0E23 38%,
      #7F1734 45%,
      #8B0000 50%,
      #7F1734 55%,
      #6B0E23 62%,
      #8B0000 68%,
      #A0153E 75%,
      #8B0000 82%,
      #722F37 88%,
      #6B0000 95%,
      #4A0E0E 100%
    );
  box-shadow:
    /* Deep inset shadows for fabric folds */
    inset -15px 0 50px rgba(0, 0, 0, 0.8),
    inset 15px 0 50px rgba(0, 0, 0, 0.8),
    inset 0 -30px 80px rgba(0, 0, 0, 0.7),
    inset 0 30px 60px rgba(0, 0, 0, 0.5),
    /* Subtle burgundy inner glow */
    inset 0 0 100px rgba(80, 10, 20, 0.6),
    /* External dramatic shadows */
    0 0 60px rgba(0, 0, 0, 0.9),
    0 15px 50px rgba(0, 0, 0, 0.8),
    /* Rich red ambient glow */
    0 20px 60px rgba(139, 0, 0, 0.5),
    0 0 100px rgba(80, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
}

.curtain-fabric::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  /* Enhanced velvet pleating with deep folds and highlights */
  background:
    /* Fine fabric texture overlay */
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      rgba(0, 0, 0, 0.1) 1px,
      transparent 2px
    ),
    /* Deep vertical pleats with shadows and highlights */
    repeating-linear-gradient(
      0deg,
      transparent 0px,
      rgba(0, 0, 0, 0.4) 3px,
      rgba(0, 0, 0, 0.5) 6px,
      rgba(0, 0, 0, 0.3) 9px,
      transparent 12px,
      rgba(255, 255, 255, 0.02) 15px,
      rgba(255, 255, 255, 0.04) 18px,
      rgba(255, 255, 255, 0.02) 21px,
      transparent 24px,
      rgba(100, 0, 0, 0.15) 28px,
      rgba(80, 0, 0, 0.2) 32px,
      rgba(100, 0, 0, 0.15) 36px,
      transparent 40px
    );
  opacity: 0.9;
  pointer-events: none;
}

.curtain-fabric::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  /* Ornate gold valance with detailed texture */
  background:
    /* Gold fabric texture */
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      rgba(0, 0, 0, 0.15) 4px,
      transparent 8px,
      rgba(255, 215, 0, 0.1) 12px,
      transparent 16px
    ),
    /* Rich gold gradient with depth */
    linear-gradient(180deg,
      #705C1A 0%,
      #8B6914 5%,
      #B8860B 15%,
      #DAA520 25%,
      #FFD700 35%,
      #DAA520 45%,
      #B8860B 55%,
      #8B6914 70%,
      #705C1A 85%,
      transparent 100%
    );
  box-shadow:
    /* Dramatic drop shadow */
    0 8px 20px rgba(0, 0, 0, 0.7),
    0 4px 12px rgba(0, 0, 0, 0.5),
    /* Inner highlights and shadows */
    inset 0 -3px 8px rgba(255, 215, 0, 0.4),
    inset 0 3px 8px rgba(0, 0, 0, 0.3),
    /* Golden glow */
    0 2px 30px rgba(218, 165, 32, 0.3);
  border-bottom: 4px solid rgba(218, 165, 32, 0.9);
  border-top: 2px solid rgba(255, 215, 0, 0.3);
  pointer-events: none;
}

.curtain-handle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.3);
  padding: 1.5rem 1rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

.curtain-left .curtain-handle {
  right: 2rem;
}

.curtain-right .curtain-handle {
  left: 2rem;
}

.handle-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  animation: wiggle 1.5s ease-in-out infinite;
}

@keyframes wiggle {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(5px); }
}

.handle-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary, #FFF8F0);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.progress-indicator {
  position: absolute;
  bottom: 4rem;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  text-align: center;
  z-index: 10;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progress-fill {
  width: 0%;
  height: 100%;
  background: linear-gradient(90deg, var(--color-highlight, #FFB6C1), var(--color-secondary, #FFE4E1));
  transition: width 0.2s ease;
}

.progress-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-secondary, #FFE4E1);
}

.curtain-continue-btn {
  position: absolute;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 2.5rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  background: var(--color-highlight, #FFB6C1);
  color: #1a1a1a;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 182, 193, 0.3);
  z-index: 20;
}

.curtain-continue-btn:hover {
  background: var(--color-secondary, #FFE4E1);
  transform: translateX(-50%) translateY(-3px);
  box-shadow: 0 6px 25px rgba(255, 182, 193, 0.5);
}

@media (max-width: 768px) {
  .puzzle-title {
    font-size: 2rem;
  }

  .poem-line {
    font-size: 1.5rem;
  }

  .curtain-handle {
    padding: 1rem 0.75rem;
  }

  .handle-icon {
    font-size: 1.5rem;
  }

  .progress-indicator {
    width: 250px;
    bottom: 3rem;
  }

  .curtain-continue-btn {
    bottom: 2rem;
    padding: 0.875rem 2rem;
    font-size: 0.875rem;
  }

  .curtain-fabric::after {
    height: 80px;
    border-bottom-width: 2px;
  }
}

@media (max-width: 480px) {
  .puzzle-title {
    font-size: 1.75rem;
    padding: 0 1rem;
  }

  .curtain-fabric::after {
    height: 60px;
    border-bottom-width: 2px;
  }

  .curtain-handle {
    padding: 0.75rem 0.5rem;
  }

  .handle-icon {
    font-size: 1.25rem;
  }

  .handle-text {
    font-size: 0.75rem;
  }

  .progress-indicator {
    width: 200px;
    bottom: 2rem;
  }

  .progress-text {
    font-size: 0.75rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
