/**
 * Act III - Puzzle 1: "Constellation You"
 * An interactive night sky where she connects stars to form constellations
 * Each constellation reveals how separate points create meaning together
 */

import * as THREE from 'three';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';

export class ConstellationYou {
  constructor(onComplete, musicSystem = null) {
    this.onComplete = onComplete;
    this.musicSystem = musicSystem;
    this.element = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.stars = [];
    this.selectedStars = [];
    this.lines = [];
    this.guideLines = [];
    this.currentConstellation = null;
    this.currentStarData = []; // Store star data for current constellation
    this.correctTaps = 0; // Count correct taps for auto-complete
    this.discoveredConstellations = this.loadProgress();
    this.isComplete = false;
    this.isAnimating = true;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.audioContext = null;
    this.shootingStars = [];
    this.requiredTaps = 3; // Need 3 correct taps to trigger auto-complete

    // Music reactivity
    this.audioAnalyser = null;
    this.audioDataArray = null;
    this.bassIntensity = 0;
    this.midIntensity = 0;
    this.trebleIntensity = 0;
    this.backgroundStars = []; // Track background stars separately for music reactivity

    // Beat detection
    this.beatThreshold = 0.6; // Minimum intensity to register as beat
    this.beatCooldown = 0.3; // Seconds between beats
    this.lastBeatTime = 0;
    this.isBeat = false;
    this.beatHistory = []; // Track recent bass values for beat detection
    this.beatHistorySize = 10;

    // Post-processing for realistic effects
    this.composer = null;
    this.bloomPass = null;
    this.filmPass = null;

    // Nebula clouds
    this.nebulaClouds = [];

    // Constellation line particles
    this.lineParticles = [];
  }

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    try {
      const saved = localStorage.getItem('constellation_progress');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    try {
      localStorage.setItem('constellation_progress', JSON.stringify(this.discoveredConstellations));
    } catch (e) {
      console.warn('Could not save progress');
    }
  }

  /**
   * Show the puzzle
   */
  show() {
    this.element = this.createPuzzleElement();
    document.body.appendChild(this.element);

    // Initialize Three.js scene
    this.initScene();

    // Create starfield (this now picks ONE random constellation and creates its stars)
    this.createStarfield();

    // Show subtle hints for the constellation
    if (this.currentConstellation) {
      this.showConstellationHints();
    }

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
          <div class="puzzle-subtitle">Find the patterns in the sky</div>
        </div>

        <div class="constellation-canvas-container">
          <!-- Three.js canvas will be inserted here -->
        </div>

        <div class="constellation-progress">
          <div class="progress-text">${this.discoveredConstellations.length} of ${this.getAllConstellations().length} constellations discovered</div>
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
   * Initialize Three.js scene with realistic night sky
   */
  initScene() {
    const container = this.element.querySelector('.constellation-canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene with realistic night sky background
    this.scene = new THREE.Scene();

    // Create realistic gradient background canvas
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 4;
    bgCanvas.height = 512;
    const bgContext = bgCanvas.getContext('2d');

    // Realistic night sky gradient: dark blue at horizon to deep black at zenith
    const gradient = bgContext.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#000814');    // Deep space black at top
    gradient.addColorStop(0.3, '#001233'); // Dark blue
    gradient.addColorStop(0.6, '#001845'); // Navy blue
    gradient.addColorStop(0.85, '#0a1929'); // Lighter blue near horizon
    gradient.addColorStop(1, '#0d1b2a');    // Horizon glow

    bgContext.fillStyle = gradient;
    bgContext.fillRect(0, 0, 4, 512);

    // Add subtle noise for depth
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * 4;
      const y = Math.random() * 512;
      const opacity = Math.random() * 0.15;
      bgContext.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      bgContext.fillRect(x, y, 1, 1);
    }

    const bgTexture = new THREE.CanvasTexture(bgCanvas);
    this.scene.background = bgTexture;

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.z = 50;

    // Renderer with realistic settings
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    // Post-processing for realistic bloom and atmosphere
    this.composer = new EffectComposer(this.renderer);

    // Render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Unreal Bloom for natural star glow
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.7,    // Strength - subtle glow (reduced from 1.2)
      0.4,    // Radius - tighter glow spread
      0.3     // Threshold - only brightest objects bloom
    );
    this.composer.addPass(this.bloomPass);

    // Film grain for cinematic atmosphere
    this.filmPass = new FilmPass(
      0.15,   // Noise intensity
      0.0,    // Scanline intensity (0 = no scanlines)
      0,      // Scanline count
      false   // Grayscale
    );
    this.composer.addPass(this.filmPass);

    // Add subtle nebula clouds for depth
    this.createNebulaClouds();

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Create realistic starfield with spectral colors and varied magnitudes
   */
  createStarfield() {
    // Create realistic background stars with spectral diversity
    const bgStarCount = 300;
    const spectralColors = [
      { color: 0x9BB0FF, weight: 0.005 },  // O-type (blue) - rarest
      { color: 0xAABFFF, weight: 0.005 },  // B-type (blue-white)
      { color: 0xCAD7FF, weight: 0.02 },   // A-type (white)
      { color: 0xF8F7FF, weight: 0.03 },   // F-type (yellow-white)
      { color: 0xFFF4EA, weight: 0.06 },   // G-type (yellow) like our Sun
      { color: 0xFFD2A1, weight: 0.12 },   // K-type (orange)
      { color: 0xFFCC6F, weight: 0.76 }    // M-type (red-orange) - most common
    ];

    // Create individual star sprites with varied colors and sizes
    for (let i = 0; i < bgStarCount; i++) {
      // Select spectral type based on realistic distribution
      const rand = Math.random();
      let cumulativeWeight = 0;
      let starColor = 0xFFFFFF;

      for (const type of spectralColors) {
        cumulativeWeight += type.weight;
        if (rand <= cumulativeWeight) {
          starColor = type.color;
          break;
        }
      }

      // Create star sprite with glow
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');

      // Realistic star glow with spectral color
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      const colorObj = new THREE.Color(starColor);
      const r = Math.floor(colorObj.r * 255);
      const g = Math.floor(colorObj.g * 255);
      const b = Math.floor(colorObj.b * 255);

      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
      gradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, 0.8)`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.3)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.3 + Math.random() * 0.5,
        blending: THREE.AdditiveBlending
      });

      const star = new THREE.Sprite(material);

      // Vary size based on "magnitude" (brightness)
      const magnitude = 4 + Math.random() * 2; // Magnitude 4-6
      const size = Math.pow(2, -(magnitude / 2)) * 0.5 + 0.2;
      star.scale.set(size, size, 1);

      // Position in 3D space for depth
      star.position.set(
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 50 - 20
      );

      // Realistic twinkle animation
      gsap.to(material, {
        opacity: (0.2 + Math.random() * 0.4),
        duration: 0.5 + Math.random() * 2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: Math.random() * 3
      });

      // Subtle size variation for atmospheric shimmer
      gsap.to(star.scale, {
        x: size * (1 + (Math.random() - 0.5) * 0.1),
        y: size * (1 + (Math.random() - 0.5) * 0.1),
        duration: 1 + Math.random() * 2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });

      this.scene.add(star);

      // Track for music reactivity
      this.backgroundStars.push({
        sprite: star,
        material: material,
        baseOpacity: material.opacity,
        baseSize: size
      });
    }

    // Pick a random undiscovered constellation
    this.currentConstellation = this.pickRandomConstellation();

    if (!this.currentConstellation) {
      // All discovered! Show completion
      this.showAllDiscoveredMessage();
      return;
    }

    // Get star data for this specific constellation
    const constellationStarData = this.getStarDataForConstellation(this.currentConstellation.id);
    this.currentStarData = constellationStarData; // Store for validation later

    // Create stars for this constellation only - realistic white points
    constellationStarData.forEach((data, index) => {
      // Create enhanced star texture with diffraction spikes for bright stars
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      const centerX = 64;
      const centerY = 64;

      // Add diffraction spikes for magnitude 1 (brightest) stars
      if (data.mag === 1) {
        ctx.save();
        ctx.translate(centerX, centerY);

        // Create 4 bright diffraction spikes
        for (let spike = 0; spike < 4; spike++) {
          ctx.rotate(Math.PI / 4);

          // Vertical spike
          const spikeGradient = ctx.createLinearGradient(0, -50, 0, 50);
          spikeGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
          spikeGradient.addColorStop(0.4, 'rgba(255, 250, 245, 0.4)');
          spikeGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
          spikeGradient.addColorStop(0.6, 'rgba(255, 250, 245, 0.4)');
          spikeGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = spikeGradient;
          ctx.fillRect(-1, -50, 2, 100);

          // Horizontal spike (fainter)
          const hSpikeGradient = ctx.createLinearGradient(-50, 0, 50, 0);
          hSpikeGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
          hSpikeGradient.addColorStop(0.4, 'rgba(255, 250, 245, 0.3)');
          hSpikeGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
          hSpikeGradient.addColorStop(0.6, 'rgba(255, 250, 245, 0.3)');
          hSpikeGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = hSpikeGradient;
          ctx.fillRect(-50, -1, 100, 2);
        }

        ctx.restore();
      }

      // Create radial gradient for realistic star glow (on top of spikes)
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.15, 'rgba(255, 250, 245, 0.95)');
      gradient.addColorStop(0.3, 'rgba(255, 248, 240, 0.7)');
      gradient.addColorStop(0.5, 'rgba(255, 245, 230, 0.4)');
      gradient.addColorStop(0.7, 'rgba(255, 240, 220, 0.15)');
      gradient.addColorStop(1, 'rgba(255, 240, 220, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 128, 128);

      const texture = new THREE.CanvasTexture(canvas);

      // Use sprite for realistic star appearance
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending // Makes stars glow naturally
      });

      const star = new THREE.Sprite(material);

      // Larger, more visible stars
      const baseSize = data.mag === 1 ? 1.0 : 0.8;
      star.scale.set(baseSize, baseSize, 1);

      star.position.set(data.x, data.y, data.z);
      star.userData = {
        index,
        selected: false,
        magnitude: data.mag,
        order: data.order,
        baseMaterial: material,
        baseSize: baseSize
      };

      // Subtle twinkle - keep stars bright
      gsap.to(material, {
        opacity: 0.9 + Math.random() * 0.1,
        duration: 0.5 + Math.random() * 1.5,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: Math.random() * 2
      });

      // Subtle scale pulse for depth
      gsap.to(star.scale, {
        x: baseSize * 1.1,
        y: baseSize * 1.1,
        duration: 1 + Math.random() * 2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: Math.random()
      });

      this.stars.push(star);
      this.scene.add(star);
    });
  }

  /**
   * Get all constellation definitions
   */
  getAllConstellations() {
    return [
      {
        id: 'heart',
        name: 'The Heart',
        message: 'Among infinite stars,\nI only see you.',
        symbol: '♥',
        color: 0xff88bb,
        hint: 'Find the pattern that beats eternal'
      },
      {
        id: 'letterM',
        name: 'Letter M',
        message: 'Your name,\nwritten in the sky.',
        letter: 'M',
        color: 0x6699ff,
        hint: 'Her initial, etched in light'
      },
      {
        id: 'letterT',
        name: 'Letter T',
        message: 'Two letters.\nOne story.',
        letter: 'T',
        color: 0xff9966,
        hint: 'His mark upon the heavens'
      },
      {
        id: 'flamingo',
        name: 'The Flamingo',
        message: 'Grace and balance,\njust like you.',
        symbol: '🦩',
        color: 0xff6b9d,
        hint: 'A creature of elegance takes flight'
      },
      {
        id: 'theaterMasks',
        name: 'Theater Masks',
        message: 'Every scene of life,\nshared with you.',
        symbol: '🎭',
        color: 0xdaa520,
        hint: 'Two faces, countless emotions'
      },
      {
        id: 'ballerina',
        name: 'The Dancer',
        message: 'You move,\nthe universe follows.',
        symbol: '🩰',
        color: 0xffb6c1,
        hint: 'She moves and the stars follow'
      },
      {
        id: 'infinity',
        name: 'Infinity',
        message: 'Some things don\'t have endings.\nThis is one of them.',
        symbol: '∞',
        color: 0xccaaff,
        hint: 'The loop that never breaks'
      }
    ];
  }

  /**
   * Pick a random undiscovered constellation
   */
  pickRandomConstellation() {
    const all = this.getAllConstellations();
    const undiscovered = all.filter(c => !this.discoveredConstellations.includes(c.id));

    if (undiscovered.length === 0) {
      // All discovered! Show completion
      return null;
    }

    return undiscovered[Math.floor(Math.random() * undiscovered.length)];
  }

  /**
   * Get star position data for a specific constellation
   */
  getStarDataForConstellation(constellationId) {
    const starDatabase = {
      heart: [
        { x: -3, y: 2, z: 0, size: 0.3, color: 0xff88bb, mag: 1, order: 1 },
        { x: 3, y: 2, z: 0, size: 0.3, color: 0xff88bb, mag: 1, order: 2 },
        { x: 4, y: -1, z: 0, size: 0.25, color: 0xffaacc, mag: 2, order: 3 },
        { x: 0, y: -4, z: 0, size: 0.35, color: 0xff6699, mag: 1, order: 4 },
        { x: -4, y: -1, z: 0, size: 0.25, color: 0xffaacc, mag: 2, order: 5 }
      ],
      letterM: [
        { x: -4, y: -2, z: 0, size: 0.3, color: 0x88bbff, mag: 1, order: 1 },
        { x: -4, y: 2, z: 0, size: 0.3, color: 0x6699ff, mag: 1, order: 2 },
        { x: 0, y: -1, z: 0, size: 0.35, color: 0x4477ff, mag: 1, order: 3 },
        { x: 4, y: 2, z: 0, size: 0.3, color: 0x6699ff, mag: 1, order: 4 },
        { x: 4, y: -2, z: 0, size: 0.3, color: 0x88bbff, mag: 1, order: 5 }
      ],
      letterT: [
        { x: -4, y: 2, z: 0, size: 0.3, color: 0xff9966, mag: 1, order: 1 },
        { x: -2, y: 2, z: 0, size: 0.25, color: 0xffaa77, mag: 2, order: 2 },
        { x: 0, y: 2, z: 0, size: 0.35, color: 0xff8855, mag: 1, order: 3 },
        { x: 2, y: 2, z: 0, size: 0.25, color: 0xffaa77, mag: 2, order: 4 },
        { x: 4, y: 2, z: 0, size: 0.3, color: 0xff9966, mag: 1, order: 5 },
        { x: 0, y: -2, z: 0, size: 0.3, color: 0xffbb88, mag: 2, order: 6 }
      ],
      flamingo: [
        { x: -3, y: 3, z: 0, size: 0.3, color: 0xff6b9d, mag: 1, order: 1 },  // Head
        { x: -2, y: 2, z: 0, size: 0.25, color: 0xff7aa8, mag: 2, order: 2 },  // Neck curve 1
        { x: -1, y: 0, z: 0, size: 0.3, color: 0xff8bb3, mag: 1, order: 3 },  // Neck curve 2
        { x: 0, y: -1, z: 0, size: 0.35, color: 0xff6b9d, mag: 1, order: 4 },  // Body center
        { x: 2, y: -1, z: 0, size: 0.25, color: 0xff7aa8, mag: 2, order: 5 },  // Body back
        { x: 1, y: -3, z: 0, size: 0.3, color: 0xff8bb3, mag: 2, order: 6 },  // Leg 1
        { x: 3, y: -3, z: 0, size: 0.3, color: 0xff8bb3, mag: 2, order: 7 }   // Leg 2
      ],
      theaterMasks: [
        // Comedy mask (left, smiling) - smile curves upward
        { x: -5, y: 2, z: 0, size: 0.3, color: 0xdaa520, mag: 1, order: 1 },    // Left eye
        { x: -3, y: 2, z: 0, size: 0.3, color: 0xdaa520, mag: 1, order: 2 },    // Right eye
        { x: -5, y: -1, z: 0, size: 0.25, color: 0xc99a1c, mag: 2, order: 3 },  // Smile left edge
        { x: -4, y: -2, z: 0, size: 0.3, color: 0xe5b82e, mag: 1, order: 4 },   // Smile bottom center
        { x: -3, y: -1, z: 0, size: 0.25, color: 0xc99a1c, mag: 2, order: 5 },  // Smile right edge

        // Tragedy mask (right, frowning) - frown curves downward
        { x: 3, y: 2, z: 0, size: 0.3, color: 0xdaa520, mag: 1, order: 6 },     // Left eye
        { x: 5, y: 2, z: 0, size: 0.3, color: 0xdaa520, mag: 1, order: 7 },     // Right eye
        { x: 3, y: 0, z: 0, size: 0.25, color: 0xc99a1c, mag: 2, order: 8 },    // Frown left edge
        { x: 4, y: 1, z: 0, size: 0.3, color: 0xe5b82e, mag: 1, order: 9 },     // Frown top center
        { x: 5, y: 0, z: 0, size: 0.25, color: 0xc99a1c, mag: 2, order: 10 }    // Frown right edge
      ],
      ballerina: [
        { x: 0, y: 3, z: 0, size: 0.3, color: 0xffb6c1, mag: 1, order: 1 },     // Head
        { x: 0, y: 1.5, z: 0, size: 0.25, color: 0xffc7cc, mag: 2, order: 2 },  // Neck
        { x: -2, y: 1, z: 0, size: 0.3, color: 0xffa5b0, mag: 1, order: 3 },    // Left arm extended
        { x: 2, y: 1, z: 0, size: 0.3, color: 0xffa5b0, mag: 1, order: 4 },     // Right arm raised
        { x: 0, y: 0, z: 0, size: 0.35, color: 0xffb6c1, mag: 1, order: 5 },    // Torso center
        { x: -1, y: -1.5, z: 0, size: 0.3, color: 0xffc7cc, mag: 2, order: 6 }, // Left leg planted
        { x: 3, y: 0.5, z: 0, size: 0.3, color: 0xffa5b0, mag: 1, order: 7 },   // Right leg extended (arabesque)
        { x: -1, y: -3, z: 0, size: 0.3, color: 0xffd8dd, mag: 2, order: 8 }    // Left foot
      ],
      infinity: [
        // Left loop (forms circle)
        { x: -3, y: 2, z: 0, size: 0.3, color: 0xccaaff, mag: 1, order: 1 },     // Top of left loop
        { x: -5, y: 0, z: 0, size: 0.25, color: 0xddbbff, mag: 2, order: 2 },    // Left side
        { x: -3, y: -2, z: 0, size: 0.3, color: 0xccaaff, mag: 1, order: 3 },    // Bottom of left loop
        { x: -1, y: 0, z: 0, size: 0.25, color: 0xddbbff, mag: 2, order: 4 },    // Left-center

        // Center crossing point
        { x: 0, y: 0, z: 0, size: 0.35, color: 0xbb99ff, mag: 1, order: 5 },     // CENTER

        // Right loop (forms circle)
        { x: 1, y: 0, z: 0, size: 0.25, color: 0xddbbff, mag: 2, order: 6 },     // Right-center
        { x: 3, y: 2, z: 0, size: 0.3, color: 0xccaaff, mag: 1, order: 7 },      // Top of right loop
        { x: 5, y: 0, z: 0, size: 0.25, color: 0xddbbff, mag: 2, order: 8 },     // Right side
        { x: 3, y: -2, z: 0, size: 0.3, color: 0xccaaff, mag: 1, order: 9 }      // Bottom of right loop
      ]
    };

    return starDatabase[constellationId] || [];
  }

  /**
   * Show message when all constellations discovered
   */
  showAllDiscoveredMessage() {
    const message = document.createElement('div');
    message.className = 'all-discovered-message';
    message.innerHTML = `
      <h2>✨ All Constellations Discovered ✨</h2>
      <p>You've found all the stars in our sky.</p>
      <p>Our story, written in constellations.</p>
    `;
    this.element.appendChild(message);

    setTimeout(() => {
      this.complete();
    }, 4000);
  }

  /**
   * Show subtle hints for the current constellation
   */
  showConstellationHints() {
    if (!this.currentConstellation) return;

    // Make the first star (order: 1) slightly more prominent with gentle pulse
    const firstStar = this.stars.find(s => s.userData.order === 1);
    if (firstStar) {
      gsap.to(firstStar.material, {
        opacity: 1,
        duration: 1.5,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });

      gsap.to(firstStar.scale, {
        x: firstStar.userData.baseSize * 1.3,
        y: firstStar.userData.baseSize * 1.3,
        duration: 1.5,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    }

    // Update hint text at bottom
    const hintTextEl = this.element.querySelector('.hint-text');
    if (hintTextEl) {
      hintTextEl.textContent = this.currentConstellation.hint || `Connect the stars to form: ${this.currentConstellation.name}`;
    }
  }

  /**
   * Initialize audio context
   */
  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Initialize music reactivity if music system is available
      if (this.musicSystem) {
        this.initMusicReactivity();
      }
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  /**
   * Initialize music reactivity - connect to background music analyzer
   */
  initMusicReactivity() {
    if (!this.musicSystem || !this.musicSystem.currentTrack) {
      console.log('Music system not ready for reactivity yet');
      return;
    }

    try {
      // Create analyzer if not exists
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Create analyzer node
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 256;
      this.audioAnalyser.smoothingTimeConstant = 0.8;

      const bufferLength = this.audioAnalyser.frequencyBinCount;
      this.audioDataArray = new Uint8Array(bufferLength);

      // Connect to music system's audio element
      if (!this.musicSystem.audioSource) {
        this.musicSystem.audioSource = this.audioContext.createMediaElementSource(this.musicSystem.currentTrack);
        this.musicSystem.audioSource.connect(this.audioAnalyser);
        this.audioAnalyser.connect(this.audioContext.destination);
      } else {
        // Already connected, just tap into it
        this.musicSystem.audioSource.connect(this.audioAnalyser);
        this.audioAnalyser.connect(this.audioContext.destination);
      }

      console.log('Music reactivity initialized for constellations');
    } catch (error) {
      console.warn('Could not initialize music reactivity:', error);
    }
  }

  /**
   * Update audio intensity values from frequency data
   */
  updateAudioIntensity() {
    if (!this.audioAnalyser || !this.audioDataArray) return;

    this.audioAnalyser.getByteFrequencyData(this.audioDataArray);

    const third = Math.floor(this.audioDataArray.length / 3);

    // Calculate average intensity for each frequency range
    this.bassIntensity = this.getAverageIntensity(this.audioDataArray, 0, third);
    this.midIntensity = this.getAverageIntensity(this.audioDataArray, third, third * 2);
    this.trebleIntensity = this.getAverageIntensity(this.audioDataArray, third * 2, this.audioDataArray.length);
  }

  /**
   * Get average intensity for a frequency range
   */
  getAverageIntensity(dataArray, start, end) {
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += dataArray[i];
    }
    return (sum / (end - start)) / 255; // Normalize to 0-1
  }

  /**
   * Detect beats in music using bass intensity
   * Returns true when a strong beat is detected
   */
  detectBeat() {
    const now = Date.now() / 1000; // Convert to seconds

    // Add current bass to history
    this.beatHistory.push(this.bassIntensity);
    if (this.beatHistory.length > this.beatHistorySize) {
      this.beatHistory.shift();
    }

    // Calculate average of recent bass values
    const avgBass = this.beatHistory.reduce((a, b) => a + b, 0) / this.beatHistory.length;

    // Check cooldown
    if (now - this.lastBeatTime < this.beatCooldown) {
      this.isBeat = false;
      return false;
    }

    // Detect beat: current bass significantly higher than recent average
    if (this.bassIntensity > this.beatThreshold && this.bassIntensity > avgBass * 1.5) {
      this.lastBeatTime = now;
      this.isBeat = true;
      return true;
    }

    this.isBeat = false;
    return false;
  }

  /**
   * Play positive connection tone (correct star)
   */
  playPositiveTone() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Pleasant ascending tone
    oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
    oscillator.frequency.exponentialRampToValueAtTime(659.25, this.audioContext.currentTime + 0.15); // E5
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  /**
   * Play negative tone (wrong star)
   */
  playNegativeTone() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Dissonant descending tone
    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.2);
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
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
   * Handle star click/tap - validate sequence and provide feedback
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

      // Check if this is the NEXT correct star in the sequence
      const expectedOrder = this.selectedStars.length + 1; // Next expected order number
      const isCorrectStar = clickedStar.userData.order === expectedOrder;

      if (isCorrectStar) {
        // ✓ CORRECT STAR - Show white line and play positive sound
        this.playPositiveTone();

        // Mark as selected
        clickedStar.userData.selected = true;
        this.selectedStars.push(clickedStar);
        this.correctTaps++;

        // Visual feedback - scale up and brighten
        gsap.to(clickedStar.scale, {
          x: clickedStar.userData.baseSize * 1.8,
          y: clickedStar.userData.baseSize * 1.8,
          duration: 0.3,
          ease: 'back.out(2)'
        });

        gsap.to(clickedStar.material, {
          opacity: 1,
          duration: 0.3
        });

        // Create particle burst
        this.createStarBurst(clickedStar.position);

        // Draw WHITE line to previous star
        if (this.selectedStars.length > 1) {
          const previousStar = this.selectedStars[this.selectedStars.length - 2];
          this.drawLineBetweenStars(previousStar, clickedStar, 0xffffff); // White line
        }

        // After 3 correct taps, auto-complete the constellation!
        if (this.correctTaps >= this.requiredTaps) {
          setTimeout(() => {
            this.autoCompleteCurrentConstellation();
          }, 500);
        }

      } else {
        // ✗ WRONG STAR - No line, negative feedback
        this.playNegativeTone();

        // Visual feedback - dim and shake
        const originalOpacity = clickedStar.material.opacity;
        gsap.to(clickedStar.material, {
          opacity: 0.3,
          duration: 0.15,
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            clickedStar.material.opacity = originalOpacity;
          }
        });

        // Shake animation
        const originalX = clickedStar.position.x;
        gsap.to(clickedStar.position, {
          x: originalX - 0.2,
          duration: 0.05,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            clickedStar.position.x = originalX;
          }
        });
      }
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

    // Highlight hovered star + change cursor
    if (intersects.length > 0) {
      const hoveredStar = intersects[0].object;
      this.renderer.domElement.style.cursor = 'pointer';

      if (!hoveredStar.userData.selected && hoveredStar.userData.baseSize) {
        // Brighten and scale up on hover
        gsap.to(hoveredStar.material, {
          opacity: 1,
          duration: 0.2
        });

        gsap.to(hoveredStar.scale, {
          x: hoveredStar.userData.baseSize * 1.4,
          y: hoveredStar.userData.baseSize * 1.4,
          duration: 0.2,
          ease: 'power2.out'
        });
      }
    } else {
      this.renderer.domElement.style.cursor = 'default';
      // Reset scale and opacity for non-selected stars
      this.stars.forEach(star => {
        if (!star.userData.selected && star.userData.baseSize) {
          gsap.to(star.scale, {
            x: star.userData.baseSize,
            y: star.userData.baseSize,
            duration: 0.2
          });
          gsap.to(star.material, {
            opacity: 0.9,
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
   * Draw line between two stars - thin and elegant
   */
  drawLineBetweenStars(star1, star2, color = 0xffffff) {
    const points = [];
    points.push(star1.position.clone());
    points.push(star2.position.clone());

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    // Enhanced glowing lines like real constellation charts
    const material = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0,
      linewidth: 2
    });

    const line = new THREE.Line(geometry, material);

    // Store base opacity for music reactivity
    line.userData = {
      baseOpacity: 0.9
    };

    this.lines.push(line);
    this.scene.add(line);

    // Animate line in smoothly
    gsap.to(material, {
      opacity: 0.9,
      duration: 0.5,
      ease: 'power2.out'
    });

    // Add flowing particles along the line for magical effect
    this.createLineParticles(star1.position, star2.position, color);
  }

  /**
   * Create flowing particles along constellation lines
   */
  createLineParticles(start, end, color = 0xffffff) {
    const particleCount = 3;

    for (let i = 0; i < particleCount; i++) {
      // Create glowing particle texture
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');

      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      const colorObj = new THREE.Color(color);
      const r = Math.floor(colorObj.r * 255);
      const g = Math.floor(colorObj.g * 255);
      const b = Math.floor(colorObj.b * 255);

      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.5)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
      });

      const particle = new THREE.Sprite(material);
      particle.scale.set(0.3, 0.3, 1);

      // Start at beginning of line
      particle.position.copy(start);

      this.scene.add(particle);
      this.lineParticles.push(particle);

      // Animate particle flowing along the line
      const delay = i * 0.3;
      const duration = 2.5 + Math.random() * 1;

      gsap.to(particle.position, {
        x: end.x,
        y: end.y,
        z: end.z,
        duration: duration,
        delay: delay,
        ease: 'none',
        repeat: -1,
        repeatDelay: 0.5
      });

      // Pulse opacity as it travels
      gsap.to(material, {
        opacity: 0.3,
        duration: duration / 2,
        delay: delay,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    }
  }

  /**
   * Auto-complete the current constellation after 3 correct taps
   */
  autoCompleteCurrentConstellation() {
    if (!this.currentConstellation || !this.currentStarData) return;

    // Find remaining unselected stars
    const remainingStars = this.stars.filter(star => !star.userData.selected);

    if (remainingStars.length === 0) {
      // All stars already selected, trigger completion
      this.discoverCurrentConstellation();
      return;
    }

    // Sort remaining stars by their order
    remainingStars.sort((a, b) => a.userData.order - b.userData.order);

    // Animate auto-selecting the remaining stars
    let delay = 0;
    remainingStars.forEach((star, i) => {
      setTimeout(() => {
        // Mark as selected
        star.userData.selected = true;
        this.selectedStars.push(star);

        // Visual feedback - scale up and brighten
        gsap.to(star.scale, {
          x: star.userData.baseSize * 1.8,
          y: star.userData.baseSize * 1.8,
          duration: 0.4,
          ease: 'back.out(2)'
        });

        gsap.to(star.material, {
          opacity: 1,
          duration: 0.4
        });

        // Play pleasant tone
        this.playPositiveTone();

        // Particle burst
        this.createStarBurst(star.position);

        // Draw line to previous star
        if (this.selectedStars.length > 1) {
          const prevStar = this.selectedStars[this.selectedStars.length - 2];
          this.drawLineBetweenStars(prevStar, star, 0xffffff);
        }

        // If this is the last star, discover the constellation
        if (i === remainingStars.length - 1) {
          setTimeout(() => {
            this.discoverCurrentConstellation();
          }, 600);
        }
      }, delay);
      delay += 400; // Stagger the auto-completion
    });
  }

  /**
   * Discover the current constellation (called after all stars connected)
   */
  discoverCurrentConstellation() {
    if (!this.currentConstellation) return;

    // Add to discovered list and save
    this.discoveredConstellations.push(this.currentConstellation.id);
    this.saveProgress();

    // Bring the constellation to life!
    this.animateConstellationToLife(this.currentConstellation);

    // Show constellation message
    this.showConstellationMessage(this.currentConstellation);

    // Update progress
    this.updateProgress();

    // Check if all constellations found
    const totalConstellations = this.getAllConstellations().length;
    if (this.discoveredConstellations.length >= totalConstellations) {
      setTimeout(() => {
        this.complete();
      }, 4000);
    } else {
      // Ready for next visit - puzzle will complete
      setTimeout(() => {
        this.complete();
      }, 4000);
    }
  }

  /**
   * Clear current selection
   */
  clearSelection() {
    // Reset stars
    this.selectedStars.forEach(star => {
      star.userData.selected = false;

      if (star.userData.baseSize) {
        gsap.to(star.scale, {
          x: star.userData.baseSize,
          y: star.userData.baseSize,
          duration: 0.5,
          ease: 'power2.out'
        });
      }

      gsap.to(star.material, {
        opacity: 0.9,
        duration: 0.5
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
    this.correctTaps = 0;
  }


  /**
   * Animate constellation coming to life - MASTERPIECE EDITION
   * Transform from simple stars into vivid, cosmic artwork
   */
  animateConstellationToLife(constellation) {
    const constellationColor = new THREE.Color(constellation.color || 0x88ddff);

    // PHASE 1: ENERGY AWAKENING (0-1.2s)
    // Lines draw in with cascading energy, as if the cosmos itself is painting
    this.lines.forEach((line, i) => {
      const points = line.geometry.attributes.position;
      const p1 = new THREE.Vector3(points.getX(0), points.getY(0), points.getZ(0));
      const p2 = new THREE.Vector3(points.getX(1), points.getY(1), points.getZ(1));

      // Animated line drawing effect
      const lineLength = p1.distanceTo(p2);
      const segments = Math.ceil(lineLength * 5);

      for (let seg = 0; seg < segments; seg++) {
        const progress = seg / segments;
        const nextProgress = (seg + 1) / segments;

        const segStart = new THREE.Vector3().lerpVectors(p1, p2, progress);
        const segEnd = new THREE.Vector3().lerpVectors(p1, p2, nextProgress);

        const segGeometry = new THREE.BufferGeometry().setFromPoints([segStart, segEnd]);
        const segMaterial = new THREE.LineBasicMaterial({
          color: constellationColor,
          transparent: true,
          opacity: 0,
          linewidth: 2
        });

        const segLine = new THREE.Line(segGeometry, segMaterial);
        this.scene.add(segLine);

        // Cascade drawing effect
        gsap.to(segMaterial, {
          opacity: 1,
          duration: 0.15,
          delay: i * 0.12 + seg * 0.02,
          ease: 'power2.out',
          onComplete: () => {
            if (seg === segments - 1) {
              // Replace segments with main line
              gsap.to(line.material, {
                opacity: 1,
                color: constellationColor,
                duration: 0.3
              });
            }
          }
        });

        // Fade out segment after revealing
        gsap.to(segMaterial, {
          opacity: 0,
          duration: 0.2,
          delay: i * 0.12 + seg * 0.02 + 0.5,
          onComplete: () => {
            this.scene.remove(segLine);
            segGeometry.dispose();
            segMaterial.dispose();
          }
        });
      }

      // Multi-layered glow system for depth and bloom
      for (let layer = 0; layer < 3; layer++) {
        const glowSize = (layer + 1) * 0.3;
        const glowCanvas = document.createElement('canvas');
        glowCanvas.width = 128;
        glowCanvas.height = 8;
        const glowCtx = glowCanvas.getContext('2d');

        const glowGradient = glowCtx.createLinearGradient(0, 4, 128, 4);
        const r = Math.floor(constellationColor.r * 255);
        const g = Math.floor(constellationColor.g * 255);
        const b = Math.floor(constellationColor.b * 255);

        glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.8 / (layer + 1)})`);
        glowGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${1 / (layer + 1)})`);
        glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${0.8 / (layer + 1)})`);

        glowCtx.fillStyle = glowGradient;
        glowCtx.fillRect(0, 0, 128, 8);

        const glowTexture = new THREE.CanvasTexture(glowCanvas);
        const glowMaterial = new THREE.SpriteMaterial({
          map: glowTexture,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending
        });

        const glowSprite = new THREE.Sprite(glowMaterial);
        const midPoint = new THREE.Vector3().lerpVectors(p1, p2, 0.5);
        glowSprite.position.copy(midPoint);
        glowSprite.scale.set(lineLength, glowSize, 1);

        // Orient along line
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        glowSprite.material.rotation = angle;

        this.scene.add(glowSprite);

        gsap.to(glowMaterial, {
          opacity: 0.6 / (layer + 1),
          duration: 1,
          delay: i * 0.12 + layer * 0.1,
          ease: 'power2.out'
        });

        // Perpetual glow pulse
        gsap.to(glowMaterial, {
          opacity: 0.3 / (layer + 1),
          duration: 2 + layer * 0.5,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
          delay: i * 0.12 + 1
        });

        constellation.glowSprites = constellation.glowSprites || [];
        constellation.glowSprites.push(glowSprite);
      }
    });

    // Phase 2: Stars explode with energy (0.5-2s)
    this.selectedStars.forEach((star, i) => {
      setTimeout(() => {
        // Create expanding rings
        for (let ring = 0; ring < 3; ring++) {
          const ringGeometry = new THREE.RingGeometry(0.1, 0.15, 32);
          const ringMaterial = new THREE.MeshBasicMaterial({
            color: constellationColor,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
          });
          const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
          ringMesh.position.copy(star.position);
          ringMesh.lookAt(this.camera.position);
          this.scene.add(ringMesh);

          gsap.to(ringMesh.scale, {
            x: 8 + ring * 2,
            y: 8 + ring * 2,
            z: 8 + ring * 2,
            duration: 1.5,
            delay: ring * 0.2,
            ease: 'power2.out'
          });

          gsap.to(ringMaterial, {
            opacity: 0,
            duration: 1.5,
            delay: ring * 0.2,
            onComplete: () => {
              this.scene.remove(ringMesh);
              ringGeometry.dispose();
              ringMaterial.dispose();
            }
          });
        }

        // Star intense glow
        if (star.userData.glow) {
          gsap.to(star.userData.glow.material, {
            opacity: 1,
            color: constellationColor,
            duration: 0.4,
            yoyo: true,
            repeat: 5,
            ease: 'sine.inOut'
          });
        }

        gsap.to(star.scale, {
          x: 2,
          y: 2,
          z: 2,
          duration: 0.3,
          yoyo: true,
          repeat: 2,
          ease: 'back.out(3)'
        });
      }, i * 120);
    });

    // Phase 3: Cascade of sparkles along lines (1-2.5s)
    setTimeout(() => {
      this.lines.forEach((line, i) => {
        setTimeout(() => {
          // Multiple sparkles per line for richness
          for (let s = 0; s < 5; s++) {
            setTimeout(() => {
              this.createTravelingSparkle(line, constellationColor);
            }, s * 150);
          }
        }, i * 180);
      });
    }, 800);

    // Phase 4: Fill with nebula-like particles (1.5-4s)
    setTimeout(() => {
      this.fillConstellationWithNebula(constellation, constellationColor);
    }, 1200);

    // Phase 5: Massive radial burst (2s)
    setTimeout(() => {
      const center = this.getConstellationCenter(constellation);
      this.createMassiveRadialBurst(center, constellationColor);
    }, 1800);

    // Phase 6: Constellation rotates and settles (2.5-4s)
    setTimeout(() => {
      this.finalConstellationSettlement(constellation, constellationColor);
    }, 2300);
  }

  /**
   * Fill constellation with nebula-like particles
   */
  fillConstellationWithNebula(constellation, color) {
    const center = this.getConstellationCenter(constellation);
    const radius = this.getConstellationRadius(constellation);

    // Create 100 particles for dense nebula effect
    for (let i = 0; i < 100; i++) {
      const size = 0.1 + Math.random() * 0.2;
      const particleGeometry = new THREE.SphereGeometry(size, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius * 0.9;
      const height = (Math.random() - 0.5) * 2;

      particle.position.set(
        center.x + Math.cos(angle) * distance,
        center.y + Math.sin(angle) * distance + height,
        center.z + (Math.random() - 0.5) * 2
      );

      this.scene.add(particle);

      // Fade in with variation
      gsap.to(particleMaterial, {
        opacity: 0.3 + Math.random() * 0.4,
        duration: 0.8 + Math.random() * 0.6,
        delay: Math.random() * 0.5
      });

      // Gentle floating
      gsap.to(particle.position, {
        y: particle.position.y + (Math.random() - 0.5) * 3,
        x: particle.position.x + (Math.random() - 0.5) * 2,
        duration: 3 + Math.random() * 2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });

      // Pulse opacity
      gsap.to(particleMaterial, {
        opacity: 0.1,
        duration: 2 + Math.random() * 1,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: Math.random()
      });

      constellation.particles = constellation.particles || [];
      constellation.particles.push(particle);
    }
  }

  /**
   * Massive radial burst
   */
  createMassiveRadialBurst(center, color) {
    const burstCount = 60;
    for (let i = 0; i < burstCount; i++) {
      const geometry = new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.9
      });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(center);
      this.scene.add(particle);

      const angle = (i / burstCount) * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI * 0.5;
      const distance = 12 + Math.random() * 6;

      const targetX = center.x + Math.cos(angle) * Math.cos(elevation) * distance;
      const targetY = center.y + Math.sin(elevation) * distance;
      const targetZ = center.z + Math.sin(angle) * Math.cos(elevation) * distance;

      gsap.to(particle.position, {
        x: targetX,
        y: targetY,
        z: targetZ,
        duration: 1.5,
        ease: 'power2.out'
      });

      gsap.to(particle.scale, {
        x: 0.1,
        y: 0.1,
        z: 0.1,
        duration: 1.5,
        ease: 'power2.in'
      });

      gsap.to(material, {
        opacity: 0,
        duration: 1.5,
        onComplete: () => {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      });
    }
  }

  /**
   * Final settlement with rotation
   */
  finalConstellationSettlement(constellation, color) {
    // Gentle rotation of the whole constellation
    const center = this.getConstellationCenter(constellation);
    const group = new THREE.Group();
    group.position.copy(center);

    // This would need to re-parent stars/lines to the group for rotation
    // For now, just add a final glow pulse

    this.stars.forEach(star => {
      if (star.userData.selected && star.userData.glow) {
        gsap.to(star.userData.glow.material, {
          opacity: 0.6,
          duration: 2,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut'
        });
      }
    });
  }

  /**
   * Create traveling sparkle along a line
   */
  createTravelingSparkle(line, color = 0xffffff) {
    const points = line.geometry.attributes.position;
    const start = new THREE.Vector3(points.getX(0), points.getY(0), points.getZ(0));
    const end = new THREE.Vector3(points.getX(1), points.getY(1), points.getZ(1));

    const sparkleGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const sparkleMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 1
    });
    const sparkle = new THREE.Mesh(sparkleGeometry, sparkleMaterial);
    sparkle.position.copy(start);
    this.scene.add(sparkle);

    // Travel along the line
    gsap.to(sparkle.position, {
      x: end.x,
      y: end.y,
      z: end.z,
      duration: 0.8,
      ease: 'power2.inOut',
      onComplete: () => {
        this.scene.remove(sparkle);
        sparkleGeometry.dispose();
        sparkleMaterial.dispose();
      }
    });

    // Fade out as it travels
    gsap.to(sparkleMaterial, {
      opacity: 0,
      duration: 0.8,
      delay: 0.3
    });
  }

  /**
   * Fill constellation with magical particles
   */
  fillConstellationWithParticles(constellation) {
    const center = this.getConstellationCenter(constellation);
    const radius = this.getConstellationRadius(constellation);

    // Create 30 floating particles within the constellation bounds
    for (let i = 0; i < 30; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.15, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: 0x88ffff,
        transparent: true,
        opacity: 0
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);

      // Random position within constellation bounds
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius * 0.7;
      particle.position.set(
        center.x + Math.cos(angle) * distance,
        center.y + Math.sin(angle) * distance,
        center.z
      );

      this.scene.add(particle);

      // Fade in
      gsap.to(particleMaterial, {
        opacity: 0.6,
        duration: 0.5,
        delay: Math.random() * 0.3
      });

      // Gentle floating animation
      gsap.to(particle.position, {
        y: `+=${Math.random() * 2 - 1}`,
        x: `+=${Math.random() * 2 - 1}`,
        duration: 2 + Math.random() * 2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });

      // Store for cleanup
      constellation.particles = constellation.particles || [];
      constellation.particles.push(particle);
    }
  }

  /**
   * Create radial burst from constellation center
   */
  createRadialBurst(center) {
    const burstCount = 20;
    for (let i = 0; i < burstCount; i++) {
      const geometry = new THREE.SphereGeometry(0.2, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
      });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(center);
      this.scene.add(particle);

      const angle = (i / burstCount) * Math.PI * 2;
      const distance = 8 + Math.random() * 4;
      const targetX = center.x + Math.cos(angle) * distance;
      const targetY = center.y + Math.sin(angle) * distance;

      gsap.to(particle.position, {
        x: targetX,
        y: targetY,
        duration: 1.2,
        ease: 'power2.out'
      });

      gsap.to(material, {
        opacity: 0,
        duration: 1.2,
        onComplete: () => {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      });
    }
  }

  /**
   * Get constellation center point
   */
  getConstellationCenter(constellation) {
    const uniqueIndices = [...new Set(constellation.indices)];
    let sumX = 0, sumY = 0, sumZ = 0;

    uniqueIndices.forEach(index => {
      const star = this.stars[index];
      if (star) {
        sumX += star.position.x;
        sumY += star.position.y;
        sumZ += star.position.z;
      }
    });

    const count = uniqueIndices.length;
    return new THREE.Vector3(sumX / count, sumY / count, sumZ / count);
  }

  /**
   * Get constellation radius (distance from center to furthest star)
   */
  getConstellationRadius(constellation) {
    const center = this.getConstellationCenter(constellation);
    const uniqueIndices = [...new Set(constellation.indices)];
    let maxDistance = 0;

    uniqueIndices.forEach(index => {
      const star = this.stars[index];
      if (star) {
        const distance = center.distanceTo(star.position);
        if (distance > maxDistance) {
          maxDistance = distance;
        }
      }
    });

    return maxDistance;
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

    const total = this.getAllConstellations().length;
    progressText.textContent = `${this.discoveredConstellations.length} of ${total} constellations discovered`;

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
        duration: 2
      });
    });

    this.stars.forEach(star => {
      if (star.userData.selected) {
        gsap.to(star.material, {
          opacity: 1,
          duration: 2
        });
        gsap.to(star.scale, {
          x: star.userData.baseSize * 2,
          y: star.userData.baseSize * 2,
          duration: 2
        });
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
        <br><br>
        Every pattern.<br>
        Every path.<br>
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
   * Create nebula clouds for atmospheric depth
   */
  createNebulaClouds() {
    // Create 3-5 subtle nebula clouds in the background
    const nebulaCount = 3 + Math.floor(Math.random() * 3);

    const nebulaColors = [
      { color: 0x4169E1, name: 'blue' },      // Blue nebula
      { color: 0x9370DB, name: 'purple' },    // Purple nebula
      { color: 0xFF69B4, name: 'pink' },      // Pink nebula
      { color: 0x20B2AA, name: 'teal' }       // Teal nebula
    ];

    for (let i = 0; i < nebulaCount; i++) {
      // Create nebula texture
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Select random nebula color
      const nebulaColor = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
      const color = new THREE.Color(nebulaColor.color);

      // Create multiple overlapping clouds for organic look
      for (let j = 0; j < 8; j++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const radius = 100 + Math.random() * 200;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

        gradient.addColorStop(0, `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, 0.08)`);
        gradient.addColorStop(0.4, `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, 0.04)`);
        gradient.addColorStop(1, `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
      }

      // Create nebula sprite
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.3 + Math.random() * 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const nebula = new THREE.Sprite(material);

      // Large scale for background
      const scale = 40 + Math.random() * 30;
      nebula.scale.set(scale, scale, 1);

      // Position far back
      nebula.position.set(
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 120,
        -30 - Math.random() * 20
      );

      // Slow rotation for subtle movement
      gsap.to(nebula.material, {
        opacity: material.opacity * 0.7,
        duration: 10 + Math.random() * 10,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });

      this.scene.add(nebula);
      this.nebulaClouds.push(nebula);
    }
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

    // Update audio intensity from music
    this.updateAudioIntensity();

    // Enhanced music-reactive camera movement with organic flow
    const time = Date.now() * 0.0001;
    const cameraAmplitude = 2 + (this.bassIntensity * 3);

    // More organic camera movement - figure-8 pattern
    const slowTime = time * 0.5;
    this.camera.position.x = Math.sin(slowTime) * cameraAmplitude + Math.sin(time * 2) * 0.5;
    this.camera.position.y = Math.sin(slowTime * 2) * cameraAmplitude * 0.7 + Math.cos(time * 1.5) * 0.3;
    this.camera.position.z = 50 + (this.midIntensity * 5) + Math.sin(time * 0.5) * 1;

    // Subtle camera tilt for depth
    this.camera.lookAt(
      Math.sin(time * 0.3) * 0.5,
      Math.cos(time * 0.4) * 0.5,
      0
    );

    // Parallax effect for nebula clouds - move slower, creating depth
    this.nebulaClouds.forEach((nebula, i) => {
      const parallaxSpeed = 0.1 + (i * 0.05);
      nebula.position.x += Math.sin(time + i) * parallaxSpeed * 0.01;
      nebula.position.y += Math.cos(time * 1.2 + i) * parallaxSpeed * 0.01;

      // Subtle rotation for organic feel
      nebula.rotation.z = time * 0.05 + i;
    });

    // Enhanced background stars with parallax based on Z-depth
    this.backgroundStars.forEach((star, i) => {
      const pulseAmount = 1 + (this.trebleIntensity * 0.3);
      star.sprite.scale.set(
        star.baseSize * pulseAmount,
        star.baseSize * pulseAmount,
        1
      );

      // Brightness pulses with mid frequencies
      star.material.opacity = star.baseOpacity * (1 + this.midIntensity * 0.4);

      // Parallax movement based on Z-depth (closer stars move more)
      const depth = star.sprite.position.z;
      const parallaxFactor = (depth + 50) / 100; // 0 to 1 range
      star.sprite.position.x += Math.sin(time * 0.5 + i) * parallaxFactor * 0.002;
      star.sprite.position.y += Math.cos(time * 0.7 + i) * parallaxFactor * 0.002;
    });

    // Make constellation stars pulse with music
    this.stars.forEach(star => {
      if (!star.userData.baseSize) return;

      const isSelected = star.userData.selected;
      const basePulse = isSelected ? 1.8 : 1.0;
      const musicPulse = 1 + (this.midIntensity * 0.5 + this.bassIntensity * 0.3);

      star.scale.set(
        star.userData.baseSize * basePulse * musicPulse,
        star.userData.baseSize * basePulse * musicPulse,
        1
      );

      // Selected stars glow with bass
      if (isSelected && star.material) {
        star.material.opacity = Math.min(1, 0.9 + this.bassIntensity * 0.3);
      }
    });

    // Make constellation lines glow with bass hits
    this.lines.forEach(line => {
      if (line.material) {
        const baseOpacity = line.userData?.baseOpacity || 1;
        line.material.opacity = baseOpacity * (1 + this.bassIntensity * 0.5);

        // Pulse line width with bass (emulated through opacity and glow)
        if (line.material.linewidth !== undefined) {
          line.material.linewidth = 2 + (this.bassIntensity * 2);
        }
      }
    });

    // Detect beats
    const beatDetected = this.detectBeat();

    // Beat-reactive effects
    if (beatDetected) {
      this.triggerBeatEffects();
    }

    // Call constellation-specific choreographies
    if (this.currentConstellation) {
      switch (this.currentConstellation.id) {
        case 'heart':
          this.animateHeartDance();
          break;
        case 'flamingo':
          this.animateFlamingoDance();
          break;
        case 'letterM':
          this.animateLetterMDance();
          break;
        case 'letterT':
          this.animateLetterTDance();
          break;
        case 'theaterMasks':
          this.animateTheaterMasksDance();
          break;
        case 'ballerina':
          this.animateBallerinaDance();
          break;
        case 'infinity':
          this.animateInfinityDance();
          break;
      }
    }

    // Render with post-processing (bloom, film grain)
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Trigger effects on strong beats
   */
  triggerBeatEffects() {
    // Camera flash effect on beat
    if (this.renderer) {
      const originalExposure = this.renderer.toneMappingExposure || 1;
      this.renderer.toneMappingExposure = originalExposure * 1.3;
      setTimeout(() => {
        if (this.renderer) {
          this.renderer.toneMappingExposure = originalExposure;
        }
      }, 50);
    }

    // Sparkle burst at random constellation star
    if (this.stars && this.stars.length > 0) {
      const randomStar = this.stars[Math.floor(Math.random() * this.stars.length)];
      this.createBeatSparkle(randomStar.position);
    }

    // Pulse all constellation stars briefly
    this.stars.forEach(star => {
      if (star.userData.baseSize) {
        gsap.to(star.scale, {
          x: star.userData.baseSize * 2.2,
          y: star.userData.baseSize * 2.2,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
          ease: 'power2.out'
        });
      }
    });
  }

  /**
   * Create sparkle effect on beat
   */
  createBeatSparkle(position) {
    const sparkleCount = 8;
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (i / sparkleCount) * Math.PI * 2;
      const distance = 1 + Math.random() * 2;

      const sparkleGeom = new THREE.SphereGeometry(0.1, 8, 8);
      const sparkleMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
      });

      const sparkle = new THREE.Mesh(sparkleGeom, sparkleMat);
      sparkle.position.set(
        position.x + Math.cos(angle) * distance,
        position.y + Math.sin(angle) * distance,
        position.z
      );

      this.scene.add(sparkle);

      // Animate sparkle outward and fade
      gsap.to(sparkle.position, {
        x: position.x + Math.cos(angle) * distance * 3,
        y: position.y + Math.sin(angle) * distance * 3,
        duration: 0.6,
        ease: 'power2.out'
      });

      gsap.to(sparkleMat, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => {
          this.scene.remove(sparkle);
          sparkleGeom.dispose();
          sparkleMat.dispose();
        }
      });
    }
  }

  /**
   * Choreograph ballerina constellation to dance with music
   */
  animateBallerinaDance() {
    if (!this.stars || this.stars.length === 0) return;

    const time = Date.now() * 0.001;

    // Ballerina constellation specific indices (from constellation geometry)
    // Head: 0, Neck: 1, Left arm: 2, Right arm: 3, Torso: 4, Left leg: 5, Right leg: 6, Foot: 7
    this.stars.forEach((star, index) => {
      if (!star.userData.originalPosition) {
        // Store original position on first run
        star.userData.originalPosition = star.position.clone();
      }

      const orig = star.userData.originalPosition;

      // Different body parts move with different frequencies
      switch(index) {
        case 0: // Head - subtle bob with mid frequencies
          star.position.y = orig.y + Math.sin(time * 2) * this.midIntensity * 0.5;
          break;

        case 2: // Left arm - wave with treble
          star.position.y = orig.y + Math.sin(time * 3) * this.trebleIntensity * 1.5;
          star.position.x = orig.x + Math.cos(time * 3) * this.trebleIntensity * 0.8;
          break;

        case 3: // Right arm - opposite wave
          star.position.y = orig.y + Math.sin(time * 3 + Math.PI) * this.trebleIntensity * 1.5;
          star.position.x = orig.x + Math.cos(time * 3 + Math.PI) * this.trebleIntensity * 0.8;
          break;

        case 6: // Right leg extended (arabesque) - sweeping motion with bass
          const sweepAngle = time * 1.5 + this.bassIntensity * Math.PI;
          const sweepRadius = 3 + this.bassIntensity * 2;
          star.position.x = orig.x + Math.cos(sweepAngle) * sweepRadius * 0.5;
          star.position.y = orig.y + Math.sin(sweepAngle) * sweepRadius * 0.3;
          break;

        case 7: // Left foot - tap with bass beats
          const tapAmount = this.bassIntensity > 0.3 ? this.bassIntensity * 2 : 0;
          star.position.y = orig.y - tapAmount;
          break;

        case 4: // Torso - gentle sway
          star.position.x = orig.x + Math.sin(time) * this.midIntensity * 0.3;
          break;
      }
    });

    // Make ballerina lines pulse with the choreography
    this.lines.forEach(line => {
      if (line.userData && line.material) {
        // Extra glow during high bass (like spotlights hitting during jumps)
        const spotlightEffect = this.bassIntensity > 0.5 ? 1.5 : 1;
        line.material.opacity = (line.userData.baseOpacity || 1) * spotlightEffect;
      }
    });
  }

  /**
   * Heart constellation - Pulses like a heartbeat with bass
   */
  animateHeartDance() {
    if (!this.stars || this.stars.length === 0) return;

    const time = Date.now() * 0.001;

    this.stars.forEach((star, index) => {
      if (!star.userData.originalPosition) {
        star.userData.originalPosition = star.position.clone();
      }

      const orig = star.userData.originalPosition;

      // Enhanced heartbeat with dual-phase pulse (lub-dub)
      const fastBeat = Math.sin(time * 1.2);
      const slowBeat = Math.sin(time * 0.6);
      const heartbeatPulse = 1 + (this.bassIntensity * 0.5) + (fastBeat * 0.12) + (slowBeat * 0.08);

      // Calculate distance from center
      const centerX = 0;
      const centerY = -1;
      const dx = orig.x - centerX;
      const dy = orig.y - centerY;

      // Radial expansion from center
      star.position.x = centerX + dx * heartbeatPulse;
      star.position.y = centerY + dy * heartbeatPulse;

      // Add organic floating motion (each star floats independently)
      const floatPhase = time * 1.5 + index * 0.5;
      star.position.x += Math.sin(floatPhase) * 0.15;
      star.position.y += Math.cos(floatPhase * 1.3) * this.midIntensity * 0.4;

      // Subtle rotation around center for lifelike motion
      const angle = Math.atan2(dy, dx);
      const rotationAmount = Math.sin(time * 0.8) * 0.05;
      const newAngle = angle + rotationAmount;
      const distance = Math.sqrt(dx * dx + dy * dy) * heartbeatPulse;
      star.position.x = centerX + Math.cos(newAngle) * distance + Math.sin(floatPhase) * 0.15;
      star.position.y = centerY + Math.sin(newAngle) * distance + Math.cos(floatPhase * 1.3) * 0.2;
    });

    // Lines glow with heartbeat intensity
    this.lines.forEach(line => {
      if (line.userData && line.material) {
        const heartGlow = 0.7 + (this.bassIntensity * 0.9) + Math.sin(time * 1.2) * 0.2;
        line.material.opacity = Math.min(1, (line.userData.baseOpacity || 1) * heartGlow);
      }
    });

    // Apply color shift for emotional resonance
    this.applyColorShift(0xff88bb, this.bassIntensity + this.midIntensity * 0.5);
  }

  /**
   * Flamingo constellation - Graceful neck curves and elegant balance
   */
  animateFlamingoDance() {
    if (!this.stars || this.stars.length === 0) return;

    const time = Date.now() * 0.001;

    this.stars.forEach((star, index) => {
      if (!star.userData.originalPosition) {
        star.userData.originalPosition = star.position.clone();
      }

      const orig = star.userData.originalPosition;

      // Flamingo-specific movements
      switch(index) {
        case 0: // Head - bobs gently with music
          star.position.y = orig.y + Math.sin(time * 2.5) * this.midIntensity * 0.6;
          star.position.x = orig.x + Math.cos(time * 2) * this.trebleIntensity * 0.3;
          break;

        case 1: // Neck curve 1 - graceful S-curve
          star.position.x = orig.x + Math.sin(time * 1.8) * this.midIntensity * 0.5;
          star.position.y = orig.y + Math.cos(time * 1.5) * this.midIntensity * 0.4;
          break;

        case 2: // Neck curve 2 - continues the flow
          star.position.x = orig.x + Math.sin(time * 1.8 + Math.PI/3) * this.midIntensity * 0.4;
          star.position.y = orig.y + Math.cos(time * 1.5 + Math.PI/3) * this.midIntensity * 0.3;
          break;

        case 3: // Body center - stable
          star.position.y = orig.y + Math.sin(time * 0.8) * this.bassIntensity * 0.2;
          break;

        case 5: // Leg 1 - slight sway
        case 6: // Leg 2
          star.position.x = orig.x + Math.sin(time + index) * this.bassIntensity * 0.25;
          break;
      }
    });
  }

  /**
   * Letter M constellation - Breathes and pulses like Mila's name
   */
  animateLetterMDance() {
    if (!this.stars || this.stars.length === 0) return;

    const time = Date.now() * 0.001;

    this.stars.forEach((star, index) => {
      if (!star.userData.originalPosition) {
        star.userData.originalPosition = star.position.clone();
      }

      const orig = star.userData.originalPosition;

      // Letter breathes - expands and contracts
      const breathePulse = 1 + Math.sin(time * 1.5) * this.midIntensity * 0.15;

      // Keep letter shape but add breathing
      star.position.x = orig.x * breathePulse;
      star.position.y = orig.y * breathePulse;

      // Center peak (index 2) responds to treble
      if (index === 2) {
        star.position.y += this.trebleIntensity * 0.8;
      }

      // Edges pulse with bass
      if (index === 0 || index === 4) {
        star.position.x += (index === 0 ? -1 : 1) * this.bassIntensity * 0.3;
      }
    });

    // Color shift with music intensity
    this.applyColorShift(0x6699ff, this.midIntensity);
  }

  /**
   * Letter T constellation - Strong, grounded stance with subtle strength
   */
  animateLetterTDance() {
    if (!this.stars || this.stars.length === 0) return;

    const time = Date.now() * 0.001;

    this.stars.forEach((star, index) => {
      if (!star.userData.originalPosition) {
        star.userData.originalPosition = star.position.clone();
      }

      const orig = star.userData.originalPosition;

      // Horizontal bar (indices 0-4) - waves slightly with treble
      if (index < 5) {
        star.position.y = orig.y + Math.sin(time * 2 + index * 0.5) * this.trebleIntensity * 0.3;
      }

      // Vertical stem (index 5) - stands firm, pulses with bass
      if (index === 5) {
        const strength = 1 + this.bassIntensity * 0.15;
        star.position.y = orig.y * strength;
      }

      // Center (index 2) - anchor point, extra emphasis
      if (index === 2) {
        const pulse = 1 + this.bassIntensity * 0.2;
        star.scale.set(
          star.userData.baseSize * pulse,
          star.userData.baseSize * pulse,
          1
        );
      }
    });

    // Color shift with music intensity
    this.applyColorShift(0xff9966, this.bassIntensity);
  }

  /**
   * Theater Masks - Express emotions through movement
   */
  animateTheaterMasksDance() {
    if (!this.stars || this.stars.length === 0) return;

    const time = Date.now() * 0.001;

    this.stars.forEach((star, index) => {
      if (!star.userData.originalPosition) {
        star.userData.originalPosition = star.position.clone();
      }

      const orig = star.userData.originalPosition;

      // Comedy mask (indices 0-4) - bounces with joy (treble)
      if (index < 5) {
        star.position.y = orig.y + Math.sin(time * 3 + index * 0.5) * this.trebleIntensity * 0.4;

        // Smile lifts up more with high frequencies (indices 2,3,4 are the smile)
        if (index >= 2) {
          star.position.y += this.trebleIntensity * 0.3;
          // Center of smile (index 3) lifts even more
          if (index === 3) {
            star.position.y += this.trebleIntensity * 0.2;
          }
        }

        // Eyes widen slightly with joy
        if (index < 2) {
          const eyeSpread = this.trebleIntensity * 0.2;
          star.position.x = orig.x + (index === 0 ? -eyeSpread : eyeSpread);
        }
      }

      // Tragedy mask (indices 5-9) - subtle sway with sorrow (mid/bass)
      if (index >= 5) {
        star.position.y = orig.y + Math.sin(time * 1.2 + index * 0.5) * this.midIntensity * 0.3;

        // Frown pulls down more with bass (indices 7,8,9 are the frown)
        if (index >= 7) {
          star.position.y -= this.bassIntensity * 0.3;
          // Center of frown (index 8) pulls up (inverted smile)
          if (index === 8) {
            star.position.y += this.bassIntensity * 0.2;
          }
        }

        // Eyes droop with sorrow
        if (index >= 5 && index < 7) {
          star.position.y -= this.bassIntensity * 0.15;
        }
      }

      // Both masks tilt slightly side to side together
      star.position.x += Math.sin(time * 0.8) * this.midIntensity * 0.15;
    });

    // Lines pulse between gold colors
    const intensity = Math.sin(time * 2) * 0.3 + 0.7;
    this.applyColorShift(0xdaa520, intensity);
  }

  /**
   * Infinity constellation - Eternal flowing loop
   */
  animateInfinityDance() {
    if (!this.stars || this.stars.length === 0) return;

    const time = Date.now() * 0.001;

    // Enhanced figure-8 motion with smooth parametric equations
    this.stars.forEach((star, index) => {
      if (!star.userData.originalPosition) {
        star.userData.originalPosition = star.position.clone();
      }

      const orig = star.userData.originalPosition;

      // Smooth figure-8 flow using lemniscate parametric equations
      const flowSpeed = time * 0.6;
      const phase = (index / this.stars.length) * Math.PI * 2;
      const t = flowSpeed + phase;

      // Music-reactive amplitude
      const amplitude = 0.3 + this.midIntensity * 0.5;
      const verticalStretch = 0.8 + this.bassIntensity * 0.3;

      // Lemniscate (figure-8) parametric motion
      const denom = 1 + Math.sin(t) * Math.sin(t);
      const flowX = amplitude * Math.cos(t) / denom;
      const flowY = amplitude * Math.sin(t) * Math.cos(t) / denom * verticalStretch;

      star.position.x = orig.x + flowX;
      star.position.y = orig.y + flowY;

      // Add subtle independent floating for organic feel
      const floatPhase = time * 1.2 + index * 0.7;
      star.position.x += Math.sin(floatPhase) * 0.08;
      star.position.y += Math.cos(floatPhase * 1.4) * 0.08;

      // Center star (index 4) pulses brighter with bass
      if (index === 4) {
        const centerPulse = 1 + this.bassIntensity * 0.6;
        star.scale.set(
          star.userData.baseSize * centerPulse,
          star.userData.baseSize * centerPulse,
          1
        );
      }

      // Outer edges expand with treble
      if (index === 1 || index === 7) {
        const edgeExpand = this.trebleIntensity * 0.4;
        star.position.x += (index === 1 ? -1 : 1) * edgeExpand;
      }
    });

    // Lines pulse with flowing energy
    this.lines.forEach((line, i) => {
      if (line.userData && line.material) {
        const wavePhase = time * 2.5 + i * 0.8;
        const flowGlow = 0.8 + Math.sin(wavePhase) * 0.3 + this.midIntensity * 0.5;
        line.material.opacity = Math.min(1, (line.userData.baseOpacity || 1) * flowGlow);
      }
    });

    // Slow color shift through purple spectrum
    const colorPhase = Math.sin(time * 0.3) * 0.4 + 0.6;
    this.applyColorShift(0xccaaff, colorPhase + this.trebleIntensity * 0.3);
  }

  /**
   * Apply music-reactive color shifting to constellation
   */
  applyColorShift(baseColor, intensity) {
    // Shift towards white/brighter based on intensity
    this.stars.forEach(star => {
      if (star.material && star.material.color) {
        try {
          const color = new THREE.Color(baseColor);
          const shift = intensity * 0.3;
          color.r = Math.min(1, color.r + shift);
          color.g = Math.min(1, color.g + shift);
          color.b = Math.min(1, color.b + shift);

          // Use .set() instead of .copy() for sprite materials
          if (star.material.color.set) {
            star.material.color.set(color);
          } else if (star.material.color.copy) {
            star.material.color.copy(color);
          }
        } catch (e) {
          // Silently handle incompatible materials
        }
      }
    });

    this.lines.forEach(line => {
      if (line.material && line.material.color) {
        try {
          const color = new THREE.Color(baseColor);
          const shift = intensity * 0.4;
          color.r = Math.min(1, color.r + shift);
          color.g = Math.min(1, color.g + shift);
          color.b = Math.min(1, color.b + shift);

          // Use .set() for line materials
          if (line.material.color.set) {
            line.material.color.set(color);
          } else if (line.material.color.copy) {
            line.material.color.copy(color);
          }
        } catch (e) {
          // Silently handle incompatible materials
        }
      }
    });
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

    // Resize post-processing composer
    if (this.composer) {
      this.composer.setSize(width, height);
    }

    // Update bloom pass resolution
    if (this.bloomPass) {
      this.bloomPass.resolution.set(width, height);
    }
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
