/**
 * Message Reveal Component
 * Beautiful curtain animation that reveals the daily message
 * Triggered when the musical instrument is played
 */

import gsap from 'gsap';
import { getDailyMessage } from '../utils/dailyMessages.js';
import { getStorageKey } from '../utils/storage.js';

export class MessageReveal {
  constructor() {
    this.element = null;
    this.isRevealing = false;
    this.hasRevealedToday = false;
    this.checkIfRevealedToday();
  }

  /**
   * Check if we've already revealed today's message
   */
  checkIfRevealedToday() {
    const today = new Date().toISOString().slice(0, 10);
    const lastReveal = localStorage.getItem(getStorageKey('last-reveal'));
    this.hasRevealedToday = (lastReveal === today);
  }

  /**
   * Reveal the daily message with curtain animation
   */
  async reveal(visitorId) {
    if (this.isRevealing) return;

    // Always show animation, but mark as revealed for today
    this.isRevealing = true;
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(getStorageKey('last-reveal'), today);
    this.hasRevealedToday = true;

    // Get today's message
    const message = getDailyMessage(visitorId);

    // Create reveal element
    this.element = this.createRevealElement(message);
    document.body.appendChild(this.element);

    // Animate sequence
    await this.animateCurtainReveal();

    // Auto-hide after reading time (longer for longer messages)
    const readingTime = Math.max(8000, message.length * 100);
    setTimeout(() => {
      this.hide();
    }, readingTime);
  }

  /**
   * Create the reveal HTML
   */
  createRevealElement(message) {
    const reveal = document.createElement('div');
    reveal.className = 'message-reveal-overlay';

    reveal.innerHTML = `
      <div class="message-reveal-stage">
        <!-- Left curtain -->
        <div class="reveal-curtain reveal-curtain-left">
          <div class="curtain-fabric curtain-fabric-left"></div>
          <div class="curtain-tassel curtain-tassel-left"></div>
        </div>

        <!-- Right curtain -->
        <div class="reveal-curtain reveal-curtain-right">
          <div class="curtain-fabric curtain-fabric-right"></div>
          <div class="curtain-tassel curtain-tassel-right"></div>
        </div>

        <!-- Message (hidden behind curtains initially) -->
        <div class="reveal-message-container">
          <div class="reveal-spotlight"></div>
          <div class="reveal-message">
            <div class="reveal-message-text">${message}</div>
            <div class="reveal-message-signature">— T.K.</div>
          </div>
        </div>

        <!-- Close button -->
        <button class="reveal-close" aria-label="Close">
          <span>✕</span>
        </button>

        <!-- Particles -->
        <div class="reveal-particles"></div>
      </div>
    `;

    // Add close handler
    const closeBtn = reveal.querySelector('.reveal-close');
    closeBtn.addEventListener('click', () => this.hide());

    // Click outside to close
    reveal.addEventListener('click', (e) => {
      if (e.target === reveal) {
        this.hide();
      }
    });

    return reveal;
  }

  /**
   * Animate the curtain reveal sequence
   */
  async animateCurtainReveal() {
    const leftCurtain = this.element.querySelector('.reveal-curtain-left');
    const rightCurtain = this.element.querySelector('.reveal-curtain-right');
    const message = this.element.querySelector('.reveal-message');
    const spotlight = this.element.querySelector('.reveal-spotlight');
    const closeBtn = this.element.querySelector('.reveal-close');

    // Create timeline
    const tl = gsap.timeline();

    // 1. Fade in overlay
    tl.fromTo(this.element,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: 'power2.inOut' }
    );

    // 2. Curtains wave slightly (anticipation)
    tl.to([leftCurtain, rightCurtain], {
      scaleX: 1.02,
      duration: 0.8,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: 1
    }, '+=0.3');

    // 3. Spotlight fades in
    tl.to(spotlight, {
      opacity: 0.3,
      scale: 1.5,
      duration: 1,
      ease: 'power2.out'
    }, '-=0.5');

    // 4. Curtains part dramatically
    tl.to(leftCurtain, {
      x: '-100%',
      duration: 2,
      ease: 'power3.inOut'
    }, '+=0.3');

    tl.to(rightCurtain, {
      x: '100%',
      duration: 2,
      ease: 'power3.inOut'
    }, '<');

    // 5. Message fades in with elegant timing
    tl.fromTo(message,
      {
        opacity: 0,
        y: 30,
        scale: 0.95
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.5,
        ease: 'power2.out'
      },
      '-=1.2'
    );

    // 6. Spotlight pulses gently
    tl.to(spotlight, {
      scale: 1.6,
      duration: 3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1
    }, '<');

    // 7. Close button fades in
    tl.fromTo(closeBtn,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'power2.out' },
      '-=0.5'
    );

    // 8. Create floating particles
    this.createFloatingParticles();

    return tl;
  }

  /**
   * Create beautiful floating particles in the background
   */
  createFloatingParticles() {
    const container = this.element.querySelector('.reveal-particles');
    const colors = ['#FFB6C1', '#FFE4E1', '#E8D5C4', '#FFDAB9'];

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'reveal-particle';
      particle.style.cssText = `
        position: absolute;
        width: ${4 + Math.random() * 6}px;
        height: ${4 + Math.random() * 6}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        opacity: ${0.3 + Math.random() * 0.4};
        pointer-events: none;
      `;

      container.appendChild(particle);

      // Animate particle floating
      gsap.to(particle, {
        y: -50 - Math.random() * 100,
        x: (Math.random() - 0.5) * 100,
        opacity: 0,
        duration: 3 + Math.random() * 4,
        ease: 'power1.out',
        repeat: -1,
        delay: Math.random() * 2
      });
    }
  }

  /**
   * Hide the reveal with animation
   */
  hide() {
    if (!this.element) return;

    const tl = gsap.timeline({
      onComplete: () => {
        if (this.element && this.element.parentNode) {
          this.element.remove();
        }
        this.element = null;
        this.isRevealing = false;
      }
    });

    // Close curtains
    tl.to(this.element.querySelector('.reveal-curtain-left'), {
      x: 0,
      duration: 1.5,
      ease: 'power3.inOut'
    });

    tl.to(this.element.querySelector('.reveal-curtain-right'), {
      x: 0,
      duration: 1.5,
      ease: 'power3.inOut'
    }, '<');

    // Fade out overlay
    tl.to(this.element, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.in'
    }, '-=0.5');
  }
}

// Styles
const styles = `
.message-reveal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-reveal-stage {
  position: relative;
  width: 90%;
  max-width: 800px;
  height: 70vh;
  max-height: 600px;
  overflow: hidden;
}

.reveal-curtain {
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  z-index: 10;
  transition: transform 0.3s ease;
}

.reveal-curtain-left {
  left: 0;
}

.reveal-curtain-right {
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

.curtain-fabric-left {
  border-right: 2px solid rgba(255, 255, 255, 0.2);
}

.curtain-fabric-right {
  border-left: 2px solid rgba(255, 255, 255, 0.2);
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
  z-index: 1;
}

.curtain-fabric::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100px;
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
  z-index: 2;
}

.curtain-tassel {
  position: absolute;
  width: 35px;
  height: 70px;
  /* Rich gold tassel with detailed shading */
  background:
    radial-gradient(ellipse 60% 40% at 50% 20%,
      rgba(255, 215, 0, 0.3) 0%,
      transparent 60%
    ),
    linear-gradient(180deg,
      #FFD700 0%,
      #DAA520 15%,
      #B8860B 35%,
      #8B6914 60%,
      #705C1A 80%,
      #5C4A16 100%
    );
  border-radius: 0 0 50% 50%;
  top: 18%;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.6),
    inset -2px 2px 6px rgba(255, 215, 0, 0.4),
    inset 2px -2px 6px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(218, 165, 32, 0.4);
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.curtain-tassel-left {
  right: 10px;
}

.curtain-tassel-right {
  left: 10px;
}

.curtain-tassel::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 18px;
  /* Ornate gold sphere at bottom of tassel */
  background:
    radial-gradient(circle at 30% 30%,
      #FFFACD 0%,
      #FFD700 30%,
      #DAA520 60%,
      #B8860B 100%
    );
  border-radius: 50%;
  box-shadow:
    0 3px 10px rgba(0, 0, 0, 0.6),
    inset -2px -2px 4px rgba(0, 0, 0, 0.4),
    inset 2px 2px 4px rgba(255, 250, 205, 0.6),
    0 0 15px rgba(255, 215, 0, 0.6);
  border: 1px solid rgba(184, 134, 11, 0.8);
}

.reveal-message-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.reveal-spotlight {
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  opacity: 0;
}

.reveal-message {
  position: relative;
  max-width: 600px;
  padding: 2rem;
  text-align: center;
  z-index: 6;
}

.reveal-message-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2rem;
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 2rem;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
}

.reveal-message-signature {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 400;
  font-style: italic;
  color: var(--color-highlight, #FFB6C1);
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.5);
}

.reveal-close {
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: var(--color-primary, #FFF8F0);
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  transition: all 0.3s ease;
  opacity: 0;
}

.reveal-close:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: rotate(90deg);
}

.reveal-particles {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

@media (max-width: 768px) {
  .message-reveal-stage {
    width: 95%;
    height: 80vh;
  }

  .reveal-message {
    padding: 1.5rem;
  }

  .reveal-message-text {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .reveal-message-signature {
    font-size: 1.25rem;
  }

  .reveal-close {
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }

  .curtain-tassel {
    width: 20px;
    height: 40px;
  }
}

@media (max-width: 480px) {
  .reveal-message-text {
    font-size: 1.25rem;
  }

  .reveal-message-signature {
    font-size: 1.1rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
