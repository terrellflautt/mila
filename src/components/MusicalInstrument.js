/**
 * Musical Instrument Component
 * A persistent, always-beautiful instrument that lives on the landing page
 * Plays harmonious tones no matter what notes are pressed
 * When played, it opens curtains and reveals daily messages
 */

import gsap from 'gsap';
import { getDailyMessage } from '../utils/dailyMessages.js';

export class MusicalInstrument {
  constructor(onPlay) {
    this.onPlay = onPlay;
    this.element = null;
    this.audioContext = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.lastPlayTime = 0;
    this.playCount = 0;
    this.isCollapsed = true; // Start minimized as icon for discovery

    // Beautiful pentatonic scale (always sounds good)
    // C Major Pentatonic: C, D, E, G, A (in different octaves for richness)
    this.notes = [
      { freq: 261.63, name: 'C4', color: '#FFB6C1' },  // Pink
      { freq: 293.66, name: 'D4', color: '#FFE4E1' },  // Misty Rose
      { freq: 329.63, name: 'E4', color: '#E8D5C4' },  // Champagne
      { freq: 392.00, name: 'G4', color: '#FFDAB9' },  // Peach
      { freq: 440.00, name: 'A4', color: '#FFD700' },  // Gold
      { freq: 523.25, name: 'C5', color: '#FFC0CB' },  // Light Pink
      { freq: 587.33, name: 'D5', color: '#F0E68C' },  // Khaki
      { freq: 659.25, name: 'E5', color: '#DDA0DD' }   // Plum
    ];

    this.initAudio();
  }

  /**
   * Initialize Web Audio API
   */
  initAudio() {
    // Audio context created on first user interaction
    this.audioContextReady = false;
  }

  /**
   * Create audio context (must be called after user gesture)
   */
  createAudioContext() {
    if (this.audioContextReady) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();

    // Master gain for overall volume
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3; // Gentle volume
    this.masterGain.connect(this.audioContext.destination);

    // Add subtle reverb for warmth
    this.reverb = this.audioContext.createConvolver();
    this.masterGain.connect(this.reverb);
    this.reverb.connect(this.audioContext.destination);

    this.audioContextReady = true;
  }

  /**
   * Play a beautiful tone
   */
  playTone(frequency, color, duration = 1.2) {
    if (!this.audioContextReady) {
      this.createAudioContext();
    }

    const now = this.audioContext.currentTime;

    // Create oscillator (primary tone)
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine'; // Pure, soft tone
    osc.frequency.setValueAtTime(frequency, now);

    // Create subtle harmonic (adds warmth)
    const harmonic = this.audioContext.createOscillator();
    harmonic.type = 'sine';
    harmonic.frequency.setValueAtTime(frequency * 2, now); // Octave above

    // Envelope (attack-decay-sustain-release)
    const gainNode = this.audioContext.createGain();
    const harmonicGain = this.audioContext.createGain();

    // Soft attack, gentle release
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.1, now + duration * 0.7); // Sustain
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Release

    harmonicGain.gain.setValueAtTime(0, now);
    harmonicGain.gain.linearRampToValueAtTime(0.08, now + 0.05);
    harmonicGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Connect nodes
    osc.connect(gainNode);
    harmonic.connect(harmonicGain);
    gainNode.connect(this.masterGain);
    harmonicGain.connect(this.masterGain);

    // Play
    osc.start(now);
    harmonic.start(now);
    osc.stop(now + duration);
    harmonic.stop(now + duration);

    // Track plays
    this.playCount++;
    this.lastPlayTime = Date.now();

    // Trigger curtain animation every 3-5 notes
    if (this.playCount >= 3 && !this.isPlaying) {
      this.isPlaying = true;
      setTimeout(() => {
        this.isPlaying = false;
        this.playCount = 0;
      }, 5000);

      if (this.onPlay) {
        this.onPlay();
      }
    }

    return color;
  }

  /**
   * Show the instrument
   */
  show() {
    this.element = this.createInstrumentElement();
    document.body.appendChild(this.element);

    // Animate in
    gsap.fromTo(this.element,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: 'power2.out',
        delay: 0.5
      }
    );
  }

  /**
   * Hide the instrument
   */
  hide() {
    if (!this.element) return;

    gsap.to(this.element, {
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: 'power2.in',
      onComplete: () => {
        if (this.element && this.element.parentNode) {
          this.element.remove();
        }
      }
    });
  }

  /**
   * Toggle collapsed/expanded state
   */
  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;

    const container = this.element.querySelector('.instrument-container');
    const icon = this.element.querySelector('.instrument-collapsed-icon');

    if (this.isCollapsed) {
      // Collapse animation
      gsap.to(container, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          container.style.display = 'none';
          icon.style.display = 'flex';
          gsap.fromTo(icon,
            { opacity: 0, scale: 0.5 },
            { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.7)' }
          );
        }
      });
    } else {
      // Expand animation
      gsap.to(icon, {
        opacity: 0,
        scale: 0.5,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          icon.style.display = 'none';
          container.style.display = 'block';
          gsap.fromTo(container,
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }
          );
        }
      });
    }
  }

  /**
   * Create instrument HTML
   */
  createInstrumentElement() {
    const instrument = document.createElement('div');
    instrument.className = 'musical-instrument';

    // Create keys for each note
    const keysHTML = this.notes.map((note, index) => `
      <button
        class="instrument-key"
        data-index="${index}"
        data-note="${note.name}"
        aria-label="Play note ${note.name}"
      >
        <div class="key-glow" style="background: ${note.color}"></div>
        <div class="key-label">${note.name}</div>
      </button>
    `).join('');

    // Respect initial collapsed state - show icon if collapsed, container if expanded
    const iconDisplay = this.isCollapsed ? 'flex' : 'none';
    const containerDisplay = this.isCollapsed ? 'none' : 'block';

    instrument.innerHTML = `
      <div class="instrument-collapsed-icon" style="display: ${iconDisplay};">
        <div class="collapsed-sparkle">✨</div>
      </div>
      <div class="instrument-container" style="display: ${containerDisplay};">
        <div class="instrument-header">
          <button class="instrument-collapse-btn" title="Minimize">−</button>
          <div class="instrument-title">✨</div>
          <div class="instrument-subtitle">Play me</div>
        </div>
        <div class="instrument-keys">
          ${keysHTML}
        </div>
        <div class="instrument-hint">Touch any note — they all sound beautiful together</div>
      </div>
    `;

    // Add event listeners
    const keys = instrument.querySelectorAll('.instrument-key');
    keys.forEach((key, index) => {
      // Mouse events
      key.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleKeyPress(index, key);
      });

      // Touch events (better for mobile)
      key.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handleKeyPress(index, key);
      });

      // Hover effect (desktop only)
      key.addEventListener('mouseenter', () => {
        if (window.innerWidth > 768) {
          gsap.to(key, {
            scale: 1.05,
            duration: 0.2,
            ease: 'power2.out'
          });
        }
      });

      key.addEventListener('mouseleave', () => {
        if (window.innerWidth > 768) {
          gsap.to(key, {
            scale: 1,
            duration: 0.2,
            ease: 'power2.in'
          });
        }
      });
    });

    // Collapse button
    const collapseBtn = instrument.querySelector('.instrument-collapse-btn');
    collapseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleCollapse();
    });

    // Collapsed icon (click to expand)
    const collapsedIcon = instrument.querySelector('.instrument-collapsed-icon');
    collapsedIcon.addEventListener('click', () => {
      this.toggleCollapse();
    });

    return instrument;
  }

  /**
   * Handle key press with beautiful animation
   */
  handleKeyPress(index, keyElement) {
    const note = this.notes[index];
    const color = this.playTone(note.freq, note.color);

    // Visual feedback - glow animation
    const glow = keyElement.querySelector('.key-glow');

    gsap.timeline()
      .to(glow, {
        scale: 1.2,
        opacity: 0.9,
        duration: 0.1,
        ease: 'power2.out'
      })
      .to(glow, {
        scale: 1,
        opacity: 0.3,
        duration: 1,
        ease: 'power2.inOut'
      });

    // Key press animation
    gsap.timeline()
      .to(keyElement, {
        scale: 0.95,
        duration: 0.05,
        ease: 'power2.out'
      })
      .to(keyElement, {
        scale: 1,
        duration: 0.3,
        ease: 'elastic.out(1, 0.5)'
      });

    // Create floating particle
    this.createParticle(keyElement, color);
  }

  /**
   * Create beautiful floating particle on key press
   */
  createParticle(keyElement, color) {
    const particle = document.createElement('div');
    particle.className = 'instrument-particle';
    particle.style.background = color;

    const rect = keyElement.getBoundingClientRect();
    particle.style.left = rect.left + rect.width / 2 + 'px';
    particle.style.top = rect.top + rect.height / 2 + 'px';

    document.body.appendChild(particle);

    gsap.to(particle, {
      y: -100 - Math.random() * 50,
      x: (Math.random() - 0.5) * 100,
      opacity: 0,
      scale: 0,
      duration: 1.5 + Math.random(),
      ease: 'power2.out',
      onComplete: () => particle.remove()
    });
  }
}

// Styles
const styles = `
.musical-instrument {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
  pointer-events: auto;
}

.instrument-collapsed-icon {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 182, 193, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.instrument-collapsed-icon:hover {
  transform: scale(1.1);
  border-color: rgba(255, 182, 193, 0.6);
  box-shadow: 0 12px 40px rgba(255, 182, 193, 0.3);
}

.collapsed-sparkle {
  font-size: 2rem;
  animation: float 3s ease-in-out infinite;
}

.instrument-container {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.instrument-header {
  position: relative;
  text-align: center;
  margin-bottom: 1rem;
}

.instrument-collapse-btn {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  width: 36px;
  height: 36px;
  z-index: 1000;
  border-radius: 50%;
  background: rgba(255, 182, 193, 0.2);
  border: 1px solid rgba(255, 182, 193, 0.4);
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-family: monospace;
}

.instrument-collapse-btn:hover {
  background: rgba(255, 182, 193, 0.3);
  border-color: rgba(255, 182, 193, 0.6);
  transform: scale(1.1);
}

.instrument-title {
  font-size: 2rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.instrument-subtitle {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 300;
  font-style: italic;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.25rem;
}

.instrument-keys {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  justify-content: center;
}

.instrument-key {
  position: relative;
  width: 40px;
  height: 80px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  padding: 0;
}

.instrument-key:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
}

.instrument-key:active {
  transform: scale(0.95);
}

.key-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.3;
  border-radius: 8px;
  transition: all 0.3s ease;
  pointer-events: none;
}

.key-label {
  position: absolute;
  bottom: 0.25rem;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.625rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.instrument-hint {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  font-weight: 300;
  font-style: italic;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  max-width: 280px;
}

.instrument-particle {
  position: fixed;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 0 10px currentColor;
}

@media (max-width: 768px) {
  .musical-instrument {
    bottom: 1rem;
  }

  .instrument-collapsed-icon {
    width: 56px;
    height: 56px;
  }

  .collapsed-sparkle {
    font-size: 1.75rem;
  }

  .instrument-container {
    padding: 1rem;
    border-radius: 16px;
  }

  .instrument-keys {
    gap: 0.375rem;
  }

  .instrument-key {
    width: 32px;
    height: 64px;
  }

  .key-label {
    font-size: 0.5rem;
    bottom: 0.2rem;
  }

  .instrument-hint {
    font-size: 0.65rem;
    max-width: 240px;
  }

  .instrument-collapse-btn {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .instrument-collapsed-icon {
    width: 48px;
    height: 48px;
  }

  .collapsed-sparkle {
    font-size: 1.5rem;
  }

  .instrument-keys {
    gap: 0.25rem;
  }

  .instrument-key {
    width: 28px;
    height: 56px;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
