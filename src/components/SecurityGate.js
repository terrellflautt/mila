/**
 * Security Gate Component
 * The entrance to Mila's World - only she can enter
 */

import { grantAccess, getStorageKey } from '../utils/storage.js';
import gsap from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

gsap.registerPlugin(MotionPathPlugin);

export class SecurityGate {
  constructor(onSuccess) {
    this.onSuccess = onSuccess;
    this.element = null;
    this.attempts = 0;
    this.currentQuestion = 0;

    // Security questions - first is always flamingos, others for new device verification
    this.securityQuestions = [
      {
        id: 'first_meeting',
        question: '"What was on my shirt the first time we met?"',
        answers: ['flamingo', 'flamingos'],
        isMain: true
      },
      {
        id: 'first_date_socks',
        question: '"What was on the socks I wore to our first date?"',
        answers: ['cactus', 'cacti'],
        isMain: false
      },
      {
        id: 'first_date_car',
        question: '"What color was the car I drove to our first date?"',
        answers: ['silver', 'grey', 'gray'],
        isMain: false
      },
      {
        id: 'favorite_movie',
        question: '"What did I say my favorite movie was?"',
        answers: ['tombstone'],
        isMain: false
      }
    ];
  }

  /**
   * Check if this is a new device
   */
  isNewDevice() {
    // TEMPORARILY DISABLED: Always return false (device is known) for testing
    return false;

    // Original code (re-enable after testing):
    // const knownDevices = JSON.parse(localStorage.getItem(getStorageKey('verified-devices')) || '[]');
    // const currentDevice = this.getDeviceFingerprint();
    // return !knownDevices.includes(currentDevice);
  }

  /**
   * Mark current device as verified
   */
  markDeviceVerified() {
    const knownDevices = JSON.parse(localStorage.getItem(getStorageKey('verified-devices')) || '[]');
    const currentDevice = this.getDeviceFingerprint();

    if (!knownDevices.includes(currentDevice)) {
      knownDevices.push(currentDevice);
      localStorage.setItem(getStorageKey('verified-devices'), JSON.stringify(knownDevices));
    }
  }

  /**
   * Get device fingerprint
   */
  getDeviceFingerprint() {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset()
    ];
    return btoa(components.join('|'));
  }

  /**
   * Check if answer is correct for current question
   */
  checkAnswer(input) {
    const cleaned = (input || '').trim().toLowerCase();
    const currentQ = this.securityQuestions[this.currentQuestion];

    return currentQ.answers.some(validAnswer =>
      cleaned === validAnswer || cleaned.includes(validAnswer)
    );
  }

  /**
   * Create and show the gate
   */
  show() {
    this.element = this.createGateElement();
    document.body.appendChild(this.element);

    // Animate in
    gsap.fromTo(this.element,
      { opacity: 0, scale: 0.95 },
      {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: 'power2.out'
      }
    );
  }

  /**
   * Create gate HTML
   */
  createGateElement() {
    const gate = document.createElement('div');
    gate.className = 'security-gate';

    const isNewDevice = this.isNewDevice();
    const currentQ = this.securityQuestions[this.currentQuestion];

    const questionText = isNewDevice && this.currentQuestion === 0
      ? 'Prove you are actually the girl of my dreams:'
      : isNewDevice
        ? 'This doesnt look like Mila\'s device, prove to me that you\'re her:'
        : 'Prove you are Mila by answering one simple question:';

    gate.innerHTML = `
      <div class="gate-content">
        <div class="gate-title">
          You are trying to enter T.K.'s heart.
        </div>

        <div class="gate-subtitle">
          Only Mila is allowed in here.
        </div>

        ${isNewDevice && this.currentQuestion > 0 ? `
          <div class="gate-new-device-notice">
            🔒 New device detected - additional verification required
          </div>
        ` : ''}

        <div class="gate-question">
          ${questionText}
        </div>

        <div class="gate-prompt">
          ${currentQ.question}
        </div>

        <input
          type="text"
          class="gate-input"
          placeholder="Type your answer..."
          autocomplete="off"
          autocapitalize="off"
        />

        <button class="gate-button">Enter</button>

        ${isNewDevice && this.currentQuestion > 0 ? `
          <div class="gate-progress">
            Question ${this.currentQuestion + 1} of ${this.securityQuestions.length}
          </div>
        ` : ''}

        <div class="gate-error"></div>
      </div>
    `;

    // Add event listeners
    const input = gate.querySelector('.gate-input');
    const button = gate.querySelector('.gate-button');

    button.addEventListener('click', () => this.handleSubmit(input.value));
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSubmit(input.value);
    });

    // Focus input
    setTimeout(() => input.focus(), 1000);

    return gate;
  }

  /**
   * Handle answer submission
   */
  handleSubmit(answer) {
    this.attempts++;

    if (this.checkAnswer(answer)) {
      const isNewDevice = this.isNewDevice();

      // If this is a new device and there are more questions to answer
      if (isNewDevice && this.currentQuestion < this.securityQuestions.length - 1) {
        // Progress to next question
        this.currentQuestion++;

        // Show success message briefly
        const errorEl = this.element.querySelector('.gate-error');
        errorEl.textContent = 'Correct! ✓';
        errorEl.style.color = 'var(--color-highlight)';

        // Transition to next question
        setTimeout(() => {
          const oldElement = this.element;
          this.element = this.createGateElement();
          oldElement.replaceWith(this.element);

          // Fade in new question
          gsap.fromTo(this.element.querySelector('.gate-content'),
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5 }
          );
        }, 800);

      } else {
        // All questions answered correctly (or known device on first question)
        if (isNewDevice) {
          this.markDeviceVerified();
        }
        this.onCorrectAnswer();
      }
    } else {
      this.onIncorrectAnswer();
    }
  }

  /**
   * Handle correct answer
   */
  onCorrectAnswer() {
    // Grant access
    grantAccess();

    // Show success message briefly
    const errorEl = this.element.querySelector('.gate-error');
    errorEl.textContent = 'Hi, Mila.';
    errorEl.style.color = 'var(--color-highlight)';

    // Create and animate origami flamingo birds
    this.createOrigamiBirds();

    // Animate out after birds animation
    setTimeout(() => {
      gsap.to(this.element, {
        opacity: 0,
        duration: 1,
        ease: 'power2.in',
        onComplete: () => {
          this.element.remove();
          this.onSuccess();
        }
      });
    }, 3500);
  }

  /**
   * Create flamingo animation (2 flamingos flying in from opposite sides, circling together, then flying away)
   */
  createOrigamiBirds() {
    // Create 2 flamingos
    const flamingo1 = this.createFlamingo();
    const flamingo2 = this.createFlamingo();

    this.element.appendChild(flamingo1);
    this.element.appendChild(flamingo2);

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Make sure they're visible and larger on mobile
    const flamingoScale = window.innerWidth < 768 ? 1.0 : 1.5;

    // Flamingo 1 - starts from far left
    gsap.set(flamingo1, {
      x: -150,
      y: centerY,
      scale: flamingoScale,
      opacity: 0,
      rotation: 45
    });

    // Flamingo 2 - starts from far right
    gsap.set(flamingo2, {
      x: window.innerWidth + 150,
      y: centerY,
      scale: flamingoScale,
      opacity: 0,
      rotation: -45
    });

    // Create the animation timeline
    const tl = gsap.timeline();

    // Phase 1: Fade in
    tl.to([flamingo1, flamingo2], {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out'
    })

    // Phase 2: Fly in towards center (slow and graceful)
    .to(flamingo1, {
      x: centerX - 120,
      y: centerY - 80,
      rotation: -15,
      duration: 3,
      ease: 'power2.inOut'
    }, 0.5)
    .to(flamingo2, {
      x: centerX + 120,
      y: centerY - 80,
      rotation: 15,
      duration: 3,
      ease: 'power2.inOut'
    }, 0.5)

    // Phase 3: Circle together (5 complete circles - extended for loading)
    .to(flamingo1, {
      motionPath: {
        path: [
          // Circle 1
          { x: centerX - 120, y: centerY - 80 },
          { x: centerX - 80, y: centerY - 150 },
          { x: centerX + 80, y: centerY - 150 },
          { x: centerX + 120, y: centerY - 80 },
          { x: centerX + 80, y: centerY - 10 },
          { x: centerX - 80, y: centerY - 10 },
          // Circle 2
          { x: centerX - 120, y: centerY - 80 },
          { x: centerX - 80, y: centerY - 150 },
          { x: centerX + 80, y: centerY - 150 },
          { x: centerX + 120, y: centerY - 80 },
          { x: centerX + 80, y: centerY - 10 },
          { x: centerX - 80, y: centerY - 10 },
          // Circle 3
          { x: centerX - 120, y: centerY - 80 },
          { x: centerX - 80, y: centerY - 150 },
          { x: centerX + 80, y: centerY - 150 },
          { x: centerX + 120, y: centerY - 80 },
          { x: centerX + 80, y: centerY - 10 },
          { x: centerX - 80, y: centerY - 10 },
          // Circle 4
          { x: centerX - 120, y: centerY - 80 },
          { x: centerX - 80, y: centerY - 150 },
          { x: centerX + 80, y: centerY - 150 },
          { x: centerX + 120, y: centerY - 80 },
          { x: centerX + 80, y: centerY - 10 },
          { x: centerX - 80, y: centerY - 10 },
          // Circle 5
          { x: centerX - 120, y: centerY - 80 },
          { x: centerX - 80, y: centerY - 150 },
          { x: centerX + 80, y: centerY - 150 },
          { x: centerX + 120, y: centerY - 80 },
          { x: centerX + 80, y: centerY - 10 },
          { x: centerX - 80, y: centerY - 10 },
          { x: centerX - 120, y: centerY - 80 }
        ],
        autoRotate: true
      },
      duration: 10,
      ease: 'none'
    }, 3.5)
    .to(flamingo2, {
      motionPath: {
        path: [
          // Circle 1
          { x: centerX + 120, y: centerY - 80 },
          { x: centerX + 80, y: centerY - 10 },
          { x: centerX - 80, y: centerY - 10 },
          { x: centerX - 120, y: centerY - 80 },
          { x: centerX - 80, y: centerY - 150 },
          { x: centerX + 80, y: centerY - 150 },
          // Circle 2
          { x: centerX + 120, y: centerY - 80 },
          { x: centerX + 80, y: centerY - 10 },
          { x: centerX - 80, y: centerY - 10 },
          { x: centerX - 120, y: centerY - 80 },
          { x: centerX - 80, y: centerY - 150 },
          { x: centerX + 80, y: centerY - 150 },
          // Circle 3
          { x: centerX + 120, y: centerY - 80 },
          { x: centerX + 80, y: centerY - 10 },
          { x: centerX - 80, y: centerY - 10 },
          { x: centerX - 120, y: centerY - 80 },
          { x: centerX - 80, y: centerY - 150 },
          { x: centerX + 80, y: centerY - 150 },
          // Circle 4
          { x: centerX + 120, y: centerY - 80 },
          { x: centerX + 80, y: centerY - 10 },
          { x: centerX - 80, y: centerY - 10 },
          { x: centerX - 120, y: centerY - 80 },
          { x: centerX - 80, y: centerY - 150 },
          { x: centerX + 80, y: centerY - 150 },
          // Circle 5
          { x: centerX + 120, y: centerY - 80 },
          { x: centerX + 80, y: centerY - 10 },
          { x: centerX - 80, y: centerY - 10 },
          { x: centerX - 120, y: centerY - 80 },
          { x: centerX - 80, y: centerY - 150 },
          { x: centerX + 80, y: centerY - 150 },
          { x: centerX + 120, y: centerY - 80 }
        ],
        autoRotate: true
      },
      duration: 10,
      ease: 'none'
    }, 3.5)

    // Phase 4: Come together in center
    .to(flamingo1, {
      x: centerX - 60,
      y: centerY - 80,
      rotation: -5,
      duration: 1.5,
      ease: 'power2.inOut'
    })
    .to(flamingo2, {
      x: centerX + 60,
      y: centerY - 80,
      rotation: 5,
      duration: 1.5,
      ease: 'power2.inOut'
    }, '<')

    // Phase 5: Brief pause together
    .to({}, { duration: 0.8 })

    // Phase 6: Fly away together upward
    .to([flamingo1, flamingo2], {
      x: centerX,
      y: -300,
      scale: flamingoScale * 0.5,
      rotation: 0,
      duration: 3,
      ease: 'power2.in',
      onComplete: () => {
        flamingo1.remove();
        flamingo2.remove();
      }
    });

    // Wing flapping animation (continuous)
    [flamingo1, flamingo2].forEach(bird => {
      const wings = bird.querySelectorAll('.wing');
      gsap.to(wings, {
        scaleY: 0.6,
        transformOrigin: 'center center',
        duration: 0.15,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    });
  }

  /**
   * Create a realistic flamingo SVG
   */
  createFlamingo() {
    const bird = document.createElement('div');
    bird.className = 'flamingo-bird';
    bird.innerHTML = `
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        <!-- Body -->
        <ellipse cx="60" cy="60" rx="18" ry="25" fill="#FF6B9D" opacity="0.95"/>

        <!-- Neck -->
        <path d="M 60 40 Q 55 25, 45 20" stroke="#FF6B9D" stroke-width="6" fill="none" stroke-linecap="round"/>

        <!-- Head -->
        <ellipse cx="43" cy="18" rx="7" ry="8" fill="#FF6B9D"/>

        <!-- Beak -->
        <path d="M 40 18 L 32 18 L 36 20 Z" fill="#1a1a1a"/>

        <!-- Eye -->
        <circle cx="45" cy="17" r="1.5" fill="#1a1a1a"/>

        <!-- Left Wing (flapping) -->
        <ellipse class="wing" cx="50" cy="55" rx="25" ry="12" fill="#FFB6C1" opacity="0.9"
                 transform="rotate(-30 50 55)"/>

        <!-- Right Wing (flapping) -->
        <ellipse class="wing" cx="70" cy="55" rx="25" ry="12" fill="#FF8FAB" opacity="0.9"
                 transform="rotate(30 70 55)"/>

        <!-- Legs -->
        <line x1="55" y1="80" x2="52" y2="105" stroke="#FF6B9D" stroke-width="3" stroke-linecap="round"/>
        <line x1="65" y1="80" x2="68" y2="105" stroke="#FF6B9D" stroke-width="3" stroke-linecap="round"/>

        <!-- Tail feathers -->
        <path d="M 60 75 Q 58 85, 55 90" stroke="#FFB6C1" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M 60 75 Q 62 85, 65 90" stroke="#FF8FAB" stroke-width="4" fill="none" stroke-linecap="round"/>
      </svg>
    `;
    return bird;
  }

  /**
   * Play POOF sound effect
   */
  playPoofSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;

      // Create explosion/poof sound with multiple oscillators
      for (let i = 0; i < 3; i++) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Descending frequency sweep for whoosh effect
        oscillator.frequency.setValueAtTime(800 - i * 200, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        oscillator.type = 'sawtooth';

        // Low-pass filter for dampening
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);

        // Volume envelope - quick attack, medium decay
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        oscillator.start(now + i * 0.05);
        oscillator.stop(now + 0.5);
      }

      // Add noise burst for "poof" texture
      const bufferSize = audioContext.sampleRate * 0.3;
      const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize * 8);
      }

      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      const noiseGain = audioContext.createGain();
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      noiseSource.connect(noiseGain);
      noiseGain.connect(audioContext.destination);
      noiseSource.start(now);
    } catch (e) {
      console.warn('Audio not supported:', e);
    }
  }

  /**
   * Create magical POOF disappearing effect with sprite animation
   */
  createPoofEffect() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Play POOF sound
    this.playPoofSound();

    // Create sprite-based POOF animation
    // The sprite sheet has 5 frames arranged horizontally (48x48 each = 240px wide total)
    const poofSprite = document.createElement('div');
    poofSprite.className = 'poof-sprite';
    document.body.appendChild(poofSprite);

    // Position at center
    poofSprite.style.left = (centerX - 96) + 'px'; // 96 = half of doubled size (192/2)
    poofSprite.style.top = (centerY - 96) + 'px';

    // Animate through sprite frames
    let frame = 0;
    const totalFrames = 5;
    const frameWidth = 48; // Each frame is 48px wide
    const frameInterval = 80; // 80ms per frame

    const spriteAnimation = setInterval(() => {
      if (frame >= totalFrames) {
        clearInterval(spriteAnimation);
        poofSprite.remove();
        return;
      }

      // Move background position to show next frame
      poofSprite.style.backgroundPosition = `-${frame * frameWidth}px 0px`;
      frame++;
    }, frameInterval);

    // Create "POOF!" text that appears with the sprite
    const poofText = document.createElement('div');
    poofText.className = 'poof-text';
    poofText.textContent = 'POOF!';
    document.body.appendChild(poofText);

    gsap.fromTo(poofText,
      {
        x: centerX - 80,
        y: centerY - 120,
        scale: 0,
        opacity: 0
      },
      {
        scale: 1.5,
        opacity: 1,
        duration: 0.2,
        ease: 'back.out(2)',
        onComplete: () => {
          gsap.to(poofText, {
            opacity: 0,
            scale: 2,
            y: centerY - 140,
            duration: 0.3,
            onComplete: () => poofText.remove()
          });
        }
      }
    );

    // Shake and fade out the content
    gsap.to('.gate-content', {
      scale: 0.8,
      opacity: 0,
      rotation: Math.random() * 20 - 10,
      duration: 0.8,
      ease: 'power2.in'
    });
  }

  /**
   * Handle incorrect answer - TROLL MODE
   */
  onIncorrectAnswer() {
    const errorEl = this.element.querySelector('.gate-error');
    const content = this.element.querySelector('.gate-content');

    if (this.attempts === 1) {
      // First wrong attempt - TROLL APPEARS
      errorEl.innerHTML = `
        <div class="troll-message">
          <img src="/bridge-troll.webp" alt="Bridge Troll" class="troll-image" />
          <div class="troll-text">WHO IS THAT TRIP TRAPPIN' OVER MY BRIDGE?</div>
        </div>
      `;

      // Animate troll image appearing dramatically
      const trollImg = errorEl.querySelector('.troll-image');
      gsap.fromTo(trollImg,
        { scale: 0, rotation: -180, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'back.out(2)'
        }
      );

      // Shake animation
      gsap.to(content, {
        x: -10,
        duration: 0.1,
        repeat: 5,
        yoyo: true,
        onComplete: () => {
          gsap.to(content, { x: 0, duration: 0.1 });
        }
      });

    } else if (this.attempts >= 2) {
      // Second (or more) wrong attempt - BANISHMENT
      errorEl.innerHTML = `
        <div class="troll-message">
          <img src="/bridge-troll.webp" alt="Bridge Troll" class="troll-image" />
          <div class="troll-text">BE GONE FROM HERE!</div>
        </div>
      `;

      // Animate troll image
      const trollImg = errorEl.querySelector('.troll-image');
      gsap.fromTo(trollImg,
        { scale: 1, opacity: 1 },
        {
          scale: 1.2,
          opacity: 1,
          duration: 0.3,
          ease: 'power2.out'
        }
      );

      // Violent shake animation
      gsap.to(content, {
        x: -15,
        duration: 0.08,
        repeat: 8,
        yoyo: true,
        onComplete: () => {
          gsap.to(content, { x: 0, duration: 0.1 });
        }
      });

      // Redirect to Google search after 2.5 seconds with POOF effect
      setTimeout(() => {
        this.createPoofEffect();

        // Flash red
        gsap.to(this.element, {
          backgroundColor: '#ff0000',
          duration: 0.3,
          repeat: 3,
          yoyo: true,
          onComplete: () => {
            window.location.href = 'https://www.dictionary.com/browse/none-of-ones-business';
          }
        });
      }, 2500);
    }
  }
}

// Styles
const styles = `
.security-gate {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.gate-content {
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.gate-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 1rem;
  line-height: 1.3;
}

.gate-subtitle {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-style: italic;
  color: var(--color-highlight, #FFB6C1);
  margin-bottom: 2rem;
}

.gate-new-device-notice {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: #FFA500;
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.gate-progress {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-secondary, #FFE4E1);
  margin-top: 1rem;
  opacity: 0.7;
}

.gate-question {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 300;
  color: var(--color-secondary, #FFE4E1);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.gate-prompt {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 2rem;
}

.gate-input {
  width: 100%;
  padding: 1rem 1.5rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  text-align: center;
}

.gate-input:focus {
  outline: none;
  border-color: var(--color-highlight, #FFB6C1);
  background: rgba(255, 255, 255, 0.08);
}

.gate-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.gate-button {
  width: 100%;
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
  margin-bottom: 1rem;
}

.gate-button:hover {
  background: var(--color-secondary, #FFE4E1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 182, 193, 0.3);
}

.gate-button:active {
  transform: translateY(0);
}

.gate-hint {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 1rem;
}

.gate-ask-link {
  color: var(--color-highlight, #FFB6C1);
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.3s ease;
}

.gate-ask-link:hover {
  color: var(--color-secondary, #FFE4E1);
}

.gate-error {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  min-height: 1.5rem;
  color: #ff6b6b;
  margin-top: 1rem;
}

.troll-message {
  margin-top: 1rem;
}

.troll-image {
  width: 200px;
  height: auto;
  margin: 1rem auto;
  display: block;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(255, 0, 0, 0.5);
  filter: drop-shadow(0 0 20px rgba(255, 0, 0, 0.7));
}

.troll-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #ff0000;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 0.5rem;
  animation: shake-troll 0.3s infinite;
  text-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
}

.troll-text-2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: #ff4444;
  font-style: italic;
  text-shadow: 0 0 8px rgba(255, 68, 68, 0.6);
}

@keyframes shake-troll {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}

.flamingo-bird {
  position: fixed;
  width: 100px;
  height: 100px;
  pointer-events: none;
  z-index: 10001;
  filter: drop-shadow(0 6px 12px rgba(255, 107, 157, 0.5));
}

.flamingo-bird svg {
  width: 100%;
  height: 100%;
}

.poof-sprite {
  position: fixed;
  width: 192px;
  height: 192px;
  background-image: url('/poof-sprite.png');
  background-repeat: no-repeat;
  background-size: 960px 192px;
  background-position: 0 0;
  pointer-events: none;
  z-index: 10002;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.poof-text {
  position: fixed;
  font-family: 'Montserrat', sans-serif;
  font-size: 4rem;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.8),
               0 0 40px rgba(255, 0, 0, 0.6);
  pointer-events: none;
  z-index: 10003;
  letter-spacing: 0.2em;
}

@media (max-width: 768px) {
  .gate-title {
    font-size: 1.5rem;
  }

  .gate-subtitle {
    font-size: 1.2rem;
  }

  .gate-question {
    font-size: 0.9rem;
  }

  .gate-prompt {
    font-size: 1.1rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
