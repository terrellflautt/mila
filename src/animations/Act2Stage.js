/**
 * Act II: "The Becoming" - Enhanced Stage Implementation
 * Three.js + GSAP + WebAudio choreography
 * Integrates with existing Mila's World architecture
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { getCurrentPalette } from '../config/colors.js';
import { getProgress, updateProgress } from '../utils/storage.js';
import { submitAnswer } from '../utils/api.js';
import { TheChoreographer } from '../puzzles/TheChoreographer.js';
import { TheGallery } from '../puzzles/TheGallery.js';
import { TheDialogue } from '../puzzles/TheDialogue.js';

export class Act2Stage {
  constructor(container, options = {}) {
    this.container = container;
    this.visitorId = options.visitorId;
    this.seed = options.seed;

    // Three.js components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Lighting
    this.lights = {};

    // Particles and effects
    this.particles = null;
    this.silhouette = null;
    this.trailSystem = null;

    // Audio
    this.audioContext = null;
    this.audioNodes = {};

    // Puzzle modules
    this.choreographer = null;
    this.gallery = null;
    this.dialogue = null;
    this.currentPuzzleIndex = 0;
    this.puzzleOrder = [];

    // State
    this.isMobile = /Mobi|Android/i.test(navigator.userAgent);
    this.isRunning = false;
    this.pointer = { x: 0, y: 0, nx: 0, ny: 0, down: false };

    // Get color palette
    this.palette = getCurrentPalette('act2', this.seed);
  }

  /**
   * Initialize Act II
   */
  async init() {
    this.setupScene();
    this.setupLighting();
    this.setupParticles();
    this.setupSilhouette();
    this.setupAudio();
    this.setupInteraction();
    this.setupUI();

    // Create puzzle modules
    this.choreographer = this.createChoreographerPuzzle();
    this.gallery = this.createGalleryPuzzle();
    this.dialogue = this.createDialoguePuzzle();

    this.puzzleOrder = [this.choreographer, this.gallery, this.dialogue];

    // Set up completion callbacks
    this.puzzleOrder.forEach(puzzle => {
      puzzle.onComplete((result) => this.handlePuzzleComplete(result));
    });

    // Start animation loop
    this.isRunning = true;
    this.animate();

    // Start Act II
    this.startAct();
  }

  /**
   * Setup Three.js scene
   */
  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0f0722, 0.02);
    this.scene.background = new THREE.Color(0x0a0515);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 1.6, 5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: this.isMobile ? 'low-power' : 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Controls (subtle)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minPolarAngle = 0.7;
    this.controls.maxPolarAngle = 2.0;
    this.controls.autoRotate = false;

    // Floor
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x06030a,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.9;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Handle resize
    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Setup lighting
   */
  setupLighting() {
    // Hemisphere light
    const hemi = new THREE.HemisphereLight(0xffffee, 0x222233, 0.3);
    this.scene.add(hemi);
    this.lights.hemisphere = hemi;

    // Key light (animated golden accent)
    const key = new THREE.PointLight(0xffcc77, 1.5, 15, 2);
    key.position.set(0, 3, 2);
    key.castShadow = true;
    this.scene.add(key);
    this.lights.key = key;

    // Rim light (indigo)
    const rim = new THREE.PointLight(0x7b3f9e, 0.8, 12, 2);
    rim.position.set(-3, 2, -2);
    this.scene.add(rim);
    this.lights.rim = rim;

    // Spotlight for dramatic moments
    const spot = new THREE.SpotLight(0xffd6a6, 0, 20);
    spot.position.set(0, 8, 0);
    spot.angle = Math.PI / 6;
    spot.penumbra = 0.5;
    spot.castShadow = true;
    this.scene.add(spot);
    this.lights.spotlight = spot;
  }

  /**
   * Setup particle system
   */
  setupParticles() {
    const particleCount = this.isMobile ? 220 : 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 4 - 0.6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

      velocities.push({
        x: (Math.random() - 0.5) * 0.02,
        y: Math.random() * 0.01,
        z: (Math.random() - 0.5) * 0.02
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: this.isMobile ? 0.03 : 0.06,
      color: 0xffcc77,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.particles.userData.velocities = velocities;
    this.scene.add(this.particles);

    // Start with particles invisible
    this.particles.material.opacity = 0;
  }

  /**
   * Setup silhouette dancer
   */
  setupSilhouette() {
    const geometry = new THREE.PlaneGeometry(1.2, 2.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffb6c1,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    this.silhouette = new THREE.Mesh(geometry, material);
    this.silhouette.position.set(0, 0.6, -0.5);
    this.scene.add(this.silhouette);
  }

  /**
   * Setup Web Audio
   */
  setupAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();

    const masterGain = this.audioContext.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(this.audioContext.destination);

    this.audioNodes.masterGain = masterGain;

    // Synthesized chord progressions
    this.audioNodes.chords = ['C4', 'E4', 'G4', 'B4', 'D5', 'F#5'];
  }

  /**
   * Play a musical note
   */
  playNote(frequency, duration = 0.8, gain = 0.3) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioNodes.masterGain);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  /**
   * Setup interaction
   */
  setupInteraction() {
    const updatePointer = (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;

      this.pointer.x = (clientX - rect.left) / rect.width;
      this.pointer.y = (clientY - rect.top) / rect.height;
      this.pointer.nx = (this.pointer.x - 0.5) * 2;
      this.pointer.ny = -(this.pointer.y - 0.5) * 2;
    };

    this.renderer.domElement.addEventListener('pointermove', updatePointer);
    this.renderer.domElement.addEventListener('touchmove', updatePointer);
    this.renderer.domElement.addEventListener('pointerdown', (e) => {
      this.pointer.down = true;
      updatePointer(e);
    });
    window.addEventListener('pointerup', () => {
      this.pointer.down = false;
    });
  }

  /**
   * Setup UI overlay
   */
  setupUI() {
    const ui = document.createElement('div');
    ui.className = 'act2-ui-overlay';
    ui.innerHTML = `
      <div class="act2-title">Act II — The Becoming</div>
      <div class="act2-subtitle">Connection, Recognition, and Rhythm</div>
    `;
    this.container.appendChild(ui);

    // Fade in title
    gsap.fromTo('.act2-title',
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 1.5,
        delay: 0.5,
        ease: 'power2.out'
      }
    );

    gsap.fromTo('.act2-subtitle',
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 1.5,
        delay: 0.8,
        ease: 'power2.out',
        onComplete: () => {
          // Fade out after 3 seconds
          setTimeout(() => {
            gsap.to('.act2-ui-overlay', {
              opacity: 0,
              duration: 1,
              onComplete: () => {
                ui.remove();
              }
            });
          }, 3000);
        }
      }
    );
  }

  /**
   * Start Act II
   */
  async startAct() {
    // Resume audio context
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume().catch(() => {});
    }

    // Cinematic entrance
    gsap.fromTo(this.camera.position,
      { z: 7 },
      {
        z: 5,
        duration: 2.5,
        ease: 'power2.out'
      }
    );

    // Fade in particles
    gsap.to(this.particles.material, {
      opacity: 0.85,
      duration: 2,
      delay: 1
    });

    // Pulse key light
    gsap.to(this.lights.key, {
      intensity: 2,
      duration: 1.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    // Wait for entrance, then start first puzzle
    setTimeout(() => {
      this.startPuzzle(0);
    }, 3500);
  }

  /**
   * Start a specific puzzle
   */
  startPuzzle(index) {
    if (index >= this.puzzleOrder.length) {
      this.completeAct();
      return;
    }

    this.currentPuzzleIndex = index;
    const puzzle = this.puzzleOrder[index];
    puzzle.start();

    // Play note
    this.playNote(523.25, 1, 0.2);
  }

  /**
   * Handle puzzle completion
   */
  async handlePuzzleComplete(result) {
    console.log('Puzzle completed:', result);

    // Light celebration
    gsap.to(this.lights.spotlight, {
      intensity: 3,
      duration: 0.3,
      yoyo: true,
      repeat: 1
    });

    // Save progress
    updateProgress({
      [`act2_${result.puzzleId}_completed`]: true
    });

    // Wait a moment
    await this.wait(1500);

    // Start next puzzle
    this.startPuzzle(this.currentPuzzleIndex + 1);
  }

  /**
   * Complete Act II
   */
  completeAct() {
    // Final celebration
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ffcc77', '#7b3f9e', '#ffd6a6']
    });

    // Show completion message
    const completion = document.createElement('div');
    completion.className = 'act2-completion';
    completion.innerHTML = `
      <div class="completion-title">Act II Complete</div>
      <div class="completion-subtitle">You're becoming...</div>
    `;
    this.container.appendChild(completion);

    gsap.fromTo(completion,
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: 'back.out(1.4)'
      }
    );
  }

  /**
   * Create puzzle modules
   */
  createChoreographerPuzzle() {
    return new TheChoreographer(this, this.handlePuzzleComplete.bind(this));
  }

  createGalleryPuzzle() {
    return new TheGallery(this, this.handlePuzzleComplete.bind(this));
  }

  createDialoguePuzzle() {
    return new TheDialogue(this, this.handlePuzzleComplete.bind(this));
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.animate());

    // Update controls
    this.controls.update();

    // Update particles
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const velocities = this.particles.userData.velocities;

      for (let i = 0; i < velocities.length; i++) {
        const vel = velocities[i];
        positions[i * 3] += vel.x;
        positions[i * 3 + 1] += vel.y;
        positions[i * 3 + 2] += vel.z;

        // Boundary check
        if (Math.abs(positions[i * 3]) > 6) vel.x *= -1;
        if (positions[i * 3 + 1] > 4 || positions[i * 3 + 1] < -1) vel.y *= -1;
        if (Math.abs(positions[i * 3 + 2]) > 3) vel.z *= -1;
      }

      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize
   */
  onResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  /**
   * Utility wait function
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup
   */
  destroy() {
    this.isRunning = false;

    if (this.audioContext) {
      this.audioContext.close();
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }

    this.scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}

// Styles
const styles = `
.act2-ui-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  z-index: 100;
}

.act2-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3.5rem;
  font-weight: 400;
  color: #ffd6a6;
  margin-bottom: 1rem;
  text-shadow: 0 4px 20px rgba(255, 214, 166, 0.6);
}

.act2-subtitle {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 300;
  font-style: italic;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
}

.act2-completion {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  padding: 3rem;
  background: rgba(15, 7, 34, 0.95);
  border-radius: 20px;
  border: 2px solid rgba(255, 204, 119, 0.3);
  z-index: 200;
}

.completion-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3rem;
  font-weight: 400;
  color: #ffd6a6;
  margin-bottom: 1rem;
}

.completion-subtitle {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.5rem;
  font-weight: 300;
  font-style: italic;
  color: rgba(255, 255, 255, 0.85);
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
