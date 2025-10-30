/**
 * Act I - Puzzle 3: "Reflections of You"
 * Interactive mirror with water ripple effects and hidden poem
 */

import gsap from 'gsap';
import confetti from 'canvas-confetti';

export class ReflectionsOfYou {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.element = null;
    this.canvas = null;
    this.ctx = null;
    this.ripples = [];
    this.distortionLevel = 100; // 0 = clear, 100 = max distortion
    this.targetDistortion = 100;
    this.particles = [];
    this.animationFrame = null;
    this.isAligned = false;
    this.resizeHandler = null;
  }

  /**
   * Show the puzzle
   */
  show() {
    this.element = this.createPuzzleElement();
    document.body.appendChild(this.element);

    this.canvas = this.element.querySelector('.mirror-canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this.setupCanvas();
    this.setupInteraction();
    this.startAnimation();

    // Animate in
    gsap.fromTo(this.element,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out'
      }
    );
  }

  /**
   * Create puzzle HTML
   */
  createPuzzleElement() {
    const puzzle = document.createElement('div');
    puzzle.className = 'reflections-puzzle';
    puzzle.innerHTML = `
      <div class="reflections-container">
        <div class="reflections-header">
          <div class="puzzle-title">Reflections of You</div>
          <div class="puzzle-instruction">Move your cursor across the mirror to reveal what's hidden</div>
        </div>

        <div class="mirror-stage">
          <canvas class="mirror-canvas"></canvas>

          <div class="poem-fragments">
            <div class="poem-fragment fragment-1">"I saw your reflection</div>
            <div class="poem-fragment fragment-2">before I saw</div>
            <div class="poem-fragment fragment-3">your face."</div>
          </div>

          <div class="alignment-indicator">
            <div class="indicator-circle"></div>
            <div class="indicator-text">Keep moving...</div>
          </div>
        </div>

        <div class="distortion-meter">
          <div class="meter-label">Clarity</div>
          <div class="meter-bar">
            <div class="meter-fill"></div>
          </div>
        </div>
      </div>
    `;

    return puzzle;
  }

  /**
   * Setup canvas
   */
  setupCanvas() {
    this.resizeHandler = () => {
      const mirrorStage = this.element.querySelector('.mirror-stage');
      this.canvas.width = mirrorStage.clientWidth;
      this.canvas.height = mirrorStage.clientHeight;
    };

    this.resizeHandler();
    window.addEventListener('resize', this.resizeHandler);
  }

  /**
   * Setup mouse interaction
   */
  setupInteraction() {
    const mirrorStage = this.element.querySelector('.mirror-stage');

    const handleMove = (e) => {
      if (this.isAligned) return;

      const rect = mirrorStage.getBoundingClientRect();
      const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
      const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

      // Create ripple at cursor position
      this.createRipple(x, y);

      // Reduce distortion as user moves around
      this.reduceDistortion(x, y);

      // Create particles
      if (Math.random() > 0.7) {
        this.createParticle(x, y);
      }
    };

    mirrorStage.addEventListener('mousemove', handleMove);
    mirrorStage.addEventListener('touchmove', handleMove);
  }

  /**
   * Create water ripple
   */
  createRipple(x, y) {
    this.ripples.push({
      x,
      y,
      radius: 0,
      maxRadius: 150 + Math.random() * 100,
      alpha: 1,
      speed: 2 + Math.random() * 2
    });
  }

  /**
   * Reduce distortion based on coverage
   */
  reduceDistortion(x, y) {
    // Calculate coverage (simplified)
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const distFromCenter = Math.sqrt(
      Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
    );

    const maxDist = Math.sqrt(
      Math.pow(centerX, 2) + Math.pow(centerY, 2)
    );

    // The closer to center, the more it clears
    const clearAmount = 1 - (distFromCenter / maxDist);
    this.targetDistortion -= clearAmount * 0.5;

    if (this.targetDistortion < 0) this.targetDistortion = 0;

    // Update meter
    this.updateMeter();

    // Check if aligned
    if (this.targetDistortion < 20 && !this.isAligned) {
      this.onAlignment();
    }
  }

  /**
   * Create floating particle
   */
  createParticle(x, y) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: 2 + Math.random() * 3,
      alpha: 1,
      life: 1
    });
  }

  /**
   * Update distortion meter
   */
  updateMeter() {
    const clarity = 100 - this.targetDistortion;
    const meterFill = this.element.querySelector('.meter-fill');
    const indicatorText = this.element.querySelector('.indicator-text');

    gsap.to(meterFill, {
      width: `${clarity}%`,
      duration: 0.3
    });

    if (clarity > 80) {
      indicatorText.textContent = 'Almost there...';
    } else if (clarity > 50) {
      indicatorText.textContent = 'You\'re getting closer...';
    } else {
      indicatorText.textContent = 'Keep moving...';
    }
  }

  /**
   * Animation loop
   */
  startAnimation() {
    const animate = () => {
      this.animationFrame = requestAnimationFrame(animate);

      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Smooth distortion transition
      this.distortionLevel += (this.targetDistortion - this.distortionLevel) * 0.05;

      // Draw base gradient
      this.drawBackground();

      // Update and draw ripples
      this.updateRipples();

      // Update and draw particles
      this.updateParticles();

      // Apply distortion effect
      this.applyDistortion();
    };

    animate();
  }

  /**
   * Draw background gradient
   */
  drawBackground() {
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      0,
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.width * 0.7
    );

    gradient.addColorStop(0, 'rgba(255, 182, 193, 0.3)');
    gradient.addColorStop(0.5, 'rgba(255, 228, 225, 0.2)');
    gradient.addColorStop(1, 'rgba(26, 26, 26, 0.5)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Update and draw ripples
   */
  updateRipples() {
    this.ripples = this.ripples.filter(ripple => {
      ripple.radius += ripple.speed;
      ripple.alpha -= 0.01;

      if (ripple.alpha <= 0) return false;

      // Draw ripple
      this.ctx.beginPath();
      this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(255, 182, 193, ${ripple.alpha * 0.5})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Inner ripple
      this.ctx.beginPath();
      this.ctx.arc(ripple.x, ripple.y, ripple.radius * 0.7, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(255, 228, 225, ${ripple.alpha * 0.3})`;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      return true;
    });
  }

  /**
   * Update and draw particles
   */
  updateParticles() {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.01;
      particle.alpha = particle.life;

      if (particle.life <= 0) return false;

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 182, 193, ${particle.alpha * 0.8})`;
      this.ctx.fill();

      return true;
    });
  }

  /**
   * Apply distortion effect
   */
  applyDistortion() {
    if (this.distortionLevel < 1) return;

    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    // Simple wave distortion
    const distortStrength = this.distortionLevel * 0.1;
    const time = Date.now() * 0.001;

    for (let y = 0; y < this.canvas.height; y++) {
      const offsetX = Math.sin(y * 0.05 + time) * distortStrength;

      for (let x = 0; x < this.canvas.width; x++) {
        const sourceX = Math.floor(x + offsetX);
        if (sourceX >= 0 && sourceX < this.canvas.width) {
          const sourceIndex = (y * this.canvas.width + sourceX) * 4;
          const targetIndex = (y * this.canvas.width + x) * 4;

          data[targetIndex] = data[sourceIndex];
          data[targetIndex + 1] = data[sourceIndex + 1];
          data[targetIndex + 2] = data[sourceIndex + 2];
          data[targetIndex + 3] = data[sourceIndex + 3];
        }
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Handle alignment
   */
  onAlignment() {
    this.isAligned = true;

    const indicatorText = this.element.querySelector('.indicator-text');
    indicatorText.textContent = 'Perfect clarity...';
    indicatorText.style.color = 'var(--color-highlight)';

    // Pulse the indicator
    gsap.to('.indicator-circle', {
      scale: 1.5,
      opacity: 1,
      duration: 0.5,
      repeat: 3,
      yoyo: true
    });

    // Reveal poem fragments
    this.revealPoem();
  }

  /**
   * Reveal poem fragments
   */
  revealPoem() {
    console.log('🪞 Reflections puzzle complete! Revealing poem fragments...');
    const fragments = this.element.querySelectorAll('.poem-fragment');

    // Reveal poem fragments with staggered animation
    fragments.forEach((fragment, index) => {
      gsap.to(fragment, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: index * 0.5,
        ease: 'power2.out'
      });
    });

    // Make fragments shimmer/glow
    setTimeout(() => {
      gsap.to('.poem-fragment', {
        textShadow: '0 0 20px rgba(255, 182, 193, 0.8), 0 0 40px rgba(255, 182, 193, 0.4)',
        duration: 0.8,
        repeat: 2,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }, 1500);

    // Wait for user to read fragments, then close and trigger main completion flow
    setTimeout(() => {
      console.log('🪞 Closing Reflections puzzle...');
      this.close();
    }, 4000);
  }

  /**
   * Close puzzle
   */
  close() {
    // Cancel animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Clean up resize handler
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
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
}

// Styles
const styles = `
.reflections-puzzle {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #0a0a0a;
  z-index: 2000;
  overflow: hidden;
}

.reflections-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2rem;
}

.reflections-header {
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
  z-index: 10;
}

.mirror-stage {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 20px;
  box-shadow: inset 0 0 50px rgba(255, 182, 193, 0.1);
}

.mirror-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.poem-fragments {
  position: relative;
  z-index: 5;
  text-align: center;
  pointer-events: none;
}

.poem-fragment {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.5rem;
  font-weight: 400;
  font-style: italic;
  color: var(--color-primary, #FFF8F0);
  line-height: 1.6;
  opacity: 0;
  transform: translateY(20px);
  text-shadow: 0 2px 20px rgba(255, 182, 193, 0.5);
  margin: 0.5rem 0;
}

.alignment-indicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  z-index: 10;
}

.indicator-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--color-highlight, #FFB6C1);
  background: rgba(255, 182, 193, 0.1);
  opacity: 0.6;
  animation: pulse-indicator 2s ease-in-out infinite;
}

@keyframes pulse-indicator {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.2); opacity: 1; }
}

.indicator-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-secondary, #FFE4E1);
  text-align: center;
}

.distortion-meter {
  margin-top: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.meter-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-secondary, #FFE4E1);
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 60px;
}

.meter-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.meter-fill {
  width: 0%;
  height: 100%;
  background: linear-gradient(90deg, var(--color-highlight, #FFB6C1), var(--color-secondary, #FFE4E1));
  border-radius: 4px;
  transition: width 0.3s ease;
}

@media (max-width: 768px) {
  .reflections-container {
    padding: 1rem;
  }

  .puzzle-title {
    font-size: 2rem;
  }

  .poem-fragment {
    font-size: 1.75rem;
  }

  .distortion-meter {
    flex-direction: column;
    gap: 0.5rem;
  }

  .meter-label {
    min-width: auto;
  }

  .meter-bar {
    width: 100%;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
