/**
 * Audio-Reactive Visual Art
 * Beautiful 3D visuals that respond to music in real-time
 * DJ-quality visuals with pink/black aesthetic and interactive color control
 */

import * as THREE from 'three';
import gsap from 'gsap';

export class AudioVisualizer {
  constructor(musicSystem) {
    this.music = musicSystem;
    this.element = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particleSystems = [];
    this.analyser = null;
    this.audioContext = null;
    this.dataArray = null;
    this.isActive = false;
    this.animationId = null;
    this.time = 0;

    // Color palette management
    this.colorPalettes = [
      { name: 'Pink Dream', primary: 0xff6b9d, secondary: 0xffb6c1, accent: 0xffd1dc },
      { name: 'Neon Pink', primary: 0xff1493, secondary: 0xff69b4, accent: 0xffc0cb },
      { name: 'Rose Gold', primary: 0xb76e79, secondary: 0xe0a96d, accent: 0xff9a8b },
      { name: 'Magenta Fire', primary: 0xff00ff, secondary: 0xff1493, accent: 0xff69b4 },
      { name: 'Sunset Pink', primary: 0xff6b6b, secondary: 0xffb3ba, accent: 0xffdfba }
    ];
    this.currentPaletteIndex = 0;

    // Mouse interaction
    this.mouse = new THREE.Vector2();
    this.mouseInfluence = new THREE.Vector3();
  }

  /**
   * Show the visualizer
   */
  show() {
    this.element = this.createElement();
    document.body.appendChild(this.element);

    // Initialize THREE.js scene
    this.initScene();

    // Initialize audio analyzer
    this.initAudioAnalyzer();

    // Add interaction
    this.addInteraction();

    // Start animation
    this.isActive = true;
    this.animate();

    // Fade in
    gsap.fromTo(this.element,
      { opacity: 0 },
      { opacity: 1, duration: 1.5, ease: 'power2.out' }
    );
  }

  /**
   * Create HTML element
   */
  createElement() {
    const visualizer = document.createElement('div');
    visualizer.className = 'audio-visualizer';
    visualizer.innerHTML = `
      <div class="visualizer-canvas-container"></div>

      <div class="visualizer-info">
        <div class="visualizer-title">Visual Experience</div>
        <div class="visualizer-hint">Click & drag to interact • Tap to change colors</div>
      </div>

      <div class="visualizer-palette-name">${this.colorPalettes[0].name}</div>

      <button class="visualizer-exit" title="Exit">✕</button>

      <style>
        .audio-visualizer {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          z-index: 9998;
          background: #000000;
          overflow: hidden;
          cursor: grab;
        }

        .audio-visualizer:active {
          cursor: grabbing;
        }

        .visualizer-canvas-container {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .visualizer-canvas-container canvas {
          display: block;
          width: 100%;
          height: 100%;
        }

        .visualizer-info {
          position: fixed;
          top: 2rem;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          z-index: 10;
          pointer-events: none;
        }

        .visualizer-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.5rem;
          font-weight: 300;
          font-style: italic;
          color: #ff6b9d;
          margin-bottom: 0.5rem;
          text-shadow: 0 0 30px rgba(255, 107, 157, 0.8),
                       0 0 60px rgba(255, 107, 157, 0.5);
        }

        .visualizer-hint {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem;
          color: rgba(255, 182, 193, 0.8);
          font-style: italic;
        }

        .visualizer-palette-name {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          color: #ff6b9d;
          text-transform: uppercase;
          letter-spacing: 2px;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: 10;
        }

        .visualizer-palette-name.show {
          opacity: 1;
        }

        .visualizer-exit {
          position: fixed;
          top: 2rem;
          right: 2rem;
          width: 50px;
          height: 50px;
          background: rgba(255, 107, 157, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 107, 157, 0.5);
          border-radius: 50%;
          color: #ff6b9d;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.3s ease;
        }

        .visualizer-exit:hover {
          background: rgba(255, 107, 157, 0.4);
          border-color: #ff6b9d;
          transform: scale(1.1) rotate(90deg);
          box-shadow: 0 0 20px rgba(255, 107, 157, 0.6);
        }

        @media (max-width: 768px) {
          .visualizer-title {
            font-size: 2rem;
          }

          .visualizer-hint {
            font-size: 0.85rem;
          }

          .visualizer-exit {
            top: 1rem;
            right: 1rem;
            width: 44px;
            height: 44px;
          }
        }
      </style>
    `;

    // Add exit listener
    const exitBtn = visualizer.querySelector('.visualizer-exit');
    exitBtn.addEventListener('click', () => this.hide());

    return visualizer;
  }

  /**
   * Initialize THREE.js scene
   */
  initScene() {
    const container = this.element.querySelector('.visualizer-canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.FogExp2(0x000000, 0.01);

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 60;

    // Renderer with bloom effect
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Create visual elements
    this.createParticleCloud();
    this.createParticleWaves();
    this.createCentralOrb();

    // Dynamic lights
    const palette = this.colorPalettes[this.currentPaletteIndex];
    this.light1 = new THREE.PointLight(palette.primary, 2, 100);
    this.light1.position.set(30, 30, 30);
    this.scene.add(this.light1);

    this.light2 = new THREE.PointLight(palette.secondary, 2, 100);
    this.light2.position.set(-30, -30, 30);
    this.scene.add(this.light2);

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Create main particle cloud
   */
  createParticleCloud() {
    const particleCount = 5000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      const radius = 30 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const palette = this.colorPalettes[this.currentPaletteIndex];
    const material = new THREE.PointsMaterial({
      size: 1.5,
      color: palette.primary,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    this.particleSystems.push({
      mesh: particles,
      type: 'cloud',
      velocities,
      originalPositions: positions.slice()
    });
  }

  /**
   * Create wave particles
   */
  createParticleWaves() {
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const angle = (i / particleCount) * Math.PI * 4;
      const radius = 20 + (i % 5) * 8;

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = (Math.random() - 0.5) * 10;
      positions[i3 + 2] = Math.sin(angle) * radius;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const palette = this.colorPalettes[this.currentPaletteIndex];
    const material = new THREE.PointsMaterial({
      size: 2,
      color: palette.secondary,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    this.particleSystems.push({ mesh: particles, type: 'wave', originalPositions: positions.slice() });
  }

  /**
   * Create central orb
   */
  createCentralOrb() {
    const palette = this.colorPalettes[this.currentPaletteIndex];
    const geometry = new THREE.IcosahedronGeometry(10, 4);
    const material = new THREE.MeshPhongMaterial({
      color: palette.primary,
      emissive: palette.secondary,
      emissiveIntensity: 0.5,
      shininess: 100,
      transparent: true,
      opacity: 0.3,
      wireframe: true
    });

    this.orb = new THREE.Mesh(geometry, material);
    this.scene.add(this.orb);
  }

  /**
   * Add mouse/touch interaction
   */
  addInteraction() {
    const canvas = this.renderer.domElement;

    // Mouse move for particle influence
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.mouseInfluence.x = this.mouse.x * 20;
      this.mouseInfluence.y = this.mouse.y * 20;
    });

    // Click to cycle color palettes
    canvas.addEventListener('click', () => {
      this.cyclePalette();
    });

    // Touch support
    canvas.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

      this.mouseInfluence.x = this.mouse.x * 20;
      this.mouseInfluence.y = this.mouse.y * 20;
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      this.cyclePalette();
    }, { passive: true });
  }

  /**
   * Cycle through color palettes
   */
  cyclePalette() {
    this.currentPaletteIndex = (this.currentPaletteIndex + 1) % this.colorPalettes.length;
    const palette = this.colorPalettes[this.currentPaletteIndex];

    // Update palette name display
    const paletteName = this.element.querySelector('.visualizer-palette-name');
    paletteName.textContent = palette.name;
    paletteName.classList.add('show');
    setTimeout(() => paletteName.classList.remove('show'), 2000);

    // Animate color transitions
    this.particleSystems.forEach(system => {
      if (system.type === 'cloud') {
        gsap.to(system.mesh.material.color, {
          r: ((palette.primary >> 16) & 255) / 255,
          g: ((palette.primary >> 8) & 255) / 255,
          b: (palette.primary & 255) / 255,
          duration: 1,
          ease: 'power2.inOut'
        });
      } else if (system.type === 'wave') {
        gsap.to(system.mesh.material.color, {
          r: ((palette.secondary >> 16) & 255) / 255,
          g: ((palette.secondary >> 8) & 255) / 255,
          b: (palette.secondary & 255) / 255,
          duration: 1,
          ease: 'power2.inOut'
        });
      }
    });

    // Update orb
    if (this.orb) {
      gsap.to(this.orb.material.color, {
        r: ((palette.primary >> 16) & 255) / 255,
        g: ((palette.primary >> 8) & 255) / 255,
        b: (palette.primary & 255) / 255,
        duration: 1,
        ease: 'power2.inOut'
      });
      gsap.to(this.orb.material.emissive, {
        r: ((palette.secondary >> 16) & 255) / 255,
        g: ((palette.secondary >> 8) & 255) / 255,
        b: (palette.secondary & 255) / 255,
        duration: 1,
        ease: 'power2.inOut'
      });
    }

    // Update lights
    if (this.light1) {
      gsap.to(this.light1.color, {
        r: ((palette.primary >> 16) & 255) / 255,
        g: ((palette.primary >> 8) & 255) / 255,
        b: (palette.primary & 255) / 255,
        duration: 1,
        ease: 'power2.inOut'
      });
    }
    if (this.light2) {
      gsap.to(this.light2.color, {
        r: ((palette.secondary >> 16) & 255) / 255,
        g: ((palette.secondary >> 8) & 255) / 255,
        b: (palette.secondary & 255) / 255,
        duration: 1,
        ease: 'power2.inOut'
      });
    }
  }

  /**
   * Initialize audio analyzer
   */
  initAudioAnalyzer() {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audio = this.music.audio;
      if (!audio) return;

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      if (!this.music.audioSource) {
        this.music.audioSource = this.audioContext.createMediaElementSource(audio);
      }

      this.music.audioSource.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

    } catch (error) {
      console.warn('Could not initialize audio analyzer:', error);
    }
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.isActive || !this.renderer) return;

    this.animationId = requestAnimationFrame(() => this.animate());
    this.time += 0.01;

    // Get audio data
    let bassIntensity = 0;
    let midIntensity = 0;
    let trebleIntensity = 0;

    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);

      const third = Math.floor(this.dataArray.length / 3);
      bassIntensity = this.getAverageIntensity(this.dataArray, 0, third);
      midIntensity = this.getAverageIntensity(this.dataArray, third, third * 2);
      trebleIntensity = this.getAverageIntensity(this.dataArray, third * 2, this.dataArray.length);
    }

    // Update particle systems
    this.particleSystems.forEach(system => {
      const positions = system.mesh.geometry.attributes.position.array;

      if (system.type === 'cloud') {
        // Floating with audio influence and mouse attraction
        for (let i = 0; i < positions.length; i += 3) {
          const orig = system.originalPositions;

          // Audio influence
          positions[i] += system.velocities[i] * (1 + bassIntensity);
          positions[i + 1] += system.velocities[i + 1] * (1 + midIntensity);
          positions[i + 2] += system.velocities[i + 2] * (1 + trebleIntensity);

          // Mouse influence
          const dx = this.mouseInfluence.x - positions[i];
          const dy = this.mouseInfluence.y - positions[i + 1];
          positions[i] += dx * 0.02;
          positions[i + 1] += dy * 0.02;

          // Gentle pull back to original position
          positions[i] += (orig[i] - positions[i]) * 0.01;
          positions[i + 1] += (orig[i + 1] - positions[i + 1]) * 0.01;
          positions[i + 2] += (orig[i + 2] - positions[i + 2]) * 0.01;
        }

        system.mesh.rotation.y += 0.0002 + trebleIntensity * 0.0005;
        system.mesh.material.size = 1.5 + bassIntensity * 2;

      } else if (system.type === 'wave') {
        // Orbiting with bass pulse
        system.mesh.rotation.y += 0.01 + midIntensity * 0.02;
        system.mesh.rotation.x = Math.sin(this.time) * 0.3 + bassIntensity * 0.5;
        system.mesh.material.size = 2 + bassIntensity * 3;
      }

      system.mesh.geometry.attributes.position.needsUpdate = true;
    });

    // Update central orb
    if (this.orb) {
      const scale = 1 + bassIntensity * 0.5 + midIntensity * 0.3;
      this.orb.scale.set(scale, scale, scale);
      this.orb.rotation.y += 0.005 + trebleIntensity * 0.01;
      this.orb.rotation.x += 0.003;
      this.orb.material.emissiveIntensity = 0.5 + bassIntensity * 0.8;
    }

    // Dynamic camera movement
    this.camera.position.x = Math.sin(this.time * 0.3) * 10 + this.mouseInfluence.x * 0.5;
    this.camera.position.y = Math.cos(this.time * 0.2) * 10 + this.mouseInfluence.y * 0.5;
    this.camera.lookAt(0, 0, 0);

    // Dynamic lights
    if (this.light1) {
      this.light1.intensity = 2 + bassIntensity * 2;
      this.light1.position.x = Math.cos(this.time) * 30;
      this.light1.position.y = Math.sin(this.time * 0.5) * 30;
    }
    if (this.light2) {
      this.light2.intensity = 2 + midIntensity * 2;
      this.light2.position.x = Math.sin(this.time * 0.7) * 30;
      this.light2.position.y = Math.cos(this.time) * 30;
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Get average intensity for frequency range
   */
  getAverageIntensity(dataArray, start, end) {
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += dataArray[i];
    }
    return (sum / (end - start)) / 255;
  }

  /**
   * Handle window resize
   */
  onResize() {
    if (!this.renderer || !this.camera) return;

    const container = this.element.querySelector('.visualizer-canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Hide the visualizer
   */
  hide() {
    this.isActive = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    gsap.to(this.element, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.in',
      onComplete: () => {
        if (this.element && this.element.parentNode) {
          this.element.remove();
        }

        // Cleanup THREE.js
        if (this.renderer) {
          this.renderer.dispose();
          this.scene.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (obj.material.map) obj.material.map.dispose();
              obj.material.dispose();
            }
          });
        }

        this.element = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
      }
    });
  }
}
