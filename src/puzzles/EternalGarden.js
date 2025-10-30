/**
 * Act III - Finale: "Eternal Garden"
 * A living, breathing particle garden that grows with her presence
 * Each interaction plants seeds that bloom into beautiful patterns
 */

import * as THREE from 'three';
import gsap from 'gsap';
import confetti from 'canvas-confetti';

export class EternalGarden {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.element = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.flowers = [];
    this.particles = [];
    this.seeds = [];
    this.bloomCount = 0;
    this.targetBlooms = 12;
    this.isComplete = false;
    this.isAnimating = true; // Flag to control animation loop
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.audioContext = null;
    this.time = 0;
    this.flamingosArrived = false;
    this.gameTime = 6; // Start at 6 AM (sunrise)
    this.lastTimeUpdate = Date.now();
    this.stars = [];
    this.shootingStars = [];
    this.ground = null; // Store ground mesh for uniform updates
  }

  /**
   * Show the puzzle
   */
  show() {
    this.element = this.createPuzzleElement();
    document.body.appendChild(this.element);

    // Initialize Three.js scene
    this.initScene();

    // Create initial garden elements
    this.createGardenBase();

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
  }

  /**
   * Create puzzle HTML
   */
  createPuzzleElement() {
    const puzzle = document.createElement('div');
    puzzle.className = 'garden-puzzle';
    puzzle.innerHTML = `
      <div class="garden-container">
        <button class="garden-exit-btn" title="Return to Gallery">
          <span class="exit-icon">✕</span>
        </button>

        <div class="garden-header">
          <div class="puzzle-title">Eternal Garden</div>
          <div class="puzzle-subtitle">Plant seeds with your presence, watch them grow into something lasting</div>
        </div>

        <div class="garden-canvas-container">
          <!-- Three.js canvas will be inserted here -->
        </div>

        <div class="garden-progress">
          <div class="progress-text">${this.bloomCount} of ${this.targetBlooms} flowers blooming</div>
        </div>

        <div class="garden-hint">
          <div class="hint-icon">🌱</div>
          <div class="hint-text">Click to plant seeds... watch them grow</div>
        </div>
      </div>
    `;

    return puzzle;
  }

  /**
   * Initialize Three.js scene
   */
  initScene() {
    const container = this.element.querySelector('.garden-canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();

    // Dynamic background canvas for day/night cycle
    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = 2;
    this.bgCanvas.height = 256;
    this.bgContext = this.bgCanvas.getContext('2d');

    this.bgTexture = new THREE.Texture(this.bgCanvas);
    this.bgTexture.needsUpdate = true;
    this.scene.background = this.bgTexture;

    // Create stars for night sky
    this.createStars();

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.z = 40;
    this.camera.position.y = 5;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffd9b3, 0.6);
    sunLight.position.set(20, 30, 20);
    this.scene.add(sunLight);

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Create stars for night sky
   */
  createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 200;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;     // x
      positions[i + 1] = Math.random() * 50 + 10;     // y (above ground)
      positions[i + 2] = (Math.random() - 0.5) * 100; // z
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(starField);
    this.stars.push(starField);
  }

  /**
   * Create garden base
   */
  createGardenBase() {
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
    const groundMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;

        void main() {
          vec3 color1 = vec3(0.1, 0.15, 0.1); // Dark green
          vec3 color2 = vec3(0.15, 0.25, 0.15); // Lighter green
          float pattern = sin(vUv.x * 20.0) * sin(vUv.y * 20.0);
          vec3 color = mix(color1, color2, pattern * 0.5 + 0.5);
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -5;
    this.scene.add(this.ground);

    // Ambient fireflies/particles
    this.createAmbientParticles();
  }

  /**
   * Create ambient floating particles
   */
  createAmbientParticles() {
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.7),
        transparent: true,
        opacity: 0.6
      });
      const particle = new THREE.Mesh(geometry, material);

      particle.position.x = (Math.random() - 0.5) * 60;
      particle.position.y = Math.random() * 30 - 5;
      particle.position.z = (Math.random() - 0.5) * 60;

      this.particles.push(particle);
      this.scene.add(particle);

      // Floating animation
      gsap.to(particle.position, {
        y: particle.position.y + (Math.random() * 10 - 5),
        duration: 5 + Math.random() * 5,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });

      // Pulse opacity
      gsap.to(particle.material, {
        opacity: Math.random() * 0.4 + 0.2,
        duration: 2 + Math.random() * 2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    }
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
   * Play growth sound
   */
  playGrowthSound(pitch = 1) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const baseFreq = 300;
    oscillator.frequency.setValueAtTime(baseFreq * pitch, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * pitch * 1.5, this.audioContext.currentTime + 0.5);

    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.8);
  }

  /**
   * Add event listeners
   */
  addEventListeners() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('click', (e) => this.onCanvasClick(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.onCanvasClick({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });

    // Exit button
    const exitBtn = this.element.querySelector('.garden-exit-btn');
    exitBtn.addEventListener('click', () => {
      this.hide();
    });
  }

  /**
   * Handle mouse move
   */
  onMouseMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * Handle canvas click - plant a seed
   */
  onCanvasClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Calculate world position
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const groundY = -5;
    const planeNormal = new THREE.Vector3(0, 1, 0);
    const planePoint = new THREE.Vector3(0, groundY, 0);
    const intersectPoint = new THREE.Vector3();

    this.raycaster.ray.intersectPlane(
      new THREE.Plane(planeNormal, -groundY),
      intersectPoint
    );

    if (intersectPoint) {
      this.plantSeed(intersectPoint);
    }
  }

  /**
   * Plant a seed at position
   */
  plantSeed(position) {
    // Create seed
    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0x8b4513,
      transparent: true,
      opacity: 1
    });
    const seed = new THREE.Mesh(geometry, material);
    seed.position.copy(position);
    seed.position.y = -4.7;

    this.scene.add(seed);
    this.seeds.push(seed);

    // Planting animation
    gsap.fromTo(seed.scale,
      { x: 0, y: 0, z: 0 },
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.3,
        ease: 'back.out(2)',
        onComplete: () => {
          // Grow into flower after delay
          setTimeout(() => {
            this.growFlower(position, seed);
          }, 500);
        }
      }
    );

    // Play planting sound
    this.playGrowthSound(0.8);

    // Particle burst
    this.createPlantingBurst(position);
  }

  /**
   * Create particle burst when planting
   */
  createPlantingBurst(position) {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.15, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0x8b4513,
        transparent: true,
        opacity: 1
      });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      particle.position.y = -4.5;

      this.scene.add(particle);

      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 1 + Math.random();
      const targetX = position.x + Math.cos(angle) * distance;
      const targetZ = position.z + Math.sin(angle) * distance;

      gsap.to(particle.position, {
        x: targetX,
        z: targetZ,
        y: -4,
        duration: 0.6,
        ease: 'power2.out'
      });

      gsap.to(particle.material, {
        opacity: 0,
        duration: 0.6,
        onComplete: () => {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      });
    }
  }

  /**
   * Grow a flower from seed
   */
  growFlower(position, seed) {
    const flowerGroup = new THREE.Group();
    flowerGroup.position.copy(position);
    flowerGroup.position.y = -4.7;

    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0, 8);
    const stemMaterial = new THREE.MeshBasicMaterial({ color: 0x228b22 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0;
    flowerGroup.add(stem);

    // Flower petals
    const petalCount = 6;
    const hue = Math.random();
    for (let i = 0; i < petalCount; i++) {
      const petalGeometry = new THREE.CircleGeometry(0.5, 16);
      const petalMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(hue, 0.8, 0.6),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      const petal = new THREE.Mesh(petalGeometry, petalMaterial);

      const angle = (i / petalCount) * Math.PI * 2;
      petal.position.x = Math.cos(angle) * 0.4;
      petal.position.z = Math.sin(angle) * 0.4;
      petal.position.y = 0;
      petal.rotation.x = Math.PI / 2;

      flowerGroup.add(petal);
      petal.userData.angle = angle;
    }

    // Center
    const centerGeometry = new THREE.CircleGeometry(0.3, 16);
    const centerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      side: THREE.DoubleSide
    });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.rotation.x = -Math.PI / 2;
    center.position.y = 0.1;
    flowerGroup.add(center);

    this.scene.add(flowerGroup);
    this.flowers.push(flowerGroup);

    // Remove seed
    gsap.to(seed.material, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        this.scene.remove(seed);
        seed.geometry.dispose();
        seed.material.dispose();
      }
    });

    // Slow, peaceful growth animation
    gsap.fromTo(stemGeometry.parameters,
      { height: 0 },
      {
        height: 4,
        duration: 4,
        ease: 'power1.inOut',
        onUpdate: () => {
          stemGeometry.dispose();
          const newStem = new THREE.CylinderGeometry(0.05, 0.08, stemGeometry.parameters.height, 8);
          stem.geometry = newStem;
          flowerGroup.position.y = -4.7 + stemGeometry.parameters.height / 2;
        }
      }
    );

    // Petals bloom slowly after stem grows
    flowerGroup.children.slice(1).forEach((petal, i) => {
      petal.scale.set(0, 0, 0);
      gsap.to(petal.scale,
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 1,
          delay: 1 + (i * 0.1),
          ease: 'back.out(2)'
        }
      );
    });

    // Play growth sound
    setTimeout(() => this.playGrowthSound(1 + hue), 1000);

    // Gentle sway animation
    gsap.to(flowerGroup.rotation, {
      z: (Math.random() - 0.5) * 0.2,
      duration: 2 + Math.random() * 2,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    // Count bloom
    this.bloomCount++;
    this.updateProgress();

    // Flamingos fly in halfway through (after 6 flowers)
    if (this.bloomCount === 6 && !this.flamingosArrived) {
      this.flamingosArrived = true;
      setTimeout(() => {
        this.flamingosFlyIn();
      }, 1000);
    }

    if (this.bloomCount >= this.targetBlooms) {
      setTimeout(() => {
        this.complete();
      }, 2000);
    }
  }

  /**
   * Update progress display
   */
  updateProgress() {
    const progressText = this.element?.querySelector('.progress-text');
    if (!progressText) return;

    progressText.textContent = `${this.bloomCount} of ${this.targetBlooms} flowers blooming`;

    // Animate text with proper transform
    gsap.fromTo(progressText,
      {
        transform: 'scale(1.2)',
        color: '#88ee88'
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

    // All flowers glow
    this.flowers.forEach(flower => {
      flower.children.forEach(child => {
        if (child.material) {
          gsap.to(child.material, {
            emissive: new THREE.Color(0xffffff),
            emissiveIntensity: 0.5,
            duration: 2
          });
        }
      });
    });

    // Wait a moment for user to appreciate the garden
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Show final message
    await this.showFinalMessage();

    setTimeout(() => {
      if (this.onComplete) {
        this.onComplete();
      }
      this.hide();
    }, 8000);
  }

  /**
   * Create beautiful SVG flamingo (from loading screen)
   */
  createFlamingoElement() {
    const bird = document.createElement('div');
    bird.className = 'garden-flamingo';
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
   * Flamingos fly in to rest in the garden
   */
  async flamingosFlyIn() {
    return new Promise((resolve) => {
      const container = this.element.querySelector('.garden-canvas-container');
      if (!container) {
        resolve();
        return;
      }

      // Create two flamingos
      const flamingo1 = this.createFlamingoElement();
      const flamingo2 = this.createFlamingoElement();

      container.appendChild(flamingo1);
      container.appendChild(flamingo2);

      const centerX = container.clientWidth / 2;
      const centerY = container.clientHeight / 2;
      const flamingoScale = window.innerWidth < 768 ? 0.8 : 1.2;

      // Flamingo 1 - starts from left
      gsap.set(flamingo1, {
        x: -150,
        y: centerY - 100,
        opacity: 0,
        transformOrigin: 'center center'
      });
      flamingo1.style.transform = `scale(${flamingoScale}) rotate(45deg)`;

      // Flamingo 2 - starts from right
      gsap.set(flamingo2, {
        x: container.clientWidth + 150,
        y: centerY - 100,
        opacity: 0,
        transformOrigin: 'center center'
      });
      flamingo2.style.transform = `scale(${flamingoScale}) rotate(-45deg)`;

      // Animation timeline
      const tl = gsap.timeline();

      // Flamingo 1 flies in first
      tl.to(flamingo1, {
        opacity: 1,
        duration: 0.5,
        onUpdate: function() {
          const progress = this.progress();
          if (progress > 0) {
            const currentRotation = 45 - (50 * progress);
            flamingo1.style.transform = `scale(${flamingoScale}) rotate(${currentRotation}deg)`;
          }
        }
      })
      .to(flamingo1, {
        x: centerX - 80,
        y: centerY + 20,
        duration: 2.5,
        ease: 'power2.inOut',
        onUpdate: function() {
          flamingo1.style.transform = `scale(${flamingoScale}) rotate(-5deg)`;
        }
      })

      // Flamingo 2 joins after a delay
      .to(flamingo2, {
        opacity: 1,
        duration: 0.5,
        onUpdate: function() {
          const progress = this.progress();
          if (progress > 0) {
            const currentRotation = -45 + (50 * progress);
            flamingo2.style.transform = `scale(${flamingoScale}) rotate(${currentRotation}deg)`;
          }
        }
      }, 1.5)
      .to(flamingo2, {
        x: centerX + 80,
        y: centerY + 20,
        duration: 2.5,
        ease: 'power2.inOut',
        onUpdate: function() {
          flamingo2.style.transform = `scale(${flamingoScale}) rotate(5deg)`;
        }
      }, 1.5)

      // Both rest together
      .to({}, { duration: 3 })

      // Fly away together upward
      .to([flamingo1, flamingo2], {
        x: centerX,
        y: -200,
        duration: 2.5,
        ease: 'power2.in',
        onUpdate: function() {
          const progress = this.progress();
          const currentScale = flamingoScale - (flamingoScale * 0.6 * progress);
          flamingo1.style.transform = `scale(${currentScale}) rotate(0deg)`;
          flamingo2.style.transform = `scale(${currentScale}) rotate(0deg)`;
        }
      })

      // Wait before returning
      .to({}, { duration: 4 })

      // Return together from above
      .set([flamingo1, flamingo2], {
        y: -200,
        x: centerX,
        onComplete: () => {
          flamingo1.style.transform = `scale(${flamingoScale * 0.4}) rotate(0deg)`;
          flamingo2.style.transform = `scale(${flamingoScale * 0.4}) rotate(0deg)`;
        }
      })
      .to([flamingo1, flamingo2], {
        opacity: 1,
        duration: 0.5
      })
      .to(flamingo1, {
        x: centerX - 60,
        y: centerY + 40,
        duration: 2.5,
        ease: 'power2.inOut',
        onUpdate: function() {
          const progress = this.progress();
          const currentScale = (flamingoScale * 0.4) + ((flamingoScale * 0.6) * progress);
          flamingo1.style.transform = `scale(${currentScale}) rotate(-5deg)`;
        }
      })
      .to(flamingo2, {
        x: centerX + 60,
        y: centerY + 40,
        duration: 2.5,
        ease: 'power2.inOut',
        onUpdate: function() {
          const progress = this.progress();
          const currentScale = (flamingoScale * 0.4) + ((flamingoScale * 0.6) * progress);
          flamingo2.style.transform = `scale(${currentScale}) rotate(5deg)`;
        }
      }, '<')

      // Rest next to each other
      .to({}, {
        duration: 1,
        onComplete: () => {
          // Wing flapping animation
          const wings1 = flamingo1.querySelectorAll('.wing');
          const wings2 = flamingo2.querySelectorAll('.wing');

          gsap.to([...wings1, ...wings2], {
            scaleY: 0.6,
            transformOrigin: 'center center',
            duration: 0.15,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
          });

          resolve();
        }
      });
    });
  }

  // Keep old 3D implementation as backup
  async flamingosFlyIn_OLD_3D() {
    return new Promise((resolve) => {
      const flamingos = [];
      const flamingoCount = 3;

      for (let i = 0; i < flamingoCount; i++) {
        const flamingoGroup = new THREE.Group();

        // Body
        const bodyGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        bodyGeometry.scale(1, 0.8, 1.2);
        const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xFFB6C1 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        flamingoGroup.add(body);

        // Neck
        const neckGeometry = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 8);
        const neckMaterial = new THREE.MeshBasicMaterial({ color: 0xFFB6C1 });
        const neck = new THREE.Mesh(neckGeometry, neckMaterial);
        neck.position.set(0.3, 0.8, 0);
        neck.rotation.z = 0.3;
        flamingoGroup.add(neck);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headMaterial = new THREE.MeshBasicMaterial({ color: 0xFFB6C1 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0.8, 1.5, 0);
        flamingoGroup.add(head);

        // Beak
        const beakGeometry = new THREE.ConeGeometry(0.1, 0.4, 8);
        const beakMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const beak = new THREE.Mesh(beakGeometry, beakMaterial);
        beak.position.set(1.0, 1.5, 0);
        beak.rotation.z = -Math.PI / 2;
        flamingoGroup.add(beak);

        // Wings
        const wingGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        wingGeometry.scale(1.5, 0.3, 0.8);
        const wingMaterial = new THREE.MeshBasicMaterial({ color: 0xFF99AA });

        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.2, 0.2, 0.8);
        flamingoGroup.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(-0.2, 0.2, -0.8);
        flamingoGroup.add(rightWing);

        // Start position (off screen, flying from different directions)
        const startAngles = [-60, 0, 60];
        const angle = (startAngles[i] * Math.PI) / 180;
        flamingoGroup.position.set(
          Math.cos(angle) * 30,
          8 + i * 2,
          Math.sin(angle) * 30
        );
        flamingoGroup.rotation.y = -angle;

        this.scene.add(flamingoGroup);
        flamingos.push({ group: flamingoGroup, leftWing, rightWing });

        // Wing flapping animation
        gsap.to(leftWing.rotation, {
          z: 0.8,
          duration: 0.3,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut'
        });

        gsap.to(rightWing.rotation, {
          z: -0.8,
          duration: 0.3,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut'
        });

        // Landing position (among the flowers)
        const landX = (i - 1) * 4;
        const landZ = -5 + i * 2;

        // Fly in gracefully
        gsap.to(flamingoGroup.position, {
          x: landX,
          y: -2,
          z: landZ,
          duration: 3 + i * 0.5,
          delay: i * 0.4,
          ease: 'power1.inOut'
        });

        gsap.to(flamingoGroup.rotation, {
          y: 0,
          duration: 3 + i * 0.5,
          delay: i * 0.4,
          ease: 'power1.inOut'
        });

        // Gentle resting animation after landing
        setTimeout(() => {
          // Slow down wings to resting position
          gsap.killTweensOf([leftWing.rotation, rightWing.rotation]);
          gsap.to([leftWing.rotation, rightWing.rotation], {
            z: 0,
            duration: 1,
            ease: 'power2.out'
          });

          // Gentle idle sway
          gsap.to(flamingoGroup.rotation, {
            z: (Math.random() - 0.5) * 0.1,
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: 'sine.inOut'
          });
        }, (3 + i * 0.5 + i * 0.4) * 1000);
      }

      // Resolve after all flamingos land
      setTimeout(() => {
        resolve();
      }, 5000);
    });
  }

  /**
   * Show final message
   */
  async showFinalMessage() {
    const finalEl = document.createElement('div');
    finalEl.className = 'garden-final';
    finalEl.innerHTML = `
      <div class="final-text">
        You planted something that will keep growing,<br>
        long after this moment passes.<br>
        <br>
        Some gardens bloom forever—<br>
        tended by attention,<br>
        watered by intention,<br>
        growing in the space between two people<br>
        who chose to create something beautiful together.
      </div>
      <div class="final-signature">— The End, and The Beginning</div>
    `;

    this.element.appendChild(finalEl);

    gsap.fromTo(finalEl,
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1,
        scale: 1,
        duration: 2,
        ease: 'power2.out'
      }
    );
  }

  /**
   * Animation loop
   */
  animate() {
    // Stop animation if flag is false or renderer is gone
    if (!this.isAnimating || !this.renderer) return;

    requestAnimationFrame(() => this.animate());

    this.time += 0.01;

    // Update ground shader uniform
    if (this.ground && this.ground.material.uniforms) {
      this.ground.material.uniforms.time.value = this.time;
    }

    // Gentle camera sway
    this.camera.position.x = Math.sin(this.time * 0.1) * 3;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize
   */
  onResize() {
    if (!this.renderer) return;

    const container = this.element.querySelector('.garden-canvas-container');
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
    // Stop animation loop FIRST to prevent rendering errors
    this.isAnimating = false;

    gsap.to(this.element, {
      opacity: 0,
      duration: 1.5,
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
.garden-puzzle {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  background: radial-gradient(circle at 50% 50%, #2d1f3d 0%, #0a1628 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.garden-container {
  width: 90%;
  max-width: 1200px;
  height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.garden-exit-btn {
  position: absolute;
  top: -3rem;
  right: 0;
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 100;
}

.garden-exit-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--color-highlight, #FFB6C1);
  transform: scale(1.1) rotate(90deg);
}

.garden-exit-btn .exit-icon {
  font-size: 1.5rem;
  color: var(--color-primary, #FFF8F0);
  font-weight: 300;
  transition: color 0.3s ease;
}

.garden-exit-btn:hover .exit-icon {
  color: var(--color-highlight, #FFB6C1);
}

.garden-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.garden-canvas-container {
  flex: 1;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid rgba(136, 238, 136, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 60px rgba(136, 238, 136, 0.1);
  position: relative;
  cursor: crosshair;
}

.garden-flamingo {
  position: absolute;
  width: 100px;
  height: 100px;
  pointer-events: none;
  z-index: 100;
  filter: drop-shadow(0 6px 12px rgba(255, 107, 157, 0.5));
}

.garden-flamingo svg {
  width: 100%;
  height: 100%;
}

.garden-progress {
  margin-top: 1.5rem;
  text-align: center;
}

.progress-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  color: var(--color-secondary, #FFE4E1);
}

.garden-hint {
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
  border: 1px solid rgba(136, 238, 136, 0.3);
}

.hint-icon {
  font-size: 1.25rem;
  animation: grow-pulse 2s ease-in-out infinite;
}

@keyframes grow-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.hint-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
}

.garden-final {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  padding: 3rem;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 2px solid rgba(136, 238, 136, 0.6);
  box-shadow: 0 0 60px rgba(136, 238, 136, 0.3);
  max-width: 700px;
  max-height: 85vh;
  max-height: 85dvh;
  overflow-y: auto;
  z-index: 10;
}

.final-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.4rem;
  font-weight: 400;
  line-height: 1.8;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 2rem;
}

.final-signature {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.1rem;
  font-weight: 300;
  font-style: italic;
  color: var(--color-highlight, #FFB6C1);
}

@media (max-width: 768px) {
  .garden-container {
    width: 95%;
    height: 95vh;
  }

  .garden-exit-btn {
    top: -2.5rem;
    width: 40px;
    height: 40px;
  }

  .garden-exit-btn .exit-icon {
    font-size: 1.25rem;
  }

  .garden-hint {
    bottom: 1rem;
    padding: 0.75rem 1.25rem;
  }

  .hint-text {
    font-size: 0.8rem;
  }

  .garden-final {
    padding: 2rem 1.5rem;
    max-width: 90%;
  }

  .final-text {
    font-size: 1.2rem;
  }

  .final-signature {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .garden-hint {
    flex-direction: column;
    gap: 0.5rem;
  }

  .hint-text {
    font-size: 0.75rem;
  }

  .garden-final {
    padding: 1.5rem 1rem;
    max-width: 95%;
  }

  .final-text {
    font-size: 1.1rem;
    line-height: 1.6;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
