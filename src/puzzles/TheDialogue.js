/**
 * Act II - Puzzle 3: "The Dialogue"
 * A conversation unfolds through poetic choices
 * Each response reveals deeper layers of connection
 */

import gsap from 'gsap';
import confetti from 'canvas-confetti';

export class TheDialogue {
  constructor(onComplete) {
    this.onComplete = onComplete;

    this.element = null;
    this.currentExchange = 0;
    this.chosenPath = [];
    this.isComplete = false;

    // The dialogue exchanges - poetic questions and responses
    this.exchanges = [
      {
        prompt: "If silence could speak, what would it say?",
        choices: [
          {
            text: "It would whisper of moments we didn't need to explain",
            value: "understanding",
            color: "#FFE4E1"
          },
          {
            text: "It would sing of spaces between words that held everything",
            value: "depth",
            color: "#E8D5C4"
          },
          {
            text: "It would echo with all the things we already knew",
            value: "knowing",
            color: "#FFDAB9"
          }
        ]
      },
      {
        prompt: "What makes a memory worth keeping?",
        choices: [
          {
            text: "The way it feels like coming home, even in a fleeting moment",
            value: "belonging",
            color: "#FFB6C1"
          },
          {
            text: "How it changes you, quietly, without announcement",
            value: "transformation",
            color: "#DDA0DD"
          },
          {
            text: "The truth that lives in it, unchanged by time",
            value: "truth",
            color: "#FFD700"
          }
        ]
      },
      {
        prompt: "If you could gift someone a feeling, which would you choose?",
        choices: [
          {
            text: "The certainty of being seen, completely and without pretense",
            value: "recognition",
            color: "#FFC0CB"
          },
          {
            text: "The warmth of knowing you're thought of, even from afar",
            value: "presence",
            color: "#F0E68C"
          },
          {
            text: "The peace of being exactly who you are, with no apology needed",
            value: "acceptance",
            color: "#FFE4E1"
          }
        ]
      },
      {
        prompt: "What does connection feel like to you?",
        choices: [
          {
            text: "Like finding a rhythm you didn't know you'd been searching for",
            value: "harmony",
            color: "#E8D5C4"
          },
          {
            text: "Like recognizing something familiar in someone entirely new",
            value: "recognition",
            color: "#FFDAB9"
          },
          {
            text: "Like the quiet certainty that some things just make sense",
            value: "resonance",
            color: "#FFB6C1"
          }
        ]
      }
    ];
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
        duration: 1,
        ease: 'power2.out',
        onComplete: () => {
          this.showExchange(0);
        }
      }
    );
  }

  /**
   * Create puzzle HTML
   */
  createPuzzleElement() {
    const puzzle = document.createElement('div');
    puzzle.className = 'dialogue-puzzle';
    puzzle.innerHTML = `
      <div class="dialogue-container">
        <div class="dialogue-header">
          <div class="puzzle-title">The Dialogue</div>
          <div class="puzzle-subtitle">A conversation in poetry</div>
        </div>

        <div class="dialogue-main">
          <div class="dialogue-prompt-area">
            <!-- Prompts will appear here -->
          </div>

          <div class="dialogue-choices-area">
            <!-- Choices will appear here -->
          </div>
        </div>

        <div class="dialogue-progress">
          <div class="progress-dots">
            ${this.exchanges.map((_, i) => `<div class="progress-dot" data-index="${i}"></div>`).join('')}
          </div>
        </div>
      </div>
    `;

    return puzzle;
  }

  /**
   * Show a dialogue exchange
   */
  showExchange(index) {
    if (index >= this.exchanges.length) {
      this.complete();
      return;
    }

    const exchange = this.exchanges[index];
    const promptArea = this.element.querySelector('.dialogue-prompt-area');
    const choicesArea = this.element.querySelector('.dialogue-choices-area');

    // Clear previous
    promptArea.innerHTML = '';
    choicesArea.innerHTML = '';

    // Create prompt
    const promptEl = document.createElement('div');
    promptEl.className = 'dialogue-prompt';
    promptEl.textContent = exchange.prompt;
    promptArea.appendChild(promptEl);

    // Animate prompt in
    gsap.fromTo(promptEl,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: 'power2.out'
      }
    );

    // Create choices after prompt appears
    setTimeout(() => {
      exchange.choices.forEach((choice, i) => {
        const choiceEl = this.createChoiceElement(choice, i);
        choicesArea.appendChild(choiceEl);

        // Animate each choice in with stagger
        gsap.fromTo(choiceEl,
          { opacity: 0, x: -30, scale: 0.95 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.8,
            delay: i * 0.15,
            ease: 'back.out(1.4)'
          }
        );
      });
    }, 800);

    // Update progress dots
    this.updateProgress(index);
  }

  /**
   * Create a choice element
   */
  createChoiceElement(choice, index) {
    const choiceEl = document.createElement('div');
    choiceEl.className = 'dialogue-choice';
    choiceEl.dataset.value = choice.value;
    choiceEl.style.setProperty('--choice-color', choice.color);

    choiceEl.innerHTML = `
      <div class="choice-content">
        <div class="choice-text">${choice.text}</div>
        <div class="choice-glow"></div>
      </div>
    `;

    // Click handler
    choiceEl.addEventListener('click', () => {
      if (!choiceEl.classList.contains('selected')) {
        this.selectChoice(choiceEl, choice);
      }
    });

    // Hover effect
    choiceEl.addEventListener('mouseenter', () => {
      gsap.to(choiceEl, {
        scale: 1.02,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    choiceEl.addEventListener('mouseleave', () => {
      if (!choiceEl.classList.contains('selected')) {
        gsap.to(choiceEl, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    });

    return choiceEl;
  }

  /**
   * Handle choice selection
   */
  selectChoice(choiceEl, choice) {
    // Mark as selected
    choiceEl.classList.add('selected');
    this.chosenPath.push(choice.value);

    // Visual feedback
    gsap.to(choiceEl, {
      scale: 1.05,
      duration: 0.3,
      ease: 'back.out(2)'
    });

    // Glow effect
    const glow = choiceEl.querySelector('.choice-glow');
    gsap.fromTo(glow,
      { opacity: 0, scale: 0.8 },
      {
        opacity: 0.6,
        scale: 1.5,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(glow, {
            opacity: 0,
            duration: 0.4
          });
        }
      }
    );

    // Ripple particles
    this.createRippleEffect(choiceEl, choice.color);

    // Disable other choices
    const allChoices = this.element.querySelectorAll('.dialogue-choice');
    allChoices.forEach(el => {
      if (el !== choiceEl) {
        gsap.to(el, {
          opacity: 0.3,
          scale: 0.95,
          duration: 0.5,
          ease: 'power2.out'
        });
        el.style.pointerEvents = 'none';
      }
    });

    // Move to next exchange after delay
    setTimeout(() => {
      this.currentExchange++;
      this.showExchange(this.currentExchange);
    }, 2000);
  }

  /**
   * Create ripple effect for selected choice
   */
  createRippleEffect(element, color) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'dialogue-particle';
      particle.style.cssText = `
        position: fixed;
        width: 6px;
        height: 6px;
        background: ${color};
        border-radius: 50%;
        left: ${centerX}px;
        top: ${centerY}px;
        pointer-events: none;
        z-index: 10000;
      `;

      document.body.appendChild(particle);

      const angle = (i / 12) * Math.PI * 2;
      const distance = 60 + Math.random() * 40;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      gsap.to(particle, {
        x: tx,
        y: ty,
        opacity: 0,
        scale: 0,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => particle.remove()
      });
    }
  }

  /**
   * Update progress dots
   */
  updateProgress(currentIndex) {
    const dots = this.element.querySelectorAll('.progress-dot');
    dots.forEach((dot, i) => {
      if (i < currentIndex) {
        dot.classList.add('completed');
      } else if (i === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active', 'completed');
      }
    });
  }

  /**
   * Complete the puzzle
   */
  async complete() {
    if (this.isComplete) return;
    this.isComplete = true;

    // Beautiful confetti
    confetti({
      particleCount: 150,
      spread: 120,
      origin: { y: 0.6 },
      colors: ['#FFB6C1', '#FFE4E1', '#E8D5C4', '#FFDAB9', '#FFD700']
    });

    // Show final message
    await this.showFinalMessage();

    // Wait, then complete
    setTimeout(() => {
      if (this.onComplete) {
        this.onComplete();
      }
      this.hide();
    }, 6000);
  }

  /**
   * Show final message
   */
  async showFinalMessage() {
    const promptArea = this.element.querySelector('.dialogue-prompt-area');
    const choicesArea = this.element.querySelector('.dialogue-choices-area');

    // Fade out current content
    await gsap.to([promptArea, choicesArea], {
      opacity: 0,
      y: -20,
      duration: 0.8,
      ease: 'power2.in'
    });

    // Create final message
    const finalEl = document.createElement('div');
    finalEl.className = 'dialogue-final';
    finalEl.innerHTML = `
      <div class="final-message">
        Every answer was a mirror,<br>
        reflecting what was already known.<br>
        <br>
        Some conversations don't need words—<br>
        they're written in the choices we make.
      </div>
      <div class="final-signature">— Act II Complete</div>
    `;

    promptArea.innerHTML = '';
    promptArea.appendChild(finalEl);

    // Animate in
    gsap.fromTo(finalEl,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: 'power2.out'
      }
    );

    // Restore opacity
    promptArea.style.opacity = 1;
  }

  /**
   * Hide the puzzle
   */
  hide() {
    gsap.to(this.element, {
      opacity: 0,
      duration: 1,
      ease: 'power2.in',
      onComplete: () => {
        if (this.element && this.element.parentNode) {
          this.element.remove();
        }
      }
    });
  }
}

// Styles
const styles = `
.dialogue-puzzle {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialogue-container {
  width: 90%;
  max-width: 800px;
  height: 85vh;
  display: flex;
  flex-direction: column;
}

.dialogue-header {
  text-align: center;
  margin-bottom: 2rem;
}

.dialogue-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2rem;
}

.dialogue-prompt-area {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialogue-prompt {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2rem;
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-primary, #FFF8F0);
  text-align: center;
  padding: 0 1rem;
}

.dialogue-choices-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1rem;
}

.dialogue-choice {
  position: relative;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dialogue-choice:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--choice-color);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.dialogue-choice.selected {
  background: rgba(255, 255, 255, 0.12);
  border-color: var(--choice-color);
  box-shadow: 0 0 40px var(--choice-color);
}

.choice-content {
  position: relative;
}

.choice-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.1rem;
  font-weight: 300;
  line-height: 1.6;
  color: var(--color-primary, #FFF8F0);
}

.choice-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, var(--choice-color) 0%, transparent 70%);
  opacity: 0;
  pointer-events: none;
}

.dialogue-progress {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.progress-dots {
  display: flex;
  gap: 1rem;
}

.progress-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.progress-dot.active {
  background: var(--color-highlight, #FFB6C1);
  box-shadow: 0 0 12px var(--color-highlight, #FFB6C1);
  transform: scale(1.3);
}

.progress-dot.completed {
  background: var(--color-highlight, #FFB6C1);
  opacity: 0.6;
}

.dialogue-final {
  text-align: center;
}

.final-message {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.75rem;
  font-weight: 400;
  line-height: 1.8;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 2rem;
}

.final-signature {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 300;
  font-style: italic;
  color: var(--color-highlight, #FFB6C1);
}

@media (max-width: 768px) {
  .dialogue-container {
    width: 95%;
    height: 90vh;
  }

  .dialogue-prompt {
    font-size: 1.5rem;
  }

  .choice-text {
    font-size: 1rem;
  }

  .dialogue-choice {
    padding: 1.25rem;
  }

  .final-message {
    font-size: 1.4rem;
  }
}

@media (max-width: 480px) {
  .dialogue-prompt {
    font-size: 1.25rem;
  }

  .choice-text {
    font-size: 0.95rem;
  }

  .dialogue-choice {
    padding: 1rem;
  }

  .final-message {
    font-size: 1.25rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
