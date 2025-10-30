/**
 * Stage Light - Theatrical Acrostic Poem Experience
 * A cinematic reveal of her name through poetry and light
 * Spells M-I-L-A (Milagros - Miracles)
 */

import * as THREE from 'three';
import gsap from 'gsap';
import confetti from 'canvas-confetti';

export class StageLight {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.element = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.curtain = null;
    this.spotlight = null;
    this.particles = [];
    this.isComplete = false;
    this.isAnimating = true;
    this.timeline = null;
  }

  /**
   * Show the experience
   */
  show() {
    this.element = this.createExperienceElement();
    document.body.appendChild(this.element);

    // Initialize Three.js scene
    this.initScene();

    // Create stage elements
    this.createCurtain();
    this.createDustParticles();

    // Create poem text overlays
    this.createPoemLines();

    // Animate in
    gsap.fromTo(this.element,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 2,
        ease: 'power2.out',
        onComplete: () => {
          // Start the cinematic sequence after fade in
          setTimeout(() => this.startCinematicSequence(), 500);
        }
      }
    );

    // Start render loop
    this.animate();
  }

  /**
   * Create experience HTML structure
   */
  createExperienceElement() {
    const container = document.createElement('div');
    container.className = 'stage-light-experience';
    container.innerHTML = `
      <div class="stage-container">
        <div class="canvas-container"></div>
        <div class="poem-overlay">
          <!-- Poem lines will be added dynamically -->
        </div>
        <div class="final-reveal" style="opacity: 0;">
          <div class="name-reveal">MILA</div>
          <div class="name-meaning">Milagros · Miracles</div>
          <div class="final-message">
            Every letter of your name<br>
            is a verse in the poem<br>
            I've been writing since the day we met.
          </div>
        </div>
      </div>
    `;

    return container;
  }

  /**
   * Initialize Three.js scene
   */
  initScene() {
    const container = this.element.querySelector('.canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0510); // Deep burgundy-black

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 12);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0x1a1520, 0.3);
    this.scene.add(ambient);

    this.spotlight = new THREE.SpotLight(0xffdcb4, 0, 30, Math.PI / 6, 0.5);
    this.spotlight.position.set(0, 8, 8);
    this.spotlight.target.position.set(0, 0, 0);
    this.scene.add(this.spotlight);
    this.scene.add(this.spotlight.target);

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Create the red velvet curtain
   */
  createCurtain() {
    const geometry = new THREE.PlaneGeometry(20, 12, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a0a0a, // Deep red
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    this.curtain = new THREE.Mesh(geometry, material);
    this.curtain.position.z = -2;

    // Add some wave to the curtain geometry
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const wave = Math.sin(x * 0.5) * 0.3;
      positions.setZ(i, wave);
    }
    positions.needsUpdate = true;

    this.scene.add(this.curtain);
  }

  /**
   * Create floating dust particles
   */
  createDustParticles() {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffdcb4,
      size: 0.05,
      transparent: true,
      opacity: 0.6
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    this.particles.push(particles);

    // Animate particles floating
    gsap.to(particles.rotation, {
      y: Math.PI * 2,
      duration: 60,
      repeat: -1,
      ease: 'none'
    });
  }

  /**
   * Create poem text elements
   */
  createPoemLines() {
    const poemLines = [
      { text: "Miracle beneath the curtain's rise,", letter: 'M' },
      { text: "Inspired breath between each line.", letter: 'I' },
      { text: "Love steps softly through the spotlight,", letter: 'L' },
      { text: "Art becomes the heart's design.", letter: 'A' }
    ];

    const overlay = this.element.querySelector('.poem-overlay');

    poemLines.forEach((line, index) => {
      const lineContainer = document.createElement('div');
      lineContainer.className = 'poem-line-container';
      lineContainer.innerHTML = `
        <div class="poem-letter">${line.letter}</div>
        <div class="poem-text">${line.text}</div>
      `;
      lineContainer.style.opacity = 0;
      overlay.appendChild(lineContainer);
    });
  }

  /**
   * Start the cinematic sequence
   */
  startCinematicSequence() {
    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' }
    });

    this.timeline = tl;

    // 1. Curtain rises (0-5s)
    tl.to(this.curtain.position, {
      y: 6,
      duration: 5,
      ease: 'power1.inOut'
    });

    // 2. Spotlight fades in (3-6s)
    tl.to(this.spotlight, {
      intensity: 3,
      duration: 3,
      ease: 'power2.in'
    }, '-=2');

    // 3. First line - "M" (6-10s)
    tl.to('.poem-line-container:nth-child(1)', {
      opacity: 1,
      y: -20,
      duration: 2,
      ease: 'power2.out'
    }, 6);

    // Add glow effect to letter
    tl.to('.poem-line-container:nth-child(1) .poem-letter', {
      textShadow: '0 0 30px #ffdcb4, 0 0 60px #ffdcb4',
      duration: 1
    }, 7);

    // 4. Second line - "I" (10-14s)
    tl.to('.poem-line-container:nth-child(2)', {
      opacity: 1,
      y: -20,
      duration: 2,
      ease: 'power2.out'
    }, 10);

    tl.to('.poem-line-container:nth-child(2) .poem-letter', {
      textShadow: '0 0 30px #ffdcb4, 0 0 60px #ffdcb4',
      duration: 1
    }, 11);

    // 5. Third line - "L" with spotlight movement (14-18s)
    tl.to(this.spotlight.target.position, {
      x: 2,
      duration: 2,
      ease: 'power1.inOut'
    }, 14);

    tl.to('.poem-line-container:nth-child(3)', {
      opacity: 1,
      y: -20,
      duration: 2,
      ease: 'power2.out'
    }, 14);

    tl.to('.poem-line-container:nth-child(3) .poem-letter', {
      textShadow: '0 0 30px #ffdcb4, 0 0 60px #ffdcb4',
      duration: 1
    }, 15);

    // 6. Fourth line - "A" with curtain color shift (18-23s)
    tl.to(this.curtain.material.color, {
      r: 0.6,
      g: 0.2,
      b: 0.3,
      duration: 4
    }, 18);

    tl.to('.poem-line-container:nth-child(4)', {
      opacity: 1,
      y: -20,
      duration: 2,
      ease: 'power2.out'
    }, 18);

    tl.to('.poem-line-container:nth-child(4) .poem-letter', {
      textShadow: '0 0 30px #ffdcb4, 0 0 60px #ffdcb4',
      duration: 1
    }, 19);

    // 7. Hold for a moment (23-25s)
    tl.to({}, { duration: 2 }, 23);

    // 8. Fade out poem lines (25-27s)
    tl.to('.poem-line-container', {
      opacity: 0,
      y: -40,
      stagger: 0.2,
      duration: 1.5,
      ease: 'power2.in'
    }, 25);

    // 9. Final reveal - MILA (27-35s)
    tl.to('.final-reveal', {
      opacity: 1,
      scale: 1,
      duration: 3,
      ease: 'power4.out',
      onStart: () => {
        // Confetti burst
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#ffdcb4', '#ff6b9d', '#88ddff', '#ffd700']
        });
      }
    }, 27);

    // 10. Brighten spotlight for final reveal
    tl.to(this.spotlight, {
      intensity: 5,
      duration: 2
    }, 27);

    // 11. Hold final reveal (35-42s)
    tl.to({}, { duration: 7 }, 35);

    // 12. Complete (42s)
    tl.call(() => this.complete(), null, 42);
  }

  /**
   * Complete the experience
   */
  complete() {
    if (this.isComplete) return;
    this.isComplete = true;

    console.log('✨ Stage Light complete!');

    setTimeout(() => {
      if (this.onComplete) {
        this.onComplete();
      }
      this.hide();
    }, 3000);
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.isAnimating || !this.renderer) return;

    requestAnimationFrame(() => this.animate());

    // Gentle camera movement
    this.camera.position.x = Math.sin(Date.now() * 0.0001) * 0.5;
    this.camera.position.y = Math.cos(Date.now() * 0.00015) * 0.5;
    this.camera.lookAt(0, 0, 0);

    // Animate dust particles
    this.particles.forEach(particles => {
      const positions = particles.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        let y = positions.getY(i);
        y += Math.sin(Date.now() * 0.001 + i) * 0.002;
        if (y > 7.5) y = -7.5;
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
    });

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize
   */
  onResize() {
    if (!this.renderer) return;

    const container = this.element.querySelector('.canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Hide the experience
   */
  hide() {
    // Stop animation loop FIRST
    this.isAnimating = false;

    if (this.timeline) {
      this.timeline.kill();
    }

    gsap.to(this.element, {
      opacity: 0,
      duration: 2,
      ease: 'power2.in',
      onComplete: () => {
        if (this.element && this.element.parentNode) {
          this.element.remove();
        }

        // Cleanup THREE.js resources
        if (this.renderer) {
          this.renderer.dispose();
          this.scene.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (obj.material.map) obj.material.map.dispose();
              obj.material.dispose();
            }
          });
          this.renderer = null;
          this.scene = null;
        }
      }
    });
  }
}

// Styles
const styles = `
.stage-light-experience {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stage-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.canvas-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.poem-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  padding: 2rem;
}

.poem-line-container {
  margin: 1.5rem 0;
  text-align: center;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.poem-letter {
  font-family: 'Cormorant Garamond', serif;
  font-size: 4rem;
  font-weight: 600;
  color: #ffdcb4;
  text-shadow: 0 0 20px rgba(255, 220, 180, 0.5);
  min-width: 80px;
}

.poem-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.8rem;
  font-weight: 300;
  font-style: italic;
  color: rgba(255, 240, 220, 0.95);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  line-height: 1.6;
}

.final-reveal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.8);
  text-align: center;
  z-index: 10;
}

.name-reveal {
  font-family: 'Cormorant Garamond', serif;
  font-size: 8rem;
  font-weight: 600;
  letter-spacing: 0.5rem;
  color: #ffdcb4;
  text-shadow: 0 0 40px rgba(255, 220, 180, 0.8),
               0 0 80px rgba(255, 220, 180, 0.4);
  margin-bottom: 1rem;
  animation: glow-pulse 3s ease-in-out infinite;
}

.name-meaning {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.5rem;
  font-weight: 300;
  letter-spacing: 0.3rem;
  color: rgba(255, 240, 220, 0.8);
  margin-bottom: 2rem;
  text-transform: uppercase;
}

.final-message {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.6rem;
  font-weight: 300;
  line-height: 1.8;
  color: rgba(255, 240, 220, 0.9);
  max-width: 600px;
  margin: 0 auto;
}

@keyframes glow-pulse {
  0%, 100% {
    text-shadow: 0 0 40px rgba(255, 220, 180, 0.6),
                 0 0 80px rgba(255, 220, 180, 0.3);
  }
  50% {
    text-shadow: 0 0 60px rgba(255, 220, 180, 0.9),
                 0 0 120px rgba(255, 220, 180, 0.6);
  }
}

@media (max-width: 768px) {
  .poem-line-container {
    flex-direction: column;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .poem-letter {
    font-size: 3rem;
    min-width: auto;
  }

  .poem-text {
    font-size: 1.3rem;
  }

  .name-reveal {
    font-size: 5rem;
    letter-spacing: 0.3rem;
  }

  .name-meaning {
    font-size: 1.1rem;
  }

  .final-message {
    font-size: 1.3rem;
  }
}

@media (max-width: 480px) {
  .poem-letter {
    font-size: 2.5rem;
  }

  .poem-text {
    font-size: 1.1rem;
  }

  .name-reveal {
    font-size: 4rem;
    letter-spacing: 0.2rem;
  }

  .name-meaning {
    font-size: 1rem;
  }

  .final-message {
    font-size: 1.1rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
