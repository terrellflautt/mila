/**
 * Act III - Puzzle 1: "Constellation You"
 * An interactive night sky where she connects stars to form constellations
 * Each constellation reveals how separate points create meaning together
 */

import * as THREE from 'three';
import gsap from 'gsap';
import confetti from 'canvas-confetti';

export class ConstellationYou {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.element = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.stars = [];
    this.selectedStars = [];
    this.lines = [];
    this.constellations = [];
    this.discoveredConstellations = 0;
    this.targetConstellations = 3;
    this.isComplete = false;
    this.isAnimating = true;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.audioContext = null;
    this.shootingStars = [];
  }

  /**
   * Show the puzzle
   */
  show() {
    this.element = this.createPuzzleElement();
    document.body.appendChild(this.element);

    // Initialize Three.js scene
    this.initScene();

    // Create starfield
    this.createStarfield();

    // Define constellations
    this.defineConstellations();

    // Add interaction
    this.addEventListeners();

    // Animate in
    gsap.fromTo(this.element,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1.5,
        ease: 'power2.out'
      }
    );

    // Start render loop
    this.animate();

    // Initialize audio
    this.initAudio();

    // Start shooting stars
    this.startShootingStars();
  }

  /**
   * Create puzzle HTML
   */
  createPuzzleElement() {
    const puzzle = document.createElement('div');
    puzzle.className = 'constellation-puzzle';
    puzzle.innerHTML = `
      <div class="constellation-container">
        <div class="constellation-header">
          <div class="puzzle-title">Constellation You</div>
          <div class="puzzle-subtitle">Connect the stars to reveal patterns</div>
          <div class="puzzle-hint">Tap stars in sequence - lines will form as you connect them</div>
        </div>

        <div class="constellation-canvas-container">
          <!-- Three.js canvas will be inserted here -->
        </div>

        <div class="constellation-progress">
          <div class="progress-text">${this.discoveredConstellations} of ${this.targetConstellations} constellations discovered</div>
        </div>

        <button class="constellation-clear-btn">Clear Selection</button>

        <div class="constellation-hint">
          <div class="hint-icon">✨</div>
          <div class="hint-text">Each star you tap connects to the previous one</div>
        </div>
      </div>
    `;

    return puzzle;
  }

  /**
   * Initialize Three.js scene
   */
  initScene() {
    const container = this.element.querySelector('.constellation-canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.z = 50;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Create starfield
   */
  createStarfield() {
    // Background stars (non-interactive, for atmosphere)
    const bgStarGeometry = new THREE.BufferGeometry();
    const bgStarCount = 200;
    const bgPositions = new Float32Array(bgStarCount * 3);

    for (let i = 0; i < bgStarCount; i++) {
      bgPositions[i * 3] = (Math.random() - 0.5) * 150;
      bgPositions[i * 3 + 1] = (Math.random() - 0.5) * 150;
      bgPositions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 20;
    }

    bgStarGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));

    const bgStarMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      transparent: true,
      opacity: 0.4
    });

    const bgStars = new THREE.Points(bgStarGeometry, bgStarMaterial);
    this.scene.add(bgStars);

    // Interactive stars (the ones she can connect)
    const starPositions = [
      // Constellation 1: Heart shape (top)
      { x: -8, y: 12, z: 0 },
      { x: -5, y: 15, z: 0 },
      { x: 0, y: 13, z: 0 },
      { x: 5, y: 15, z: 0 },
      { x: 8, y: 12, z: 0 },
      { x: 0, y: 5, z: 0 },

      // Constellation 2: Infinity loop (middle)
      { x: -15, y: -2, z: 0 },
      { x: -12, y: 2, z: 0 },
      { x: -8, y: 0, z: 0 },
      { x: -12, y: -4, z: 0 },
      { x: 8, y: 0, z: 0 },
      { x: 12, y: 2, z: 0 },
      { x: 15, y: -2, z: 0 },
      { x: 12, y: -4, z: 0 },

      // Constellation 3: Bridge/Path (bottom)
      { x: -10, y: -12, z: 0 },
      { x: -6, y: -10, z: 0 },
      { x: -2, y: -11, z: 0 },
      { x: 2, y: -11, z: 0 },
      { x: 6, y: -10, z: 0 },
      { x: 10, y: -12, z: 0 }
    ];

    starPositions.forEach((pos, index) => {
      const geometry = new THREE.SphereGeometry(0.5, 16, 16);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
      });
      const star = new THREE.Mesh(geometry, material);
      star.position.set(pos.x, pos.y, pos.z);
      star.userData = { index, selected: false };

      // Add glow
      const glowGeometry = new THREE.SphereGeometry(0.7, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaccff,
        transparent: true,
        opacity: 0
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      star.add(glow);
      star.userData.glow = glow;

      // Gentle twinkle animation
      gsap.to(material, {
        opacity: 0.6,
        duration: 1 + Math.random() * 2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: Math.random() * 2
      });

      this.stars.push(star);
      this.scene.add(star);
    });
  }

  /**
   * Define constellation patterns
   */
  defineConstellations() {
    this.constellations = [
      {
        name: 'M · i · l · a',
        indices: [0, 1, 2, 3, 4, 5, 0], // Forms the letter M
        message: 'In the vastness of space, countless stars—\nbut when I connect the dots, I only see you.',
        discovered: false,
        letter: 'M'
      },
      {
        name: 'Eternal',
        indices: [6, 7, 8, 9, 6, 10, 11, 12, 13, 10], // Infinity symbol
        message: 'Some things don\'t have endings.\nThis is one of them.',
        discovered: false,
        symbol: '∞'
      },
      {
        name: 'The Path to You',
        indices: [14, 15, 16, 17, 18, 19], // A bridge connecting
        message: 'Every moment led me here.\nEvery star was a step toward you.',
        discovered: false,
        symbol: '→'
      }
    ];
  }

  /**
   * Initialize audio context
   */
  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  /**
   * Play connection tone
   */
  playConnectionTone(frequency = 440) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  /**
   * Add event listeners
   */
  addEventListeners() {
    const canvas = this.renderer.domElement;

    // Simple click/tap to select stars
    canvas.addEventListener('click', (e) => this.onStarClick(e));

    // Touch support
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      this.onStarClick({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });

    // Hover effects
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // Clear button
    const clearBtn = this.element.querySelector('.constellation-clear-btn');
    clearBtn.addEventListener('click', () => this.clearSelection());
  }

  /**
   * Handle star click/tap - automatically connect to previous star
   */
  onStarClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.stars);

    if (intersects.length > 0) {
      const clickedStar = intersects[0].object;

      // If already selected, ignore
      if (clickedStar.userData.selected) return;

      // Mark as selected
      clickedStar.userData.selected = true;
      this.selectedStars.push(clickedStar);

      // Visual feedback
      gsap.to(clickedStar.material, {
        color: new THREE.Color(0xffd700),
        duration: 0.3
      });

      if (clickedStar.userData.glow) {
        gsap.to(clickedStar.userData.glow.material, {
          opacity: 0.8,
          color: new THREE.Color(0xffd700),
          duration: 0.3
        });
      }

      gsap.to(clickedStar.scale, {
        x: 1.4,
        y: 1.4,
        z: 1.4,
        duration: 0.3,
        ease: 'back.out(2)'
      });

      // Play connection tone
      const baseFreq = 440;
      const freq = baseFreq + (this.selectedStars.length * 100);
      this.playConnectionTone(freq);

      // Create particle burst
      this.createStarBurst(clickedStar.position);

      // If there's a previous star, automatically draw a line to it
      if (this.selectedStars.length > 1) {
        const previousStar = this.selectedStars[this.selectedStars.length - 2];
        this.drawLineBetweenStars(previousStar, clickedStar);
      }

      // Check for constellation match
      this.checkConstellationMatch();
    }
  }

  /**
   * Handle mouse move - hover effects only
   */
  onMouseMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.stars);

    // Reset all glows for non-selected stars
    this.stars.forEach(star => {
      if (!star.userData.selected && star.userData.glow) {
        gsap.to(star.userData.glow.material, {
          opacity: 0,
          duration: 0.3
        });
      }
    });

    // Highlight hovered star + change cursor
    if (intersects.length > 0) {
      const hoveredStar = intersects[0].object;
      this.renderer.domElement.style.cursor = 'pointer';

      if (!hoveredStar.userData.selected) {
        if (hoveredStar.userData.glow) {
          gsap.to(hoveredStar.userData.glow.material, {
            opacity: 0.6,
            duration: 0.2
          });
        }
        // Pulse the star itself
        gsap.to(hoveredStar.scale, {
          x: 1.2,
          y: 1.2,
          z: 1.2,
          duration: 0.2,
          ease: 'power2.out'
        });
      }
    } else {
      this.renderer.domElement.style.cursor = 'default';
      // Reset scale for all non-selected stars
      this.stars.forEach(star => {
        if (!star.userData.selected) {
          gsap.to(star.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.2
          });
        }
      });
    }
  }

  /**
   * Create particle burst at star
   */
  createStarBurst(position) {
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 1
      });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);

      this.scene.add(particle);

      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 2 + Math.random() * 2;
      const targetX = position.x + Math.cos(angle) * distance;
      const targetY = position.y + Math.sin(angle) * distance;

      gsap.to(particle.position, {
        x: targetX,
        y: targetY,
        duration: 0.8,
        ease: 'power2.out'
      });

      gsap.to(particle.material, {
        opacity: 0,
        duration: 0.8,
        onComplete: () => {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      });
    }
  }

  /**
   * Draw line between two stars
   */
  drawLineBetweenStars(star1, star2) {
    const points = [];
    points.push(star1.position.clone());
    points.push(star2.position.clone());

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0
    });

    const line = new THREE.Line(geometry, material);
    this.lines.push(line);
    this.scene.add(line);

    // Animate line in
    gsap.to(material, {
      opacity: 0.8,
      duration: 0.5,
      ease: 'power2.out'
    });
  }

  /**
   * Clear current selection
   */
  clearSelection() {
    // Reset stars
    this.selectedStars.forEach(star => {
      star.userData.selected = false;

      gsap.to(star.material, {
        color: new THREE.Color(0xffffff),
        duration: 0.5
      });

      if (star.userData.glow) {
        gsap.to(star.userData.glow.material, {
          opacity: 0,
          color: new THREE.Color(0xaaccff),
          duration: 0.5
        });
      }

      gsap.to(star.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.5,
        ease: 'power2.out'
      });
    });

    // Remove lines
    this.lines.forEach(line => {
      gsap.to(line.material, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          this.scene.remove(line);
          line.geometry.dispose();
          line.material.dispose();
        }
      });
    });

    this.selectedStars = [];
    this.lines = [];
  }

  /**
   * Check if selected stars match a constellation
   */
  checkConstellationMatch() {
    const selectedIndices = this.selectedStars.map(star => star.userData.index);

    for (const constellation of this.constellations) {
      if (constellation.discovered) continue;

      // Check if selected stars contain all the unique indices needed for this constellation
      // (order doesn't matter, just that the right stars are connected)
      const uniqueConstellationIndices = [...new Set(constellation.indices)];

      if (this.hasAllIndices(selectedIndices, uniqueConstellationIndices)) {
        this.discoverConstellation(constellation);
        break;
      }
    }
  }

  /**
   * Check if selectedIndices contains all required indices (order doesn't matter)
   */
  hasAllIndices(selectedIndices, requiredIndices) {
    // Must have at least the minimum required connections
    if (selectedIndices.length < requiredIndices.length) return false;

    // Check if all required indices are present in selected
    return requiredIndices.every(index => selectedIndices.includes(index));
  }

  /**
   * Discover a constellation
   */
  discoverConstellation(constellation) {
    constellation.discovered = true;
    this.discoveredConstellations++;

    // Lock in the constellation (make it permanent)
    this.lines.forEach(line => {
      gsap.to(line.material, {
        color: new THREE.Color(0x88ddff),
        opacity: 1,
        duration: 1
      });
    });

    // Show constellation message
    this.showConstellationMessage(constellation);

    // Update progress
    this.updateProgress();

    // Check if all constellations found
    if (this.discoveredConstellations >= this.targetConstellations) {
      setTimeout(() => {
        this.complete();
      }, 4000);
    } else {
      // Reset selection after delay
      setTimeout(() => {
        this.selectedStars = [];
        this.lines = [];
      }, 2000);
    }
  }

  /**
   * Show constellation message
   */
  showConstellationMessage(constellation) {
    const messageEl = document.createElement('div');
    messageEl.className = 'constellation-message';
    messageEl.innerHTML = `
      <div class="constellation-name">${constellation.name}</div>
      <div class="constellation-poem">${constellation.message}</div>
    `;

    this.element.appendChild(messageEl);

    gsap.fromTo(messageEl,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power2.out'
      }
    );

    setTimeout(() => {
      gsap.to(messageEl, {
        opacity: 0,
        y: -30,
        duration: 0.8,
        ease: 'power2.in',
        onComplete: () => messageEl.remove()
      });
    }, 3500);
  }

  /**
   * Update progress display
   */
  updateProgress() {
    const progressText = this.element?.querySelector('.progress-text');
    if (!progressText) return;

    progressText.textContent = `${this.discoveredConstellations} of ${this.targetConstellations} constellations discovered`;

    gsap.fromTo(progressText,
      {
        transform: 'scale(1.2)',
        color: '#ffd700'
      },
      {
        transform: 'scale(1)',
        color: '',
        duration: 0.5,
        ease: 'back.out(2)'
      }
    );
  }

  /**
   * Complete the puzzle
   */
  async complete() {
    if (this.isComplete) return;
    this.isComplete = true;

    console.log('⭐ Constellation You complete!');

    // Show final message
    await this.showFinalMessage();

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
    // Make all constellations glow brighter
    this.lines.forEach(line => {
      gsap.to(line.material, {
        opacity: 1,
        color: new THREE.Color(0xffd700),
        duration: 2
      });
    });

    this.stars.forEach(star => {
      if (star.userData.selected) {
        gsap.to(star.material, {
          color: new THREE.Color(0xffd700),
          duration: 2
        });
        if (star.userData.glow) {
          gsap.to(star.userData.glow.material, {
            opacity: 1,
            color: new THREE.Color(0xffd700),
            duration: 2
          });
        }
      }
    });

    // Create spectacular particle shower
    for (let i = 0; i < 50; i++) {
      setTimeout(() => this.createShootingStar(true), i * 100);
    }

    // Show final message
    const finalEl = document.createElement('div');
    finalEl.className = 'constellation-final';
    finalEl.innerHTML = `
      <div class="final-text">
        <div class="final-symbol">M ∞ →</div>
        <br>
        In a universe of infinite possibilities,<br>
        you were the constellation I was meant to find.<br>
        <br>
        Every point of light, every moment, every path—<br>
        they all form the same pattern:<br>
        <br>
        <span class="final-highlight">You.</span>
      </div>
    `;

    this.element.appendChild(finalEl);

    gsap.fromTo(finalEl,
      { opacity: 0, scale: 0.8, y: 50 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 2,
        ease: 'power4.out'
      }
    );

    // Confetti burst
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#88ddff', '#ffffff']
      });
    }, 1000);
  }

  /**
   * Start shooting stars ambient effect
   */
  startShootingStars() {
    const createRandomShootingStar = () => {
      if (!this.isAnimating) return;
      this.createShootingStar(false);
      setTimeout(createRandomShootingStar, 3000 + Math.random() * 4000);
    };
    setTimeout(createRandomShootingStar, 2000);
  }

  /**
   * Create a shooting star effect
   */
  createShootingStar(isFinal = false) {
    const startX = (Math.random() - 0.5) * 100;
    const startY = 40 + Math.random() * 20;
    const startZ = -30;

    const geometry = new THREE.SphereGeometry(isFinal ? 0.4 : 0.3, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: isFinal ? 0xffd700 : 0xffffff,
      transparent: true,
      opacity: 1
    });
    const star = new THREE.Mesh(geometry, material);
    star.position.set(startX, startY, startZ);

    // Create trail
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({
      color: isFinal ? 0xffd700 : 0xaaccff,
      transparent: true,
      opacity: 0.6
    });
    const trail = new THREE.Line(trailGeometry, trailMaterial);

    this.scene.add(star);
    this.scene.add(trail);
    this.shootingStars.push({ star, trail });

    const endX = startX - 40 - Math.random() * 20;
    const endY = startY - 40 - Math.random() * 20;

    const duration = isFinal ? 1.5 : 2;

    gsap.to(star.position, {
      x: endX,
      y: endY,
      duration,
      ease: 'power2.in'
    });

    gsap.to(material, {
      opacity: 0,
      duration: duration * 0.7,
      delay: duration * 0.3,
      onComplete: () => {
        this.scene.remove(star);
        this.scene.remove(trail);
        geometry.dispose();
        material.dispose();
        trailGeometry.dispose();
        trailMaterial.dispose();
      }
    });

    // Animate trail
    const updateTrail = () => {
      const points = [];
      points.push(star.position.clone());
      points.push(new THREE.Vector3(
        star.position.x + 3,
        star.position.y + 3,
        star.position.z
      ));
      trail.geometry.setFromPoints(points);
    };

    const trailInterval = setInterval(() => {
      if (!this.isAnimating) {
        clearInterval(trailInterval);
        return;
      }
      updateTrail();
    }, 16);

    setTimeout(() => clearInterval(trailInterval), duration * 1000);
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.isAnimating || !this.renderer) return;

    requestAnimationFrame(() => this.animate());

    // Gentle camera movement
    this.camera.position.x = Math.sin(Date.now() * 0.0001) * 2;
    this.camera.position.y = Math.cos(Date.now() * 0.00015) * 2;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize
   */
  onResize() {
    if (!this.renderer) return;

    const container = this.element.querySelector('.constellation-canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Hide the puzzle
   */
  hide() {
    // Stop animation loop FIRST
    this.isAnimating = false;

    gsap.to(this.element, {
      opacity: 0,
      duration: 1,
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

        if (this.audioContext) {
          this.audioContext.close();
        }
      }
    });
  }
}

// Styles
const styles = `
.constellation-puzzle {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  background: radial-gradient(circle at 50% 50%, #1a1a3a 0%, #0a0a1a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.constellation-container {
  width: 90%;
  max-width: 1200px;
  height: 90vh;
  display: flex;
  flex-direction: column;
}

.constellation-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.puzzle-subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.5rem;
}

.puzzle-hint {
  font-size: 0.9rem;
  font-style: italic;
  color: rgba(136, 221, 255, 0.7);
}

.constellation-canvas-container {
  flex: 1;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid rgba(136, 221, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  position: relative;
}

.constellation-progress {
  margin-top: 1.5rem;
  text-align: center;
}

.progress-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  color: var(--color-secondary, #FFE4E1);
}

.constellation-clear-btn {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  color: var(--color-primary, #FFF8F0);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.constellation-clear-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.constellation-hint {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  border: 1px solid rgba(136, 221, 255, 0.3);
}

.hint-icon {
  font-size: 1.25rem;
  animation: pulse-hint 2s ease-in-out infinite;
}

@keyframes pulse-hint {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}

.hint-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
}

.constellation-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  border: 2px solid rgba(136, 221, 255, 0.5);
  max-width: 600px;
  z-index: 10;
}

.constellation-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2rem;
  font-weight: 400;
  color: #ffd700;
  margin-bottom: 1rem;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}

.constellation-poem {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.1rem;
  font-weight: 300;
  line-height: 1.8;
  color: var(--color-primary, #FFF8F0);
}

.constellation-final {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  padding: 3rem;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 2px solid rgba(136, 221, 255, 0.6);
  max-width: 700px;
  z-index: 10;
}

.final-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 400;
  line-height: 1.8;
  color: var(--color-primary, #FFF8F0);
}

.final-symbol {
  font-size: 3rem;
  font-weight: 600;
  letter-spacing: 1rem;
  color: #ffd700;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
  margin-bottom: 1rem;
  animation: glow-pulse 2s ease-in-out infinite;
}

.final-highlight {
  font-size: 2.5rem;
  font-weight: 600;
  color: #ffd700;
  text-shadow: 0 0 40px rgba(255, 215, 0, 0.9);
  display: inline-block;
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% {
    text-shadow: 0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.4);
  }
  50% {
    text-shadow: 0 0 40px rgba(255, 215, 0, 0.9), 0 0 80px rgba(255, 215, 0, 0.6);
  }
}

@media (max-width: 768px) {
  .constellation-container {
    width: 95%;
    height: 95vh;
  }

  .constellation-clear-btn {
    bottom: 1rem;
    right: 1rem;
    padding: 0.6rem 1.2rem;
    font-size: 0.8rem;
  }

  .constellation-hint {
    bottom: 1rem;
    padding: 0.75rem 1.25rem;
  }

  .hint-text {
    font-size: 0.8rem;
  }

  .constellation-name {
    font-size: 1.75rem;
  }

  .constellation-poem {
    font-size: 1rem;
  }

  .final-text {
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .constellation-hint {
    flex-direction: column;
    gap: 0.5rem;
  }

  .hint-text {
    font-size: 0.75rem;
  }

  .constellation-poem {
    font-size: 0.95rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
