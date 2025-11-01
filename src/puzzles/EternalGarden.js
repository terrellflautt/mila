/**
 * Eternal Garden - Beautiful, Artistic Edition
 * A stunning, impressionistic garden experience for mobile
 * Enhanced with interactive planting, growth simulation, and genetics
 *
 * 🎮 MAJOR ENHANCEMENTS v2.0:
 * ===========================
 *
 * 1. 💚 FLOATING +XP NUMBERS - Satisfying visual feedback for every action
 *    - Green floating numbers that rise and fade (using GSAP)
 *    - Appear on plant, water, fertilize, harvest, and crossbreed actions
 *
 * 2. 🏆 ACHIEVEMENT SYSTEM - Rewarding milestones and celebrations
 *    - 7 achievements: First Seed, Green Thumb, Master Gardener, Geneticist,
 *      Mad Scientist, Collector, and Legendary Gardener
 *    - Popup notifications with confetti and special sounds
 *    - Bonus XP rewards for unlocking achievements
 *    - Persistent progress saved to localStorage
 *
 * 3. ✨ RARE PLANT SYSTEM - Discovery excitement with special plants
 *    - 5% Shimmering (subtle glow pulse)
 *    - 1% Golden (gold glow with sparkle particles)
 *    - 0.1% Rainbow (color-cycling glow with spectacular particle effects)
 *    - Each rarity has unique visual effects and particle systems
 *    - Special sound effect plays when discovering rare plants
 *
 * 4. 👆 HOVER EFFECTS - More interactive plant interactions
 *    - Subtle glow ring appears when hovering over plants
 *    - Tooltip shows: Stage, Color, Size, and Rarity
 *    - Cursor changes to pointer for better UX
 *
 * 5. 🎯 BETTER SELECTION VISUAL - Crystal-clear feedback for breeding
 *    - Bright cyan glowing ring around selected plants
 *    - Pulsing animation with opacity changes
 *    - "1/2" and "2/2" indicators above selected plants
 *    - Easy deselection by clicking again
 *
 * 6. 🎊 LEVEL UP CELEBRATION - Spectacular milestone animations
 *    - Screen shake effect
 *    - 100 confetti particles
 *    - Huge "+1 LEVEL!" text in center
 *    - All plants in garden glow gold for 2 seconds
 *    - Happy ascending chime sound
 *
 * 7. 📊 GARDEN STATS PANEL - Track your progress
 *    - Total plants grown counter
 *    - Rarest plant discovered display
 *    - Total playtime tracker
 *    - XP per minute rate calculation
 *    - Garden beauty score (based on mature plants and rarities)
 *    - Collapsible toggle button
 *
 * 8. 🎵 ENHANCED AUDIO SYSTEM - Varied and pleasant sounds
 *    - Different pitches for different actions
 *    - Happy chime for level ups (C5-E5-G5-C6 progression)
 *    - Special sparkly sound for achievements
 *    - Magical sound for rare plant discoveries
 *    - All sounds use Web Audio API oscillators
 *
 * 9. 🌟 RARITY INDICATOR - Show off your discoveries
 *    - "Rarest Discovery" badge in resource panel
 *    - Color-coded by rarity (rainbow/golden/shimmering)
 *    - Always visible to showcase achievements
 *
 * All enhancements maintain the stress-free, no-penalty philosophy.
 * Everything is designed to feel rewarding, beautiful, and fun!
 */

import * as THREE from 'three';
import gsap from 'gsap';
import { GardenSimulator, GrowthStages } from '../utils/gardenSimulator.js';

export class EternalGarden {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.element = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.isAnimating = true;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.audioContext = null;

    // Time management
    this.realTime = 0;
    this.gameTime = 6; // Start at dawn
    this.timeScale = 0.075; // 5x faster day/night cycle (about 5.3 minutes for full cycle)
    this.lastTime = performance.now() / 1000;

    // Garden state
    this.isComplete = false;
    this.simulator = new GardenSimulator();
    this.visitStartTime = null;
    this.poemsUnlocked = 0;

    // UI interaction state
    this.selectedPlants = [];
    this.selectedAction = 'plant'; // 'plant', 'water', 'fertilize', 'harvest', 'crossbreed'
    this.atmosphericParticles = [];

    // Poems to unlock
    this.poems = [
      "Time moves slower in the garden.",
      "Seeds become promises.",
      "Blooms hold secrets.",
      "Moments unfold quietly.",
      "You touch beauty.",
      "Beauty answers back."
    ];

    // Systems
    this.plantMeshes = new Map(); // Map of plant ID -> THREE.Group
    this.flamingos = [];
    this.goldfish = [];
    this.ground = null;
    this.stars = null;
    this.mist = null;
    this.atmosphericParticleSystem = null;
    this.butterflies = [];

    // Day/night palette - ENHANCED with breathtaking sunrise/sunset colors
    this.palette = {
      // Midday - bright and cheerful
      dayTop: new THREE.Color(0x4A90E2),        // Bright azure blue
      dayBottom: new THREE.Color(0xFFE88C),     // Warm golden yellow

      // Dawn (5-8 AM) - soft morning pastels
      dawnTop: new THREE.Color(0xFFB4D6),       // Soft rose pink
      dawnMiddle: new THREE.Color(0xFFD9B3),    // Peach cream
      dawnBottom: new THREE.Color(0xFFEED9),    // Pale golden cream

      // Sunrise (6-7 AM) - vibrant awakening
      sunriseTop: new THREE.Color(0xFF6FA0),    // Coral pink
      sunriseMiddle: new THREE.Color(0xFFB366), // Warm orange
      sunriseBottom: new THREE.Color(0xFFE599), // Soft yellow

      // Dusk/Golden Hour (17-20) - magical twilight
      duskTop: new THREE.Color(0xFF4D88),       // Deep rose
      duskMiddle: new THREE.Color(0xFF9966),    // Sunset orange
      duskBottom: new THREE.Color(0xFFCC80),    // Warm amber

      // Sunset (18-19) - most dramatic
      sunsetTop: new THREE.Color(0xE64A8D),     // Magenta pink
      sunsetMiddle: new THREE.Color(0xFF7F50),  // Coral
      sunsetBottom: new THREE.Color(0xFFB347),  // Gold

      // Twilight (19-21) - fading light
      twilightTop: new THREE.Color(0x6B5B95),   // Purple haze
      twilightMiddle: new THREE.Color(0x8B7BA8), // Lavender
      twilightBottom: new THREE.Color(0xB8A8D0), // Pale violet

      // Night - deep and mysterious
      nightTop: new THREE.Color(0x0F1B3D),      // Deep midnight blue
      nightMiddle: new THREE.Color(0x1A1A3E),   // Dark indigo
      nightBottom: new THREE.Color(0x2D1B3D)    // Dark purple
    };

    // Shooting star system
    this.shootingStars = [];
    this.lastShootingStar = 0;

    // NEW ENHANCEMENTS ===============================================

    // Achievement System
    this.achievements = {
      'first_plant': { unlocked: false, title: '🌱 First Seed', desc: 'Plant your first flower', reward: 10 },
      'level_5': { unlocked: false, title: '🌿 Green Thumb', desc: 'Reach level 5', reward: 50 },
      'level_10': { unlocked: false, title: '🌳 Master Gardener', desc: 'Reach level 10', reward: 100 },
      'first_breed': { unlocked: false, title: '🧬 Geneticist', desc: 'Create your first hybrid', reward: 25 },
      '10_breeds': { unlocked: false, title: '🔬 Mad Scientist', desc: 'Create 10 hybrids', reward: 100 },
      'all_colors': { unlocked: false, title: '🌈 Collector', desc: 'Discover all 6 colors', reward: 200 },
      '100_plants': { unlocked: false, title: '🏆 Legendary Gardener', desc: 'Grow 100 plants', reward: 500 }
    };

    // Garden Statistics
    this.gardenStats = {
      totalPlantsGrown: 0,
      rarestPlantDiscovered: 'none',
      totalPlaytime: 0,
      breedsCreated: 0,
      colorsDiscovered: new Set(),
      startTime: Date.now()
    };

    // Hover state
    this.hoveredPlant = null;

    // Enhanced particle systems
    this.windParticles = [];
    this.pollenParticles = [];

    // ULTIMATE NEW FEATURES ==========================================

    // Plant Types Enum
    this.PlantTypes = {
      FLOWER: 'flower',
      TREE: 'tree',
      VEGETABLE: 'vegetable',
      FRUIT: 'fruit',
      MUSHROOM: 'mushroom',
      CACTUS: 'cactus',
      VINE: 'vine'
    };

    // Special Seeds Inventory
    this.specialSeeds = {
      rapidGrowth: 0,      // 5% chance - grows 3x faster
      giant: 0,            // 3% chance - 2x bigger
      miniature: 0,        // 3% chance - tiny cute plants
      rainbow: 0,          // 1% chance - cycles through colors
      ancient: 0,          // 0.5% chance - rare extinct plant
      hybrid: 0            // 2% chance - combines two plant types
    };

    // Plant Encyclopedia / Discoveries
    this.discoveries = {
      plantTypes: new Set(),           // Discovered plant types
      patterns: new Set(),             // Discovered patterns
      specialEffects: new Set(),       // Unlocked special effects
      totalUniqueDiscoveries: 0
    };

    // Creature Breeding Systems
    this.flamingoBreeding = {
      flamingos: [],
      lastBreedTime: 0,
      eggs: [],
      maxFlamingos: 10,
      breedCooldown: 300000  // 5 minutes for happiness
    };

    this.goldfishBreeding = {
      goldfish: [],
      lastBreedTime: 0,
      babies: [],
      maxGoldfish: 20,
      breedCooldown: 60000   // 1 minute
    };

    // Enhanced Genetics Tracker
    this.geneticsDatabase = {
      growthSpeed: new Set(),  // fast, normal, slow
      sizes: new Set(),        // tiny, small, medium, large, giant
      glows: new Set(),        // none, faint, bright
      patterns: new Set(),     // solid, striped, spotted, gradient
      rarities: new Set()      // common, uncommon, rare, epic, legendary
    };

    // Load saved achievements and stats
    this.loadAchievementsAndStats();
  }

  isMobile() {
    return true; // Always optimize for mobile
  }

  show() {
    this.element = this.createPuzzleElement();
    document.body.appendChild(this.element);

    this.initScene();
    this.createGardenBase();
    this.addEventListeners();

    gsap.fromTo(this.element,
      { opacity: 0 },
      { opacity: 1, duration: 2, ease: 'power2.out' }
    );

    this.animate();
    this.initAudio();

    this.visitStartTime = performance.now();
  }

  createPuzzleElement() {
    const puzzle = document.createElement('div');
    puzzle.className = 'garden-puzzle';
    puzzle.innerHTML = `
      <div class="garden-container">
        <button class="garden-exit-btn" title="Return">
          <span class="exit-icon">✕</span>
        </button>

        <div class="garden-canvas-container">
          <!-- Three.js canvas -->
        </div>

        <div class="garden-time-indicator">
          <span class="current-time">Dawn</span>
        </div>

        <!-- Resources & Skill Panel -->
        <div class="garden-resources-panel">
          <div class="skill-display">
            <div class="skill-icon">🌱</div>
            <div class="skill-info">
              <div class="skill-level">Lv. <span id="skill-level">1</span></div>
              <div class="xp-bar">
                <div class="xp-fill" id="xp-fill"></div>
              </div>
            </div>
          </div>
          <div class="resources">
            <div class="resource">
              <span class="resource-icon">🌾</span>
              <span class="resource-value" id="seeds-count">3</span>
            </div>
            <div class="resource">
              <span class="resource-icon">💧</span>
              <span class="resource-value" id="water-count">10</span>
            </div>
            <div class="resource">
              <span class="resource-icon">✨</span>
              <span class="resource-value" id="fertilizer-count">5</span>
            </div>
          </div>
          <!-- Rarity Badge -->
          <div class="rarity-badge" id="rarity-badge">
            <span class="rarity-label">Rarest:</span>
            <span class="rarity-value" id="rarest-plant">none</span>
          </div>
        </div>

        <!-- Garden Stats Panel -->
        <div class="garden-stats-panel" id="stats-panel">
          <button class="stats-toggle" id="stats-toggle">📊</button>
          <div class="stats-content" id="stats-content">
            <div class="stats-header">Garden Stats</div>
            <div class="stat-row">
              <span class="stat-label">Total Plants:</span>
              <span class="stat-value" id="stat-plants">0</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Rarest Find:</span>
              <span class="stat-value" id="stat-rarest">none</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Playtime:</span>
              <span class="stat-value" id="stat-playtime">0m</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">XP/min:</span>
              <span class="stat-value" id="stat-xp-rate">0</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Beauty Score:</span>
              <span class="stat-value" id="stat-beauty">0</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="garden-actions">
          <button class="action-btn active" data-action="plant" title="Plant Seed">
            <span class="action-icon">🌱</span>
          </button>
          <button class="action-btn" data-action="water" title="Water Plant">
            <span class="action-icon">💧</span>
          </button>
          <button class="action-btn" data-action="fertilize" title="Fertilize Plant">
            <span class="action-icon">✨</span>
          </button>
          <button class="action-btn" data-action="harvest" title="Harvest Plant">
            <span class="action-icon">🌸</span>
          </button>
          <button class="action-btn" data-action="crossbreed" title="Cross-breed Plants">
            <span class="action-icon">🧬</span>
          </button>
        </div>

        <!-- Info Display -->
        <div class="garden-info" id="garden-info"></div>

        <!-- Special Seeds Inventory Panel -->
        <div class="special-seeds-panel" id="special-seeds-panel">
          <button class="seeds-toggle" id="seeds-toggle">🎁</button>
          <div class="seeds-content" id="seeds-content">
            <div class="seeds-header">Special Seeds</div>
            <div class="seed-item" data-seed="rapidGrowth">
              <span class="seed-icon">⚡</span>
              <span class="seed-name">Rapid Growth</span>
              <span class="seed-count" id="seed-rapidGrowth">0</span>
            </div>
            <div class="seed-item" data-seed="giant">
              <span class="seed-icon">🦕</span>
              <span class="seed-name">Giant</span>
              <span class="seed-count" id="seed-giant">0</span>
            </div>
            <div class="seed-item" data-seed="miniature">
              <span class="seed-icon">🐜</span>
              <span class="seed-name">Miniature</span>
              <span class="seed-count" id="seed-miniature">0</span>
            </div>
            <div class="seed-item" data-seed="rainbow">
              <span class="seed-icon">🌈</span>
              <span class="seed-name">Rainbow</span>
              <span class="seed-count" id="seed-rainbow">0</span>
            </div>
            <div class="seed-item" data-seed="ancient">
              <span class="seed-icon">🦴</span>
              <span class="seed-name">Ancient</span>
              <span class="seed-count" id="seed-ancient">0</span>
            </div>
            <div class="seed-item" data-seed="hybrid">
              <span class="seed-icon">🧬</span>
              <span class="seed-name">Hybrid</span>
              <span class="seed-count" id="seed-hybrid">0</span>
            </div>
          </div>
        </div>

        <!-- Discoveries Encyclopedia Panel -->
        <div class="discoveries-panel" id="discoveries-panel">
          <button class="discoveries-toggle" id="discoveries-toggle">📖</button>
          <div class="discoveries-content" id="discoveries-content">
            <div class="discoveries-header">Encyclopedia</div>
            <div class="discovery-section">
              <div class="discovery-section-title">Plant Types</div>
              <div class="discovery-grid" id="plant-types-grid">
                <div class="discovery-item" data-type="flower">
                  <span class="discovery-icon">🌸</span>
                  <span class="discovery-label">Flower</span>
                </div>
                <div class="discovery-item undiscovered" data-type="tree">
                  <span class="discovery-icon">🌳</span>
                  <span class="discovery-label">Tree</span>
                </div>
                <div class="discovery-item undiscovered" data-type="vegetable">
                  <span class="discovery-icon">🥕</span>
                  <span class="discovery-label">Vegetable</span>
                </div>
                <div class="discovery-item undiscovered" data-type="fruit">
                  <span class="discovery-icon">🍎</span>
                  <span class="discovery-label">Fruit</span>
                </div>
                <div class="discovery-item undiscovered" data-type="mushroom">
                  <span class="discovery-icon">🍄</span>
                  <span class="discovery-label">Mushroom</span>
                </div>
                <div class="discovery-item undiscovered" data-type="cactus">
                  <span class="discovery-icon">🌵</span>
                  <span class="discovery-label">Cactus</span>
                </div>
              </div>
            </div>
            <div class="discovery-stats">
              <div class="discovery-stat">
                <span class="stat-label">Discoveries:</span>
                <span class="stat-value" id="total-discoveries">0</span>
              </div>
              <div class="discovery-stat">
                <span class="stat-label">Flamingos:</span>
                <span class="stat-value" id="flamingo-count">2</span>
              </div>
              <div class="discovery-stat">
                <span class="stat-label">Goldfish:</span>
                <span class="stat-value" id="goldfish-count">2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    return puzzle;
  }

  initScene() {
    const container = this.element.querySelector('.garden-canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.scene = new THREE.Scene();

    // Soft atmospheric fog
    this.scene.fog = new THREE.FogExp2(0xffeaa7, 0.015);

    // Dynamic background
    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = 2;
    this.bgCanvas.height = 256;
    this.bgContext = this.bgCanvas.getContext('2d');
    this.bgTexture = new THREE.CanvasTexture(this.bgCanvas);
    this.scene.background = this.bgTexture;

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, 6, 20);
    this.camera.lookAt(0, 0, 0);

    // Renderer with better settings
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = false; // Keep performance good
    container.appendChild(this.renderer.domElement);

    // Soft, warm lighting
    this.ambientLight = new THREE.HemisphereLight(0xffeaa7, 0x8b7355, 0.6);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffd4a3, 1.2);
    this.sunLight.position.set(15, 20, 10);
    this.sunLight.castShadow = false; // Keep performance good
    this.scene.add(this.sunLight);

    window.addEventListener('resize', () => this.onResize());
  }

  createGardenBase() {
    // Beautiful gradient ground
    this.createGround();

    // Stars for night
    this.createStars();

    // Atmospheric mist particles
    this.createMist();

    // Fireflies
    this.createFireflies();

    // Atmospheric particles (pollen, butterflies)
    this.createAtmosphericParticles();

    // Butterflies
    this.createButterflies();

    // 2 Pink flamingos
    this.createFlamingos();

    // Garden details (rocks, grass patches)
    this.createGardenDetails();

    // Pond with goldfish
    this.createPond();

    // Load existing plants from simulator
    this.loadExistingPlants();
  }

  createGround() {
    const groundGeometry = new THREE.PlaneGeometry(80, 80, 32, 32);

    // Add gentle terrain variation
    const positions = groundGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      positions[i + 2] = Math.sin(x * 0.1) * 0.3 + Math.cos(y * 0.1) * 0.3;
    }
    groundGeometry.attributes.position.needsUpdate = true;
    groundGeometry.computeVertexNormals();

    const groundMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        dayNightPhase: { value: 0.5 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float dayNightPhase;
        varying vec2 vUv;
        varying vec3 vWorldPos;

        void main() {
          // Radial gradient from center
          vec2 center = vec2(0.5, 0.5);
          float dist = length(vUv - center);

          // Day: warm golden green
          vec3 dayCenter = vec3(0.35, 0.45, 0.25);
          vec3 dayEdge = vec3(0.22, 0.35, 0.18);

          // Night: cool deep blue-green
          vec3 nightCenter = vec3(0.12, 0.18, 0.22);
          vec3 nightEdge = vec3(0.08, 0.12, 0.15);

          vec3 centerColor = mix(nightCenter, dayCenter, dayNightPhase);
          vec3 edgeColor = mix(nightEdge, dayEdge, dayNightPhase);

          vec3 color = mix(centerColor, edgeColor, smoothstep(0.0, 0.8, dist));

          // Organic texture
          float pattern = sin(vWorldPos.x * 1.5 + time * 0.1) * cos(vWorldPos.z * 1.5 + time * 0.1);
          color += vec3(pattern * 0.015);

          // Distance fade
          float fade = smoothstep(30.0, 15.0, dist * 40.0);
          color *= fade * 0.8 + 0.2;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });

    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -2.5;
    this.scene.add(this.ground);
  }

  createStars() {
    const count = 150;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 120;
      positions[i * 3 + 1] = Math.random() * 40 + 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      sizes[i] = Math.random() * 1.5 + 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        opacity: { value: 0 },
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        uniform float time;
        varying float vOpacity;
        void main() {
          vOpacity = 0.5 + sin(time + position.x * 0.1) * 0.5;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying float vOpacity;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = smoothstep(0.5, 0.0, dist) * opacity * vOpacity;
          gl_FragColor = vec4(1.0, 1.0, 0.95, alpha);
        }
      `
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  createMist() {
    const count = 30;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 8 - 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      sizes[i] = Math.random() * 8 + 4;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 6,
      color: 0xffeaa7,
      transparent: true,
      opacity: 0.08,
      blending: THREE.NormalBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.mist = new THREE.Points(geometry, material);
    this.scene.add(this.mist);
  }

  createFireflies() {
    const count = 50;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 10 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      speeds[i] = 0.05 + Math.random() * 0.15;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

    const material = new THREE.PointsMaterial({
      size: 0.15,
      color: 0xffd700,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.fireflySystem = new THREE.Points(geometry, material);
    this.scene.add(this.fireflySystem);
  }

  createAtmosphericParticles() {
    // Floating pollen/dust particles
    const count = 100;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = Math.random() * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = Math.random() * 0.01 + 0.005;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

      sizes[i] = Math.random() * 0.5 + 0.3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        time: { value: 0 },
        opacity: { value: 0.6 },
        dayNightPhase: { value: 1.0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 velocity;
        uniform float time;
        varying float vOpacity;
        void main() {
          vOpacity = 0.3 + sin(time * 2.0 + position.x) * 0.3;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float opacity;
        uniform float dayNightPhase;
        varying float vOpacity;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = smoothstep(0.5, 0.0, dist) * opacity * vOpacity * dayNightPhase;

          // Warm golden color during day
          vec3 color = vec3(1.0, 0.95, 0.7);

          gl_FragColor = vec4(color, alpha);
        }
      `
    });

    this.atmosphericParticleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.atmosphericParticleSystem);
  }

  createButterflies() {
    // Create 5 butterflies that fly around
    for (let i = 0; i < 5; i++) {
      const butterfly = this.createButterfly();

      const angle = (i / 5) * Math.PI * 2;
      const radius = 8 + Math.random() * 5;

      butterfly.position.set(
        Math.cos(angle) * radius,
        2 + Math.random() * 3,
        Math.sin(angle) * radius
      );

      butterfly.userData = {
        flyAngle: angle,
        flySpeed: 0.3 + Math.random() * 0.2,
        flyRadius: radius,
        bobPhase: Math.random() * Math.PI * 2,
        wingPhase: Math.random() * Math.PI * 2
      };

      this.butterflies.push(butterfly);
      this.scene.add(butterfly);
    }
  }

  createButterfly() {
    const group = new THREE.Group();

    // Simple butterfly geometry
    const wingGeo = new THREE.CircleGeometry(0.15, 6);
    const wingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      emissive: new THREE.Color().setHSL(Math.random(), 0.5, 0.2),
      emissiveIntensity: 0.3
    });

    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.x = -0.1;
    leftWing.rotation.y = Math.PI * 0.3;
    group.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo.clone(), wingMat.clone());
    rightWing.position.x = 0.1;
    rightWing.rotation.y = -Math.PI * 0.3;
    group.add(rightWing);

    // Store wings for animation
    group.userData.wings = [leftWing, rightWing];

    // Body
    const bodyGeo = new THREE.CapsuleGeometry(0.02, 0.15, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.8
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    group.add(body);

    group.scale.setScalar(0.8);

    return group;
  }

  createFlamingos() {
    // Create 2 flamingos with a love story
    // They start separated, meet, and end up together

    // Flamingo 1 - starts from left side
    const flamingo1 = this.createFlamingo();
    flamingo1.position.set(-20, 5, -15); // Start off-screen left, elevated for flying in
    flamingo1.userData = {
      id: 1,
      state: 'flying_in', // flying_in, wandering_solo, meeting, together, sleeping
      walkSpeed: 0.02,
      flySpeed: 0.15,
      walkDirection: new THREE.Vector3(1, 0, 0.5).normalize(),
      turnTimer: 3,
      bobPhase: 0,
      meetingPoint: null,
      partner: null,
      stateTimer: 0,
      flyStartTime: 0,
      sleepPosition: new THREE.Vector3(-1.5, -2.0, -1.5) // Near pond
    };
    this.flamingos.push(flamingo1);
    this.scene.add(flamingo1);

    // Flamingo 2 - starts from right side (enters after first one)
    const flamingo2 = this.createFlamingo();
    flamingo2.position.set(20, 5, 15); // Start off-screen right, elevated
    flamingo2.userData = {
      id: 2,
      state: 'waiting', // Waits before flying in
      walkSpeed: 0.02,
      flySpeed: 0.15,
      walkDirection: new THREE.Vector3(-1, 0, -0.5).normalize(),
      turnTimer: 3,
      bobPhase: Math.PI,
      meetingPoint: null,
      partner: null,
      stateTimer: 10, // Wait 10 seconds before flying in
      flyStartTime: 0,
      sleepPosition: new THREE.Vector3(1.5, -2.0, 1.5) // Near pond, opposite side
    };
    this.flamingos.push(flamingo2);
    this.scene.add(flamingo2);

    // Link them as partners
    flamingo1.userData.partner = flamingo2;
    flamingo2.userData.partner = flamingo1;

    // Fly in animation for flamingo 1
    this.flyInFlamingo(flamingo1, new THREE.Vector3(-8, -2.0, -6));
  }

  createFlamingo() {
    const group = new THREE.Group();

    // Origami-style material (flat shading for paper look)
    const origamiMat = new THREE.MeshStandardMaterial({
      color: 0xFF6B9D,
      flatShading: true,
      roughness: 0.9,
      metalness: 0
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0xCC5577,
      flatShading: true,
      roughness: 0.9
    });

    // Body (angular box for origami look)
    const bodyGeo = new THREE.BoxGeometry(0.5, 0.6, 0.4);
    const body = new THREE.Mesh(bodyGeo, origamiMat);
    body.position.y = 1.2;
    body.rotation.y = Math.PI / 8;
    group.add(body);

    // Neck (thin angular cylinder)
    const neckGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.0, 6);
    const neck = new THREE.Mesh(neckGeo, origamiMat);
    neck.position.set(0.2, 1.8, 0.1);
    neck.rotation.z = 0.4;
    group.add(neck);

    // Head (small pyramid/angular)
    const headGeo = new THREE.TetrahedronGeometry(0.15);
    const head = new THREE.Mesh(headGeo, origamiMat);
    head.position.set(0.5, 2.3, 0.15);
    group.add(head);

    // Beak (small cone)
    const beakGeo = new THREE.ConeGeometry(0.06, 0.2, 4);
    const beak = new THREE.Mesh(beakGeo, new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      flatShading: true,
      roughness: 0.9
    }));
    beak.position.set(0.62, 2.3, 0.15);
    beak.rotation.z = -Math.PI / 2;
    group.add(beak);

    // Wings (triangular/angular for origami)
    const wingGeo = new THREE.BufferGeometry();
    const wingVertices = new Float32Array([
      0, 0, 0,
      0.8, 0, 0,
      0.4, 0, 0.6
    ]);
    wingGeo.setAttribute('position', new THREE.BufferAttribute(wingVertices, 3));
    wingGeo.computeVertexNormals();

    const leftWing = new THREE.Mesh(wingGeo, darkMat);
    leftWing.position.set(-0.2, 1.2, 0);
    leftWing.rotation.y = Math.PI;
    leftWing.rotation.z = -0.3;
    group.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo.clone(), darkMat);
    rightWing.position.set(0.2, 1.2, 0);
    rightWing.rotation.z = 0.3;
    group.add(rightWing);

    if (!group.userData.wings) group.userData.wings = [];
    group.userData.wings.push(leftWing, rightWing);

    // Legs (thin angular cylinders)
    for (let i = 0; i < 2; i++) {
      const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 4);
      const leg = new THREE.Mesh(legGeo, origamiMat);
      leg.position.set(i === 0 ? -0.12 : 0.12, 0.4, 0);
      group.add(leg);
    }

    // Tail (angular triangle)
    const tailGeo = new THREE.ConeGeometry(0.15, 0.35, 4);
    const tail = new THREE.Mesh(tailGeo, darkMat);
    tail.position.set(-0.35, 1.25, 0);
    tail.rotation.z = Math.PI / 2;
    group.add(tail);

    group.scale.setScalar(0.9); // ULTIMATE SIZE - 1.8x bigger and more prominent!

    return group;
  }

  // Flamingo love story animation helpers
  flyInFlamingo(flamingo, targetPos) {
    const userData = flamingo.userData;
    userData.state = 'flying_in';
    userData.flyStartTime = this.realTime;

    // Animate wings faster during flight
    if (userData.wings) {
      userData.wings.forEach((wing, i) => {
        gsap.to(wing.rotation, {
          z: (i === 0 ? -0.8 : 0.8),
          duration: 0.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
      });
    }

    // Fly to target position with arc
    gsap.to(flamingo.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 8,
      ease: 'power2.inOut',
      onUpdate: () => {
        // Arc trajectory (goes up then down)
        const progress = (this.realTime - userData.flyStartTime) / 8;
        if (progress < 1) {
          flamingo.position.y = targetPos.y + Math.sin(progress * Math.PI) * 3;
        }
      },
      onComplete: () => {
        userData.state = 'wandering_solo';
        userData.stateTimer = 15 + Math.random() * 10; // Wander for a while before meeting
        // Slow down wings after landing
        if (userData.wings) {
          userData.wings.forEach((wing, i) => {
            gsap.to(wing.rotation, {
              z: (i === 0 ? -0.3 : 0.3),
              duration: 0.5,
              overwrite: true
            });
          });
        }
      }
    });
  }

  startMeeting(flamingo1, flamingo2) {
    // Choose a meeting point between them
    const meetingPoint = new THREE.Vector3(
      (flamingo1.position.x + flamingo2.position.x) / 2,
      -2.0,
      (flamingo1.position.z + flamingo2.position.z) / 2
    );

    flamingo1.userData.state = 'meeting';
    flamingo1.userData.meetingPoint = meetingPoint;
    flamingo1.userData.stateTimer = 0;

    flamingo2.userData.state = 'meeting';
    flamingo2.userData.meetingPoint = meetingPoint;
    flamingo2.userData.stateTimer = 0;
  }

  flyAwayTogether(flamingo1, flamingo2) {
    // Fly away off-screen together
    const direction = new THREE.Vector3(
      Math.random() - 0.5,
      0,
      Math.random() - 0.5
    ).normalize();

    const targetPos1 = new THREE.Vector3(
      direction.x * 25,
      5,
      direction.z * 25
    );

    const targetPos2 = new THREE.Vector3(
      direction.x * 25 + 2,
      5,
      direction.z * 25 + 2
    );

    flamingo1.userData.state = 'flying_away';
    flamingo2.userData.state = 'flying_away';

    // Faster wing flapping
    [flamingo1, flamingo2].forEach(flamingo => {
      if (flamingo.userData.wings) {
        flamingo.userData.wings.forEach((wing, i) => {
          gsap.to(wing.rotation, {
            z: (i === 0 ? -0.8 : 0.8),
            duration: 0.15,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            overwrite: true
          });
        });
      }
    });

    // Fly away with slight offset
    gsap.to(flamingo1.position, {
      x: targetPos1.x,
      y: targetPos1.y,
      z: targetPos1.z,
      duration: 10,
      ease: 'power1.in',
      onUpdate: () => {
        const startY = flamingo1.position.y;
        if (startY < 5) {
          flamingo1.position.y += 0.05;
        }
      },
      onComplete: () => {
        // Return together after being off-screen
        setTimeout(() => {
          this.returnTogether(flamingo1, flamingo2);
        }, 5000);
      }
    });

    gsap.to(flamingo2.position, {
      x: targetPos2.x,
      y: targetPos2.y,
      z: targetPos2.z,
      duration: 10,
      ease: 'power1.in',
      onUpdate: () => {
        const startY = flamingo2.position.y;
        if (startY < 5) {
          flamingo2.position.y += 0.05;
        }
      }
    });
  }

  returnTogether(flamingo1, flamingo2) {
    // Return from opposite side, already together
    const entryAngle = Math.random() * Math.PI * 2;
    const startPos1 = new THREE.Vector3(
      Math.cos(entryAngle) * 25,
      5,
      Math.sin(entryAngle) * 25
    );
    const startPos2 = new THREE.Vector3(
      Math.cos(entryAngle) * 25 + 2,
      5,
      Math.sin(entryAngle) * 25 + 2
    );

    flamingo1.position.copy(startPos1);
    flamingo2.position.copy(startPos2);

    const targetPos1 = new THREE.Vector3(
      Math.cos(entryAngle) * -5,
      -2.0,
      Math.sin(entryAngle) * -5
    );
    const targetPos2 = new THREE.Vector3(
      Math.cos(entryAngle) * -5 + 1.5,
      -2.0,
      Math.sin(entryAngle) * -5 + 1.5
    );

    flamingo1.userData.state = 'flying_in_together';
    flamingo2.userData.state = 'flying_in_together';

    gsap.to(flamingo1.position, {
      x: targetPos1.x,
      y: targetPos1.y,
      z: targetPos1.z,
      duration: 8,
      ease: 'power2.inOut',
      onUpdate: () => {
        const progress = gsap.getProperty(flamingo1.position, 'progress') || 0;
        if (progress < 1) {
          flamingo1.position.y = -2.0 + Math.sin(progress * Math.PI) * 3;
        }
      },
      onComplete: () => {
        flamingo1.userData.state = 'together';
        flamingo1.userData.stateTimer = 20; // Stay together for a while
        // Slow wings
        if (flamingo1.userData.wings) {
          flamingo1.userData.wings.forEach((wing, i) => {
            gsap.to(wing.rotation, {
              z: (i === 0 ? -0.3 : 0.3),
              duration: 0.5,
              overwrite: true
            });
          });
        }
      }
    });

    gsap.to(flamingo2.position, {
      x: targetPos2.x,
      y: targetPos2.y,
      z: targetPos2.z,
      duration: 8,
      ease: 'power2.inOut',
      onUpdate: () => {
        const progress = gsap.getProperty(flamingo2.position, 'progress') || 0;
        if (progress < 1) {
          flamingo2.position.y = -2.0 + Math.sin(progress * Math.PI) * 3;
        }
      },
      onComplete: () => {
        flamingo2.userData.state = 'together';
        flamingo2.userData.stateTimer = 20;
        if (flamingo2.userData.wings) {
          flamingo2.userData.wings.forEach((wing, i) => {
            gsap.to(wing.rotation, {
              z: (i === 0 ? -0.3 : 0.3),
              duration: 0.5,
              overwrite: true
            });
          });
        }
      }
    });
  }

  createGardenDetails() {
    // Add some decorative rocks
    for (let i = 0; i < 12; i++) {
      const rockGeo = new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.3, 0);
      const rockMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.1, 0.15, 0.25 + Math.random() * 0.15),
        roughness: 0.95,
        metalness: 0.05
      });
      const rock = new THREE.Mesh(rockGeo, rockMat);

      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 20;

      rock.position.set(
        Math.cos(angle) * radius,
        -2.4 + Math.random() * 0.1,
        Math.sin(angle) * radius
      );

      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      rock.scale.set(
        0.8 + Math.random() * 0.4,
        0.8 + Math.random() * 0.4,
        0.8 + Math.random() * 0.4
      );

      this.scene.add(rock);
    }

    // Add grass patches (small clumps)
    for (let i = 0; i < 25; i++) {
      const count = 8 + Math.floor(Math.random() * 12);
      const grassGroup = new THREE.Group();

      for (let j = 0; j < count; j++) {
        const bladeGeo = new THREE.PlaneGeometry(0.08, 0.3 + Math.random() * 0.2);
        const bladeMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color().setHSL(0.3, 0.6, 0.3 + Math.random() * 0.2),
          side: THREE.DoubleSide,
          roughness: 0.9
        });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);

        blade.position.set(
          (Math.random() - 0.5) * 0.4,
          0.15,
          (Math.random() - 0.5) * 0.4
        );

        blade.rotation.y = Math.random() * Math.PI * 2;
        blade.rotation.z = (Math.random() - 0.5) * 0.3;

        grassGroup.add(blade);
      }

      const angle = Math.random() * Math.PI * 2;
      const radius = 3 + Math.random() * 18;

      grassGroup.position.set(
        Math.cos(angle) * radius,
        -2.35,
        Math.sin(angle) * radius
      );

      this.scene.add(grassGroup);
    }
  }

  createPond() {
    // Water surface (circular) - raised up to be clearly visible
    const pondGeo = new THREE.CircleGeometry(3, 32);
    const pondMat = new THREE.MeshStandardMaterial({
      color: 0x4A9FD8,
      transparent: true,
      opacity: 0.9,
      roughness: 0.15,
      metalness: 0.5,
      side: THREE.DoubleSide
    });
    const pond = new THREE.Mesh(pondGeo, pondMat);
    pond.rotation.x = -Math.PI / 2;
    pond.position.y = -2.1; // Raised higher to be clearly visible
    this.scene.add(pond);

    // Store for animation
    this.pondMaterial = pondMat;

    // Pond edge/rim (raised slightly)
    const edgeGeo = new THREE.RingGeometry(3, 3.3, 32);
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x6d5d47,
      roughness: 0.95,
      side: THREE.DoubleSide
    });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.rotation.x = -Math.PI / 2;
    edge.position.y = -2.08;
    this.scene.add(edge);

    // Goldfish (6 swimming around)
    this.goldfish = [];
    for (let i = 0; i < 6; i++) {
      const fishGroup = new THREE.Group();

      // Body (small ellipsoid)
      const bodyGeo = new THREE.SphereGeometry(0.12, 8, 8);
      bodyGeo.scale(1.5, 0.8, 0.7);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xFFA500 : 0xFFD700,
        roughness: 0.6,
        metalness: 0.2
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      fishGroup.add(body);

      // Tail (small triangle)
      const tailGeo = new THREE.ConeGeometry(0.08, 0.15, 4);
      const tail = new THREE.Mesh(tailGeo, bodyMat);
      tail.position.x = -0.15;
      tail.rotation.z = Math.PI / 2;
      fishGroup.add(tail);

      // Random starting position in pond
      const angle = (i / 6) * Math.PI * 2;
      const radius = 1 + Math.random() * 1.5;

      fishGroup.position.set(
        Math.cos(angle) * radius,
        -2.05, // Just below water surface
        Math.sin(angle) * radius
      );

      fishGroup.userData = {
        swimAngle: angle,
        swimSpeed: 0.08 + Math.random() * 0.08, // Much slower, peaceful
        swimRadius: radius
      };

      this.goldfish.push(fishGroup);
      this.scene.add(fishGroup);
    }

    // Gentle ripples
    gsap.to(pondMat, {
      opacity: 0.6,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }

  createShootingStar() {
    // Create a streak geometry for the shooting star trail
    const length = 3 + Math.random() * 2;
    const points = [];
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(new THREE.Vector3(-length, 0, 0));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      linewidth: 2
    });

    const shootingStar = new THREE.Line(geometry, material);

    // Random starting position in the sky
    shootingStar.position.set(
      (Math.random() - 0.5) * 60,
      20 + Math.random() * 15,
      (Math.random() - 0.5) * 60
    );

    // Random velocity (generally downward and across)
    const speed = 15 + Math.random() * 10;
    const angle = Math.random() * Math.PI * 2;
    shootingStar.userData = {
      velocity: new THREE.Vector3(
        Math.cos(angle) * speed,
        -(5 + Math.random() * 5),
        Math.sin(angle) * speed
      ),
      life: 2.5,
      maxLife: 2.5
    };

    // Orient the line in the direction of travel
    shootingStar.lookAt(shootingStar.position.clone().add(shootingStar.userData.velocity));

    this.shootingStars.push(shootingStar);
    this.scene.add(shootingStar);
  }

  updateSkyAndLighting(hour) {
    let top, middle, bottom;

    // Determine time of day with smooth multi-color gradients
    if (hour >= 5 && hour < 6.5) {
      // Early dawn (5-6:30 AM) - soft pastels
      const t = (hour - 5) / 1.5;
      top = new THREE.Color().copy(this.palette.nightTop).lerp(this.palette.dawnTop, t);
      middle = new THREE.Color().copy(this.palette.nightMiddle).lerp(this.palette.dawnMiddle, t);
      bottom = new THREE.Color().copy(this.palette.nightBottom).lerp(this.palette.dawnBottom, t);
    } else if (hour >= 6.5 && hour < 8) {
      // Sunrise (6:30-8 AM) - vibrant awakening
      const t = (hour - 6.5) / 1.5;
      top = new THREE.Color().copy(this.palette.dawnTop).lerp(this.palette.sunriseTop, t);
      middle = new THREE.Color().copy(this.palette.dawnMiddle).lerp(this.palette.sunriseMiddle, t);
      bottom = new THREE.Color().copy(this.palette.dawnBottom).lerp(this.palette.sunriseBottom, t);
    } else if (hour >= 8 && hour < 10) {
      // Morning transition to day (8-10 AM)
      const t = (hour - 8) / 2;
      top = new THREE.Color().copy(this.palette.sunriseTop).lerp(this.palette.dayTop, t);
      middle = new THREE.Color().copy(this.palette.sunriseMiddle).lerp(this.palette.dayBottom, t);
      bottom = new THREE.Color().copy(this.palette.sunriseBottom).lerp(this.palette.dayBottom, t);
    } else if (hour >= 10 && hour < 17) {
      // Full day (10 AM - 5 PM) - bright and cheerful
      top = this.palette.dayTop;
      middle = new THREE.Color().copy(this.palette.dayTop).lerp(this.palette.dayBottom, 0.5);
      bottom = this.palette.dayBottom;
    } else if (hour >= 17 && hour < 18) {
      // Golden hour begins (5-6 PM) - warm glow
      const t = (hour - 17);
      top = new THREE.Color().copy(this.palette.dayTop).lerp(this.palette.duskTop, t);
      middle = new THREE.Color().copy(this.palette.dayBottom).lerp(this.palette.duskMiddle, t);
      bottom = new THREE.Color().copy(this.palette.dayBottom).lerp(this.palette.duskBottom, t);
    } else if (hour >= 18 && hour < 19) {
      // Sunset peak (6-7 PM) - MOST DRAMATIC
      const t = (hour - 18);
      top = new THREE.Color().copy(this.palette.duskTop).lerp(this.palette.sunsetTop, t);
      middle = new THREE.Color().copy(this.palette.duskMiddle).lerp(this.palette.sunsetMiddle, t);
      bottom = new THREE.Color().copy(this.palette.duskBottom).lerp(this.palette.sunsetBottom, t);
    } else if (hour >= 19 && hour < 21) {
      // Twilight (7-9 PM) - fading into night
      const t = (hour - 19) / 2;
      top = new THREE.Color().copy(this.palette.sunsetTop).lerp(this.palette.twilightTop, t);
      middle = new THREE.Color().copy(this.palette.sunsetMiddle).lerp(this.palette.twilightMiddle, t);
      bottom = new THREE.Color().copy(this.palette.sunsetBottom).lerp(this.palette.twilightBottom, t);
    } else if (hour >= 21 && hour < 22) {
      // Late twilight to night (9-10 PM)
      const t = (hour - 21);
      top = new THREE.Color().copy(this.palette.twilightTop).lerp(this.palette.nightTop, t);
      middle = new THREE.Color().copy(this.palette.twilightMiddle).lerp(this.palette.nightMiddle, t);
      bottom = new THREE.Color().copy(this.palette.twilightBottom).lerp(this.palette.nightBottom, t);
    } else {
      // Full night (10 PM - 5 AM) - deep and mysterious
      top = this.palette.nightTop;
      middle = this.palette.nightMiddle;
      bottom = this.palette.nightBottom;
    }

    // Draw THREE-STOP gradient for richer sky
    const gradient = this.bgContext.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#' + top.getHexString());
    gradient.addColorStop(0.5, '#' + middle.getHexString());
    gradient.addColorStop(1, '#' + bottom.getHexString());
    this.bgContext.fillStyle = gradient;
    this.bgContext.fillRect(0, 0, 2, 256);
    this.bgTexture.needsUpdate = true;

    // Update fog color
    if (this.scene.fog) {
      this.scene.fog.color.copy(bottom);
    }

    // Calculate normalized day/night value for lighting (0 = night, 1 = day)
    const normalized = (Math.sin((hour / 24) * Math.PI * 2 - Math.PI / 2) + 1) / 2;

    // Update lights
    const lightIntensity = Math.max(0.4, normalized);
    this.ambientLight.intensity = 0.4 + normalized * 0.5;
    this.sunLight.intensity = lightIntensity * 1.2;
    this.sunLight.color.copy(top);

    // Update stars
    if (this.stars) {
      this.stars.material.uniforms.opacity.value = (1 - normalized) * 0.9;
    }

    // Update ground shader
    if (this.ground) {
      this.ground.material.uniforms.dayNightPhase.value = normalized;
    }

    // Update time display
    const timeText = this.element?.querySelector('.current-time');
    if (timeText) {
      let label = 'Dawn';
      if (hour >= 8 && hour < 17) label = 'Day';
      else if (hour >= 17 && hour < 20) label = 'Dusk';
      else if (hour >= 20 || hour < 5) label = 'Night';
      else if (hour >= 5 && hour < 8) label = 'Dawn';
      timeText.textContent = label;
    }
  }

  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio not supported');
    }
  }

  playGrowthSound(pitch = 1) {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.frequency.setValueAtTime(280 * pitch, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(420 * pitch, this.audioContext.currentTime + 0.4);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.03, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.6);
  }

  addEventListeners() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('click', (e) => this.onCanvasClick(e));

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.onCanvasClick({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });

    // Add mouse move for hover effects
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));

    const exitBtn = this.element.querySelector('.garden-exit-btn');
    exitBtn.addEventListener('click', () => this.hide());

    // Action button listeners
    const actionBtns = this.element.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.setAction(action);

        // Update button states
        actionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Stats panel toggle
    const statsToggle = this.element.querySelector('#stats-toggle');
    const statsContent = this.element.querySelector('#stats-content');
    if (statsToggle && statsContent) {
      statsToggle.addEventListener('click', () => {
        statsContent.classList.toggle('open');
      });
    }

    // Seeds panel toggle
    const seedsToggle = this.element.querySelector('#seeds-toggle');
    const seedsPanel = this.element.querySelector('#seeds-panel');
    if (seedsToggle && seedsPanel) {
      seedsToggle.addEventListener('click', () => {
        seedsPanel.classList.toggle('open');
      });
    }

    // Discoveries panel toggle
    const discoveriesToggle = this.element.querySelector('#discoveries-toggle');
    const discoveriesPanel = this.element.querySelector('#discoveries-panel');
    if (discoveriesToggle && discoveriesPanel) {
      discoveriesToggle.addEventListener('click', () => {
        discoveriesPanel.classList.toggle('open');
      });
    }
  }

  setAction(action) {
    this.selectedAction = action;
    this.selectedPlants = []; // Clear selection when changing actions

    // Update cursor
    const canvas = this.renderer.domElement;
    const cursors = {
      plant: 'crosshair',
      water: 'pointer',
      fertilize: 'pointer',
      harvest: 'pointer',
      crossbreed: 'pointer'
    };
    canvas.style.cursor = cursors[action] || 'default';
  }

  showInfo(message, duration = 2000, isError = false) {
    const infoEl = this.element.querySelector('#garden-info');
    infoEl.textContent = message;
    infoEl.className = `garden-info ${isError ? 'error' : 'success'}`;
    infoEl.style.opacity = '1';

    setTimeout(() => {
      infoEl.style.opacity = '0';
    }, duration);
  }

  updateUI() {
    // Update skill display
    const skill = this.simulator.skill;
    const resources = this.simulator.resources;

    const skillLevelEl = this.element.querySelector('#skill-level');
    const xpFillEl = this.element.querySelector('#xp-fill');
    const seedsEl = this.element.querySelector('#seeds-count');
    const waterEl = this.element.querySelector('#water-count');
    const fertilizerEl = this.element.querySelector('#fertilizer-count');

    if (skillLevelEl) skillLevelEl.textContent = skill.level;

    // XP bar
    const xpForNextLevel = 100 + (skill.level - 1) * 10;
    const xpPercent = (skill.experience / xpForNextLevel) * 100;
    if (xpFillEl) xpFillEl.style.width = `${xpPercent}%`;

    // Resources
    if (seedsEl) seedsEl.textContent = resources.seeds;
    if (waterEl) waterEl.textContent = resources.water;
    if (fertilizerEl) fertilizerEl.textContent = resources.fertilizer;

    // Update stats panel
    this.updateStatsPanel();
  }

  loadExistingPlants() {
    // Load plants from simulator and create their 3D meshes
    this.simulator.plants.forEach(plant => {
      this.createPlantMesh(plant);
    });

    this.updateUI();
  }

  updatePlantGrowth() {
    // Check all plants for growth stage changes
    this.simulator.plants.forEach(plant => {
      const mesh = this.plantMeshes.get(plant.id);
      if (!mesh) return;

      // Check if plant stage changed
      if (mesh.userData.lastStage !== plant.stage) {
        // Plant has grown!
        this.onPlantGrow(plant, mesh);
        mesh.userData.lastStage = plant.stage;
      }

      // Update scale based on stage
      const targetScale = this.simulator.getPlantScale(plant);
      if (mesh.scale.x !== targetScale) {
        gsap.to(mesh.scale, {
          x: targetScale,
          y: targetScale,
          z: targetScale,
          duration: 2,
          ease: 'elastic.out(1, 0.5)'
        });
      }
    });
  }

  onPlantGrow(plant, mesh) {
    // Update geometry for new growth stage
    const color = this.simulator.getPlantColor(plant);
    this.updatePlantGeometry(mesh, plant, color);

    // Growth particle effect
    this.createGrowthParticles(mesh.position);

    // Play sound
    this.playGrowthSound(1.0 + plant.stage * 0.1);

    // Show notification
    const stageNames = ['Seed', 'Sprout', 'Small', 'Medium', 'Mature'];
    if (plant.stage > 0) {
      this.showInfo(`Plant grew to ${stageNames[plant.stage]}!`);
    }

    // Update UI in case we leveled up
    this.updateUI();
  }

  createGrowthParticles(position) {
    const count = 12;

    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 6, 6);
      const material = new THREE.MeshBasicMaterial({
        color: 0x4CAF50,
        transparent: true,
        opacity: 0.9
      });
      const particle = new THREE.Mesh(geometry, material);

      particle.position.copy(position);
      particle.position.y += 0.2;

      this.scene.add(particle);

      const angle = (i / count) * Math.PI * 2;
      const radius = 0.4 + Math.random() * 0.3;

      gsap.to(particle.position, {
        x: position.x + Math.cos(angle) * radius,
        y: position.y + 0.8 + Math.random() * 0.4,
        z: position.z + Math.sin(angle) * radius,
        duration: 1,
        ease: 'power2.out',
        onComplete: () => {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      });

      gsap.to(particle.material, {
        opacity: 0,
        duration: 1,
        ease: 'none'
      });

      gsap.to(particle.scale, {
        x: 1.5,
        y: 1.5,
        z: 1.5,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  }

  onCanvasClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check if clicking on a plant
    const plantObjects = Array.from(this.plantMeshes.values());
    const intersects = this.raycaster.intersectObjects(plantObjects, true);

    if (intersects.length > 0) {
      // Clicked on a plant
      const clickedPlant = intersects[0].object;
      let plantGroup = clickedPlant;

      // Find the root group
      while (plantGroup.parent && !plantGroup.userData.plantId) {
        plantGroup = plantGroup.parent;
      }

      if (plantGroup.userData.plantId) {
        this.handlePlantClick(plantGroup.userData.plantId);
        return;
      }
    }

    // If not clicking on a plant, handle ground interaction
    if (this.selectedAction === 'plant') {
      const groundY = -2.5;
      const ray = this.raycaster.ray;
      const t = (groundY - ray.origin.y) / ray.direction.y;

      if (t > 0) {
        const intersectPoint = new THREE.Vector3();
        intersectPoint.copy(ray.origin).addScaledVector(ray.direction, t);

        // Plant seed using simulator
        const result = this.simulator.plantSeed(intersectPoint);

        if (result.success) {
          // Add rare plant genetics
          result.plant.genetics = this.generateRarePlant(result.plant.genetics);

          // Track stats
          this.gardenStats.totalPlantsGrown++;
          this.gardenStats.colorsDiscovered.add(result.plant.genetics.colors.expressed);

          // Update rarest plant
          if (result.plant.genetics.rarityLevel > 0) {
            const currentRarityLevel = this.getRarityLevel(this.gardenStats.rarestPlantDiscovered);
            if (result.plant.genetics.rarityLevel > currentRarityLevel) {
              this.gardenStats.rarestPlantDiscovered = result.plant.genetics.rarity;
              this.playSpecialSound('rare');
              this.showInfo(`✨ Discovered a ${result.plant.genetics.rarity.toUpperCase()} plant! ✨`, 3000);
            }
          }

          // Save stats
          this.saveAchievementsAndStats();

          this.createPlantingBurst(intersectPoint);
          this.playGrowthSound(0.9);
          this.createPlantMesh(result.plant);

          // Show floating XP
          this.showFloatingXP(5, intersectPoint);

          this.updateUI();
          this.showInfo('Seed planted!');

          // Check achievements
          this.checkAchievement('first_plant');
          this.checkAchievement('100_plants');
          this.checkAchievement('all_colors');
        } else {
          this.showInfo(result.message, 2000, true);
        }
      }
    }
  }

  onMouseMove(event) {
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check if hovering over a plant
    const plantObjects = Array.from(this.plantMeshes.values());
    const intersects = this.raycaster.intersectObjects(plantObjects, true);

    if (intersects.length > 0) {
      const plantGroup = intersects[0].object.parent;
      const plantId = plantGroup.userData.plantId;
      const plant = this.simulator.plants.find(p => p.id === plantId);

      if (plant && plantId !== this.hoveredPlant) {
        this.hoveredPlant = plantId;

        // Add subtle hover glow
        if (!plantGroup.userData.hoverGlow) {
          const glowGeo = new THREE.SphereGeometry(1.5, 16, 16);
          const glowMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending
          });
          const glow = new THREE.Mesh(glowGeo, glowMat);
          plantGroup.add(glow);
          plantGroup.userData.hoverGlow = glow;
        }

        // Show tooltip
        this.showPlantTooltip(plant, event.clientX, event.clientY);

        // Change cursor
        canvas.style.cursor = 'pointer';
      }
    } else {
      // Not hovering over any plant
      if (this.hoveredPlant) {
        const plantMesh = this.plantMeshes.get(this.hoveredPlant);
        if (plantMesh && plantMesh.userData.hoverGlow) {
          plantMesh.remove(plantMesh.userData.hoverGlow);
          plantMesh.userData.hoverGlow.geometry.dispose();
          plantMesh.userData.hoverGlow.material.dispose();
          plantMesh.userData.hoverGlow = null;
        }
        this.hoveredPlant = null;
        this.removePlantTooltip();

        // Reset cursor based on action
        const cursors = {
          plant: 'crosshair',
          water: 'default',
          fertilize: 'default',
          harvest: 'default',
          crossbreed: 'default'
        };
        canvas.style.cursor = cursors[this.selectedAction] || 'default';
      }
    }
  }

  handlePlantClick(plantId) {
    const plant = this.simulator.plants.find(p => p.id === plantId);
    if (!plant) return;

    switch (this.selectedAction) {
      case 'water':
        this.waterPlant(plantId);
        break;

      case 'fertilize':
        this.fertilizePlant(plantId);
        break;

      case 'harvest':
        this.harvestPlant(plantId);
        break;

      case 'crossbreed':
        this.selectPlantForBreeding(plantId);
        break;

      default:
        // Just show plant info
        this.showPlantInfo(plant);
        break;
    }
  }

  waterPlant(plantId) {
    const mesh = this.plantMeshes.get(plantId);
    const result = this.simulator.waterPlant(plantId);

    if (result.success) {
      this.createWaterParticles(plantId);
      this.playGrowthSound(1.2);

      // Show floating XP
      if (mesh) {
        this.showFloatingXP(2, mesh.position);
      }

      this.updateUI();
      this.showInfo('Plant watered!');
    } else {
      this.showInfo(result.message, 2000, true);
    }
  }

  fertilizePlant(plantId) {
    const mesh = this.plantMeshes.get(plantId);
    const result = this.simulator.fertilizePlant(plantId);

    if (result.success) {
      this.createFertilizerParticles(plantId);
      this.playGrowthSound(1.3);

      // Show floating XP
      if (mesh) {
        this.showFloatingXP(3, mesh.position);
      }

      this.updateUI();
      this.showInfo('Plant fertilized!');
    } else {
      this.showInfo(result.message, 2000, true);
    }
  }

  harvestPlant(plantId) {
    const mesh = this.plantMeshes.get(plantId);
    const plant = this.simulator.plants.find(p => p.id === plantId);
    const result = this.simulator.harvestPlant(plantId);

    if (result.success) {
      // Show floating XP before removing
      if (mesh && result.rewards) {
        this.showFloatingXP(result.rewards.xp, mesh.position);
      }

      this.removePlantMesh(plantId);
      this.playGrowthSound(1.5);
      this.updateUI();
      this.showInfo(result.message);
    } else {
      this.showInfo(result.message, 2000, true);
    }
  }

  selectPlantForBreeding(plantId) {
    const plant = this.simulator.plants.find(p => p.id === plantId);
    if (!plant) return;

    if (plant.stage < GrowthStages.MATURE) {
      this.showInfo('Plant must be mature to breed!', 2000, true);
      return;
    }

    if (this.selectedPlants.includes(plantId)) {
      // Deselect
      this.selectedPlants = this.selectedPlants.filter(id => id !== plantId);
      this.updatePlantSelection(plantId, false);
      return;
    }

    if (this.selectedPlants.length >= 2) {
      this.showInfo('Can only select 2 plants!', 2000, true);
      return;
    }

    this.selectedPlants.push(plantId);
    this.updatePlantSelection(plantId, true);

    if (this.selectedPlants.length === 2) {
      // Perform crossbreeding
      const result = this.simulator.crossBreed(this.selectedPlants[0], this.selectedPlants[1]);

      if (result.success) {
        // Track breeding stats
        this.gardenStats.breedsCreated++;
        this.saveAchievementsAndStats();

        this.createBreedingEffect(this.selectedPlants[0], this.selectedPlants[1]);
        this.playGrowthSound(1.8);

        // Show big floating XP for breeding
        const mesh1 = this.plantMeshes.get(this.selectedPlants[0]);
        if (mesh1) {
          this.showFloatingXP(30, mesh1.position);
        }

        this.updateUI();
        this.showInfo(result.message);

        // Check breeding achievements
        this.checkAchievement('first_breed');
        this.checkAchievement('10_breeds');

        // Clear selection
        this.selectedPlants.forEach(id => this.updatePlantSelection(id, false));
        this.selectedPlants = [];
      } else {
        this.showInfo(result.message, 2000, true);
        this.selectedPlants.forEach(id => this.updatePlantSelection(id, false));
        this.selectedPlants = [];
      }
    } else {
      this.showInfo('Select another plant to breed...');
    }
  }

  showPlantInfo(plant) {
    const stageNames = ['Seed', 'Sprout', 'Small', 'Medium', 'Mature'];
    const stageName = stageNames[plant.stage];
    const color = plant.genetics.colors.expressed;
    const size = plant.genetics.sizes.expressed;

    this.showInfo(`${size} ${color} ${stageName}`, 3000);
  }

  updatePlantSelection(plantId, selected) {
    const mesh = this.plantMeshes.get(plantId);
    if (!mesh) return;

    if (selected) {
      // Add bright glowing ring
      if (!mesh.userData.selectionGlow) {
        // Ring geometry
        const ringGeo = new THREE.TorusGeometry(1.3, 0.15, 16, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -0.5;
        mesh.add(ring);
        mesh.userData.selectionGlow = ring;

        // Pulse animation - more visible
        gsap.to(ring.scale, {
          x: 1.2,
          y: 1.2,
          z: 1.2,
          duration: 0.6,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1
        });

        // Pulse opacity too
        gsap.to(ringMat, {
          opacity: 0.4,
          duration: 0.6,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1
        });

        // Add selection number indicator (1/2 or 2/2)
        const selectionIndex = this.selectedPlants.indexOf(plantId) + 1;
        this.addSelectionIndicator(mesh, selectionIndex);
      }
    } else {
      // Remove selection indicator
      if (mesh.userData.selectionGlow) {
        gsap.killTweensOf(mesh.userData.selectionGlow.scale);
        gsap.killTweensOf(mesh.userData.selectionGlow.material);
        mesh.remove(mesh.userData.selectionGlow);
        mesh.userData.selectionGlow.geometry.dispose();
        mesh.userData.selectionGlow.material.dispose();
        mesh.userData.selectionGlow = null;
      }

      // Remove number indicator
      if (mesh.userData.selectionIndicator) {
        mesh.remove(mesh.userData.selectionIndicator);
        mesh.userData.selectionIndicator.geometry.dispose();
        mesh.userData.selectionIndicator.material.dispose();
        mesh.userData.selectionIndicator = null;
      }
    }
  }

  /**
   * Add selection number indicator (1/2 or 2/2)
   */
  addSelectionIndicator(mesh, number) {
    if (mesh.userData.selectionIndicator) {
      mesh.remove(mesh.userData.selectionIndicator);
      mesh.userData.selectionIndicator.geometry.dispose();
      mesh.userData.selectionIndicator.material.dispose();
    }

    // Create a simple sprite with number
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Draw background circle
    ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();

    // Draw number
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${number}/2`, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1, 1, 1);
    sprite.position.set(0, 2, 0);

    mesh.add(sprite);
    mesh.userData.selectionIndicator = sprite;
  }

  createPlantingBurst(position) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.08, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0x8b6914,
        transparent: true,
        opacity: 0.9
      });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      particle.position.y = -2.3;

      this.scene.add(particle);

      const angle = (i / count) * Math.PI * 2;
      const dist = 0.6 + Math.random() * 0.4;

      gsap.to(particle.position, {
        x: position.x + Math.cos(angle) * dist,
        z: position.z + Math.sin(angle) * dist,
        y: -2,
        duration: 0.4,
        ease: 'power2.out'
      });

      gsap.to(particle.material, {
        opacity: 0,
        duration: 0.4,
        onComplete: () => {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      });
    }
  }

  createWaterParticles(plantId) {
    const mesh = this.plantMeshes.get(plantId);
    if (!mesh) return;

    const position = mesh.position.clone();
    const count = 20;

    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.06, 6, 6);
      const material = new THREE.MeshBasicMaterial({
        color: 0x4A9FD8,
        transparent: true,
        opacity: 0.8
      });
      const particle = new THREE.Mesh(geometry, material);

      particle.position.copy(position);
      particle.position.y += 2 + Math.random();

      this.scene.add(particle);

      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.5;

      gsap.to(particle.position, {
        x: position.x + Math.cos(angle) * radius,
        y: position.y - 0.5,
        z: position.z + Math.sin(angle) * radius,
        duration: (600 + Math.random() * 400) / 1000,
        ease: 'power2.in',
        onComplete: () => {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      });

      gsap.to(particle.material, {
        opacity: 0,
        duration: 0.6,
        ease: 'none'
      });
    }

    // Ripple effect
    this.createRippleEffect(position);
  }

  createFertilizerParticles(plantId) {
    const mesh = this.plantMeshes.get(plantId);
    if (!mesh) return;

    const position = mesh.position.clone();
    const count = 15;

    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 6, 6);
      const material = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 0.9
      });
      const particle = new THREE.Mesh(geometry, material);

      particle.position.copy(position);
      particle.position.y += Math.random() * 0.5;

      this.scene.add(particle);

      const angle = Math.random() * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.4;

      gsap.to(particle.position, {
        x: position.x + Math.cos(angle) * radius,
        y: position.y + 1 + Math.random() * 0.5,
        z: position.z + Math.sin(angle) * radius,
        duration: (800 + Math.random() * 400) / 1000,
        ease: 'power2.out',
        onComplete: () => {
          // Sparkle at the end
          gsap.to(particle.scale, {
            x: 2,
            y: 2,
            z: 2,
            duration: 0.2,
            ease: 'power2.out',
            onComplete: () => {
              this.scene.remove(particle);
              geometry.dispose();
              material.dispose();
            }
          });
        }
      });

      gsap.to(particle.material, {
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: 'none'
      });
    }
  }

  createRippleEffect(position) {
    const rippleGeo = new THREE.RingGeometry(0.1, 0.2, 32);
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0x4A9FD8,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const ripple = new THREE.Mesh(rippleGeo, rippleMat);
    ripple.position.copy(position);
    ripple.position.y = -2.4;
    ripple.rotation.x = -Math.PI / 2;

    this.scene.add(ripple);

    gsap.to(ripple.scale, {
      x: 5,
      y: 5,
      z: 5,
      duration: 1,
      ease: 'power2.out'
    });

    gsap.to(rippleMat, {
      opacity: 0,
      duration: 1,
      ease: 'none',
      onComplete: () => {
        this.scene.remove(ripple);
        rippleGeo.dispose();
        rippleMat.dispose();
      }
    });
  }

  createBreedingEffect(plantId1, plantId2) {
    const mesh1 = this.plantMeshes.get(plantId1);
    const mesh2 = this.plantMeshes.get(plantId2);
    if (!mesh1 || !mesh2) return;

    const pos1 = mesh1.position.clone();
    const pos2 = mesh2.position.clone();
    const midpoint = new THREE.Vector3().lerpVectors(pos1, pos2, 0.5);
    midpoint.y += 2;

    // Create heart particles
    const count = 10;
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xFF69B4,
        transparent: true,
        opacity: 0.9
      });
      const particle = new THREE.Mesh(geometry, material);

      particle.position.copy(midpoint);

      this.scene.add(particle);

      const angle = (i / count) * Math.PI * 2;
      const radius = 1;

      gsap.to(particle.position, {
        x: midpoint.x + Math.cos(angle) * radius,
        y: midpoint.y + 1,
        z: midpoint.z + Math.sin(angle) * radius,
        duration: 1,
        ease: 'power2.out',
        onComplete: () => {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      });

      gsap.to(particle.material, {
        opacity: 0,
        duration: 1,
        ease: 'none'
      });
    }
  }

  createPlantMesh(plant) {
    const plantGroup = new THREE.Group();
    plantGroup.position.copy(plant.position);
    plantGroup.position.y = -2.3;
    plantGroup.userData.plantId = plant.id;

    // Get color from genetics
    const color = this.simulator.getPlantColor(plant);
    const scale = this.simulator.getPlantScale(plant);

    // Create plant based on stage
    this.updatePlantGeometry(plantGroup, plant, color);

    // Initial scale based on stage
    plantGroup.scale.setScalar(scale);

    this.scene.add(plantGroup);
    this.plantMeshes.set(plant.id, plantGroup);

    // Grow animation when first created
    if (plant.stage === GrowthStages.SEED) {
      plantGroup.scale.setScalar(0);
      gsap.to(plantGroup.scale, {
        x: scale,
        y: scale,
        z: scale,
        duration: 1,
        ease: 'elastic.out(1, 0.5)'
      });
    }

    // Gentle sway animation
    gsap.to(plantGroup.rotation, {
      z: (Math.random() - 0.5) * 0.1,
      duration: (2000 + Math.random() * 2000) / 1000,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    // Add rare plant effects
    if (plant.genetics.rarity && plant.genetics.rarity !== 'common') {
      this.addRarePlantEffects(plantGroup, plant);
    }

    return plantGroup;
  }

  /**
   * Add special visual effects for rare plants
   */
  addRarePlantEffects(plantGroup, plant) {
    const rarity = plant.genetics.rarity;

    switch (rarity) {
      case 'shimmering':
        // Subtle glow pulse
        const shimmerGeo = new THREE.SphereGeometry(1.2, 16, 16);
        const shimmerMat = new THREE.MeshBasicMaterial({
          color: 0x87ceeb,
          transparent: true,
          opacity: 0.2,
          blending: THREE.AdditiveBlending
        });
        const shimmer = new THREE.Mesh(shimmerGeo, shimmerMat);
        plantGroup.add(shimmer);
        plantGroup.userData.rarityEffect = shimmer;

        gsap.to(shimmerMat, {
          opacity: 0.05,
          duration: 2,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut'
        });
        break;

      case 'golden':
        // Gold glow with sparkle particles
        const goldenGeo = new THREE.SphereGeometry(1.3, 16, 16);
        const goldenMat = new THREE.MeshBasicMaterial({
          color: 0xffd700,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending
        });
        const golden = new THREE.Mesh(goldenGeo, goldenMat);
        plantGroup.add(golden);
        plantGroup.userData.rarityEffect = golden;

        gsap.to(goldenMat, {
          opacity: 0.1,
          duration: 1.5,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut'
        });

        // Add sparkle particles
        this.createGoldenSparkles(plantGroup);
        break;

      case 'rainbow':
        // Rainbow cycling glow with spectacular particles
        const rainbowGeo = new THREE.SphereGeometry(1.5, 16, 16);
        const rainbowMat = new THREE.MeshBasicMaterial({
          color: 0xff00ff,
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending
        });
        const rainbow = new THREE.Mesh(rainbowGeo, rainbowMat);
        plantGroup.add(rainbow);
        plantGroup.userData.rarityEffect = rainbow;

        // Animate rainbow color cycling
        const animateRainbow = () => {
          const hue = (Date.now() % 3000) / 3000;
          rainbowMat.color.setHSL(hue, 1, 0.5);
          if (plantGroup.parent) {
            requestAnimationFrame(animateRainbow);
          }
        };
        animateRainbow();

        // Add rainbow sparkles
        this.createRainbowSparkles(plantGroup);
        break;
    }
  }

  /**
   * Create golden sparkle particles
   */
  createGoldenSparkles(plantGroup) {
    const count = 8;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 0.8 + Math.random() * 0.4;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 1.5 + 0.5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 0.1,
      color: 0xffd700,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const sparkles = new THREE.Points(geometry, material);
    plantGroup.add(sparkles);
    plantGroup.userData.sparkles = sparkles;

    // Animate sparkles
    gsap.to(sparkles.rotation, {
      y: Math.PI * 2,
      duration: 4,
      repeat: -1,
      ease: 'none'
    });
  }

  /**
   * Create rainbow sparkle particles
   */
  createRainbowSparkles(plantGroup) {
    const count = 12;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 1 + Math.random() * 0.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 2;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        uniform float time;
        varying vec3 vColor;
        void main() {
          vColor = vec3(
            sin(time + position.x) * 0.5 + 0.5,
            sin(time + position.y + 2.0) * 0.5 + 0.5,
            sin(time + position.z + 4.0) * 0.5 + 0.5
          );
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 150.0 / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = smoothstep(0.5, 0.0, dist);
          gl_FragColor = vec4(vColor, alpha * 0.8);
        }
      `
    });

    const sparkles = new THREE.Points(geometry, material);
    plantGroup.add(sparkles);
    plantGroup.userData.sparkles = sparkles;

    // Update time uniform
    const updateSparkles = () => {
      material.uniforms.time.value = Date.now() * 0.001;
      if (plantGroup.parent) {
        requestAnimationFrame(updateSparkles);
      }
    };
    updateSparkles();

    // Rotate sparkles
    gsap.to(sparkles.rotation, {
      y: Math.PI * 2,
      duration: 6,
      repeat: -1,
      ease: 'none'
    });
  }

  /**
   * =============================================================================
   * ULTIMATE PROCEDURAL PLANT GENERATION SYSTEM
   * =============================================================================
   * Generates unique plants based on DNA with different types, patterns, and effects
   */

  /**
   * Generate plant DNA for a specific type
   */
  generatePlantDNA(type, specialSeed = null) {
    const dna = {
      type: type || this.PlantTypes.FLOWER,
      specialSeed: specialSeed
    };

    // Type-specific DNA generation
    switch (dna.type) {
      case this.PlantTypes.TREE:
        dna.trunkThickness = 0.2 + Math.random() * 0.3;
        dna.trunkHeight = 4 + Math.random() * 3;
        dna.branchCount = 4 + Math.floor(Math.random() * 8);
        dna.leafDensity = 10 + Math.floor(Math.random() * 25);
        dna.leafShape = ['round', 'pointed', 'oval'][Math.floor(Math.random() * 3)];
        dna.hasFruit = Math.random() > 0.5;
        dna.fruitType = ['apple', 'cherry', 'none'][Math.floor(Math.random() * 3)];
        dna.colors = {
          trunk: 0x8B4513,
          leaves: new THREE.Color().setHSL(0.28 + Math.random() * 0.15, 0.6, 0.35),
          fruit: new THREE.Color().setHSL(Math.random(), 0.8, 0.5)
        };
        break;

      case this.PlantTypes.VEGETABLE:
        dna.shape = ['round', 'elongated', 'clustered'][Math.floor(Math.random() * 3)];
        dna.groundLevel = true;
        dna.size = 0.3 + Math.random() * 0.5;
        dna.leafCount = 2 + Math.floor(Math.random() * 4);
        dna.colors = {
          main: new THREE.Color().setHSL(Math.random() * 0.15, 0.7, 0.45),
          leaves: new THREE.Color().setHSL(0.3, 0.6, 0.35)
        };
        break;

      case this.PlantTypes.MUSHROOM:
        dna.capShape = ['dome', 'flat', 'cone'][Math.floor(Math.random() * 3)];
        dna.capSize = 0.3 + Math.random() * 0.4;
        dna.stemHeight = 0.2 + Math.random() * 0.5;
        dna.glowAtNight = Math.random() > 0.3; // 70% chance to glow!
        dna.spotCount = Math.floor(Math.random() * 8);
        dna.colors = {
          cap: new THREE.Color().setHSL(Math.random(), 0.6, 0.5),
          stem: new THREE.Color().setHSL(0.1, 0.2, 0.85),
          glow: new THREE.Color().setHSL(0.4 + Math.random() * 0.2, 1, 0.6)
        };
        break;

      case this.PlantTypes.CACTUS:
        dna.height = 2 + Math.random() * 4;
        dna.segments = 3 + Math.floor(Math.random() * 5);
        dna.armCount = Math.floor(Math.random() * 4);
        dna.spikeCount = 20 + Math.floor(Math.random() * 40);
        dna.flowerOnTop = Math.random() > 0.7;
        dna.colors = {
          body: new THREE.Color().setHSL(0.25, 0.5, 0.4),
          spikes: 0xE0E0E0,
          flower: new THREE.Color().setHSL(Math.random(), 1, 0.6)
        };
        break;

      case this.PlantTypes.FRUIT:
        dna.bushHeight = 1.5 + Math.random() * 1.5;
        dna.branchCount = 3 + Math.floor(Math.random() * 5);
        dna.fruitCount = 5 + Math.floor(Math.random() * 15);
        dna.fruitShape = ['sphere', 'berry'][Math.floor(Math.random() * 2)];
        dna.colors = {
          branches: 0x6B4423,
          leaves: new THREE.Color().setHSL(0.3, 0.6, 0.4),
          fruit: new THREE.Color().setHSL(Math.random() * 0.1, 0.8, 0.5)
        };
        break;

      case this.PlantTypes.VINE:
        dna.length = 2 + Math.random() * 3;
        dna.curliness = 0.3 + Math.random() * 0.7;
        dna.leafSpacing = 0.3 + Math.random() * 0.4;
        dna.flowerCount = Math.floor(Math.random() * 8);
        dna.colors = {
          vine: new THREE.Color().setHSL(0.3, 0.5, 0.35),
          leaves: new THREE.Color().setHSL(0.28, 0.6, 0.4),
          flowers: new THREE.Color().setHSL(Math.random(), 0.8, 0.6)
        };
        break;

      default: // FLOWER
        dna.petalCount = 5 + Math.floor(Math.random() * 4);
        dna.petalShape = ['round', 'pointed', 'heart'][Math.floor(Math.random() * 3)];
        dna.centerSize = 0.1 + Math.random() * 0.1;
        dna.stemHeight = 0.4 + Math.random() * 0.3;
        dna.colors = {
          petals: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
          center: 0xFFD700
        };
    }

    // Apply special seed modifiers
    if (specialSeed) {
      switch (specialSeed) {
        case 'rapidGrowth':
          dna.growthModifier = 3.0;
          break;
        case 'giant':
          dna.sizeModifier = 2.0;
          break;
        case 'miniature':
          dna.sizeModifier = 0.3;
          break;
        case 'rainbow':
          dna.rainbowMode = true;
          break;
        case 'ancient':
          dna.ancient = true;
          // Ancient plants have special extinct features
          dna.glowIntensity = 0.5;
          break;
        case 'hybrid':
          // Combine two random types
          const types = Object.values(this.PlantTypes);
          const type2 = types[Math.floor(Math.random() * types.length)];
          dna.hybridType = type2;
          break;
      }
    }

    // Enhanced genetics
    dna.growthSpeed = ['fast', 'normal', 'slow'][Math.floor(Math.random() * 3)];
    dna.size = ['tiny', 'small', 'medium', 'large', 'giant'][Math.floor(Math.random() * 5)];
    dna.glow = ['none', 'faint', 'bright'][Math.floor(Math.random() * 3)];
    dna.pattern = ['solid', 'striped', 'spotted', 'gradient'][Math.floor(Math.random() * 4)];

    // Track genetics
    this.geneticsDatabase.growthSpeed.add(dna.growthSpeed);
    this.geneticsDatabase.sizes.add(dna.size);
    this.geneticsDatabase.glows.add(dna.glow);
    this.geneticsDatabase.patterns.add(dna.pattern);

    return dna;
  }

  /**
   * Generate geometry based on plant DNA
   */
  generatePlantFromDNA(plantGroup, dna, stage, color) {
    const threeColor = new THREE.Color(color);
    const sizeMultiplier = dna.sizeModifier || 1.0;

    switch (dna.type) {
      case this.PlantTypes.TREE:
        this.generateTreeGeometry(plantGroup, dna, stage, sizeMultiplier);
        break;
      case this.PlantTypes.VEGETABLE:
        this.generateVegetableGeometry(plantGroup, dna, stage, sizeMultiplier);
        break;
      case this.PlantTypes.MUSHROOM:
        this.generateMushroomGeometry(plantGroup, dna, stage, sizeMultiplier);
        break;
      case this.PlantTypes.CACTUS:
        this.generateCactusGeometry(plantGroup, dna, stage, sizeMultiplier);
        break;
      case this.PlantTypes.FRUIT:
        this.generateFruitBushGeometry(plantGroup, dna, stage, sizeMultiplier);
        break;
      case this.PlantTypes.VINE:
        this.generateVineGeometry(plantGroup, dna, stage, sizeMultiplier);
        break;
      default:
        this.generateFlowerGeometry(plantGroup, dna, stage, threeColor, sizeMultiplier);
    }

    // Add rainbow effect if rainbow seed
    if (dna.rainbowMode) {
      this.addRainbowEffect(plantGroup);
    }

    // Add glow based on genetics
    if (dna.glow === 'faint' || dna.glow === 'bright') {
      this.addGeneticGlow(plantGroup, dna.glow);
    }
  }

  generateTreeGeometry(group, dna, stage, sizeMultiplier) {
    if (stage < GrowthStages.SMALL) {
      // Seedling
      const saplingGeo = new THREE.ConeGeometry(0.05, 0.3, 8);
      const saplingMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
      const sapling = new THREE.Mesh(saplingGeo, saplingMat);
      sapling.position.y = 0.15;
      group.add(sapling);
      return;
    }

    const heightScale = stage === GrowthStages.MATURE ? 1 : 0.6;

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(
      dna.trunkThickness * 0.8,
      dna.trunkThickness,
      dna.trunkHeight * heightScale * sizeMultiplier,
      8
    );
    const trunkMat = new THREE.MeshStandardMaterial({
      color: dna.colors.trunk,
      roughness: 0.9
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = dna.trunkHeight * heightScale * sizeMultiplier / 2;
    group.add(trunk);

    if (stage >= GrowthStages.MEDIUM) {
      // Branches and leaves
      const branchCount = stage === GrowthStages.MATURE ? dna.branchCount : Math.floor(dna.branchCount / 2);
      const topY = dna.trunkHeight * heightScale * sizeMultiplier;

      for (let i = 0; i < branchCount; i++) {
        const angle = (i / branchCount) * Math.PI * 2;
        const heightOffset = Math.random() * topY * 0.4 + topY * 0.5;

        // Branch
        const branchGeo = new THREE.CylinderGeometry(0.05, 0.08, 0.8 * sizeMultiplier, 6);
        const branchMat = new THREE.MeshStandardMaterial({ color: dna.colors.trunk });
        const branch = new THREE.Mesh(branchGeo, branchMat);
        branch.position.set(
          Math.cos(angle) * 0.3,
          heightOffset,
          Math.sin(angle) * 0.3
        );
        branch.rotation.z = angle + Math.PI / 2;
        branch.rotation.x = 0.5;
        group.add(branch);

        // Leaves on branch
        for (let j = 0; j < Math.floor(dna.leafDensity / branchCount); j++) {
          const leafGeo = new THREE.SphereGeometry(0.15 * sizeMultiplier, 8, 8);
          const leafMat = new THREE.MeshStandardMaterial({
            color: dna.colors.leaves,
            roughness: 0.8
          });
          const leaf = new THREE.Mesh(leafGeo, leafMat);
          leaf.position.set(
            Math.cos(angle) * (0.3 + j * 0.15),
            heightOffset + Math.random() * 0.2,
            Math.sin(angle) * (0.3 + j * 0.15)
          );
          group.add(leaf);

          // Fruits on mature trees
          if (stage === GrowthStages.MATURE && dna.hasFruit && Math.random() > 0.7) {
            const fruitGeo = new THREE.SphereGeometry(0.08 * sizeMultiplier, 8, 8);
            const fruitMat = new THREE.MeshStandardMaterial({ color: dna.colors.fruit });
            const fruit = new THREE.Mesh(fruitGeo, fruitMat);
            fruit.position.copy(leaf.position);
            fruit.position.y -= 0.1;
            group.add(fruit);
          }
        }
      }
    }
  }

  generateMushroomGeometry(group, dna, stage, sizeMultiplier) {
    const growthScale = [0.3, 0.5, 0.7, 0.9, 1.0][stage] * sizeMultiplier;

    // Stem
    const stemGeo = new THREE.CylinderGeometry(
      0.08 * growthScale,
      0.1 * growthScale,
      dna.stemHeight * growthScale,
      12
    );
    const stemMat = new THREE.MeshStandardMaterial({
      color: dna.colors.stem,
      roughness: 0.7
    });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = dna.stemHeight * growthScale / 2;
    group.add(stem);

    if (stage >= GrowthStages.SMALL) {
      // Cap
      let capGeo;
      switch (dna.capShape) {
        case 'flat':
          capGeo = new THREE.CylinderGeometry(dna.capSize * growthScale, dna.capSize * growthScale * 0.8, 0.1, 16);
          break;
        case 'cone':
          capGeo = new THREE.ConeGeometry(dna.capSize * growthScale, dna.capSize * growthScale, 16);
          break;
        default: // dome
          capGeo = new THREE.SphereGeometry(dna.capSize * growthScale, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      }

      const capMat = new THREE.MeshStandardMaterial({
        color: dna.colors.cap,
        roughness: 0.6,
        emissive: dna.glowAtNight ? dna.colors.glow : 0x000000,
        emissiveIntensity: dna.glowAtNight ? 0.3 : 0
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = dna.stemHeight * growthScale + (dna.capShape === 'dome' ? 0 : dna.capSize * growthScale * 0.5);
      group.add(cap);

      // Spots on cap
      for (let i = 0; i < dna.spotCount; i++) {
        const spotGeo = new THREE.SphereGeometry(0.05 * growthScale, 8, 8);
        const spotMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.8 });
        const spot = new THREE.Mesh(spotGeo, spotMat);
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * dna.capSize * 0.7 * growthScale;
        spot.position.set(
          Math.cos(angle) * radius,
          cap.position.y + 0.05,
          Math.sin(angle) * radius
        );
        group.add(spot);
      }
    }
  }

  generateCactusGeometry(group, dna, stage, sizeMultiplier) {
    const heightScale = [0.2, 0.4, 0.6, 0.8, 1.0][stage] * sizeMultiplier;
    const segmentHeight = (dna.height / dna.segments) * heightScale;

    // Main body segments
    for (let i = 0; i < dna.segments; i++) {
      const segmentGeo = new THREE.CylinderGeometry(0.3, 0.35, segmentHeight, 8);
      const segmentMat = new THREE.MeshStandardMaterial({
        color: dna.colors.body,
        roughness: 0.9
      });
      const segment = new THREE.Mesh(segmentGeo, segmentMat);
      segment.position.y = i * segmentHeight + segmentHeight / 2;
      group.add(segment);

      // Ribs (vertical lines)
      for (let j = 0; j < 8; j++) {
        const angle = (j / 8) * Math.PI * 2;
        const ribGeo = new THREE.BoxGeometry(0.02, segmentHeight, 0.02);
        const ribMat = new THREE.MeshStandardMaterial({ color: 0x5A7D3A });
        const rib = new THREE.Mesh(ribGeo, ribMat);
        rib.position.set(
          Math.cos(angle) * 0.35,
          segment.position.y,
          Math.sin(angle) * 0.35
        );
        group.add(rib);
      }
    }

    // Arms (on mature cacti)
    if (stage >= GrowthStages.MEDIUM) {
      for (let i = 0; i < dna.armCount; i++) {
        const angle = (i / Math.max(dna.armCount, 1)) * Math.PI * 2;
        const armHeight = dna.height * 0.4 * heightScale;
        const armGeo = new THREE.CylinderGeometry(0.2, 0.25, armHeight, 8);
        const armMat = new THREE.MeshStandardMaterial({ color: dna.colors.body });
        const arm = new THREE.Mesh(armGeo, armMat);
        arm.position.set(
          Math.cos(angle) * 0.4,
          dna.height * 0.5 * heightScale,
          Math.sin(angle) * 0.4
        );
        arm.rotation.z = Math.PI / 3;
        group.add(arm);
      }
    }

    // Flower on top (mature only)
    if (stage === GrowthStages.MATURE && dna.flowerOnTop) {
      const flowerGeo = new THREE.SphereGeometry(0.15, 12, 12);
      const flowerMat = new THREE.MeshStandardMaterial({
        color: dna.colors.flower,
        emissive: dna.colors.flower,
        emissiveIntensity: 0.3
      });
      const flower = new THREE.Mesh(flowerGeo, flowerMat);
      flower.position.y = dna.height * heightScale;
      group.add(flower);
    }
  }

  generateVegetableGeometry(group, dna, stage, sizeMultiplier) {
    const growthScale = [0.3, 0.5, 0.7, 0.9, 1.0][stage] * sizeMultiplier;

    // Main vegetable body
    let bodyGeo;
    switch (dna.shape) {
      case 'elongated':
        bodyGeo = new THREE.CylinderGeometry(
          dna.size * 0.5 * growthScale,
          dna.size * 0.6 * growthScale,
          dna.size * 2 * growthScale,
          12
        );
        break;
      case 'clustered':
        bodyGeo = new THREE.SphereGeometry(dna.size * growthScale, 12, 12);
        break;
      default: // round
        bodyGeo = new THREE.SphereGeometry(dna.size * growthScale, 16, 16);
    }

    const bodyMat = new THREE.MeshStandardMaterial({
      color: dna.colors.main,
      roughness: 0.7
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = dna.size * growthScale * 0.5;
    group.add(body);

    // Leaves
    if (stage >= GrowthStages.SMALL) {
      for (let i = 0; i < dna.leafCount; i++) {
        const angle = (i / dna.leafCount) * Math.PI * 2;
        const leafGeo = new THREE.PlaneGeometry(0.3 * growthScale, 0.4 * growthScale);
        const leafMat = new THREE.MeshStandardMaterial({
          color: dna.colors.leaves,
          side: THREE.DoubleSide,
          roughness: 0.8
        });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(
          Math.cos(angle) * dna.size * growthScale * 0.8,
          dna.size * growthScale,
          Math.sin(angle) * dna.size * growthScale * 0.8
        );
        leaf.rotation.y = -angle;
        leaf.rotation.x = -0.5;
        group.add(leaf);
      }
    }
  }

  generateFruitBushGeometry(group, dna, stage, sizeMultiplier) {
    const heightScale = [0.3, 0.5, 0.7, 0.9, 1.0][stage] * sizeMultiplier;

    // Main branches
    for (let i = 0; i < dna.branchCount; i++) {
      const angle = (i / dna.branchCount) * Math.PI * 2;
      const branchGeo = new THREE.CylinderGeometry(0.05, 0.08, dna.bushHeight * heightScale, 6);
      const branchMat = new THREE.MeshStandardMaterial({ color: dna.colors.branches });
      const branch = new THREE.Mesh(branchGeo, branchMat);
      branch.position.set(
        Math.cos(angle) * 0.2,
        dna.bushHeight * heightScale / 2,
        Math.sin(angle) * 0.2
      );
      branch.rotation.z = 0.3;
      group.add(branch);

      // Leaves
      if (stage >= GrowthStages.SMALL) {
        for (let j = 0; j < 5; j++) {
          const leafGeo = new THREE.CircleGeometry(0.1 * heightScale, 8);
          const leafMat = new THREE.MeshStandardMaterial({
            color: dna.colors.leaves,
            side: THREE.DoubleSide
          });
          const leaf = new THREE.Mesh(leafGeo, leafMat);
          leaf.position.set(
            Math.cos(angle) * 0.3 + (Math.random() - 0.5) * 0.2,
            (j / 5) * dna.bushHeight * heightScale,
            Math.sin(angle) * 0.3 + (Math.random() - 0.5) * 0.2
          );
          group.add(leaf);
        }
      }

      // Fruits (mature only)
      if (stage === GrowthStages.MATURE) {
        const fruitsOnBranch = Math.floor(dna.fruitCount / dna.branchCount);
        for (let j = 0; j < fruitsOnBranch; j++) {
          const fruitGeo = new THREE.SphereGeometry(0.08 * heightScale, 8, 8);
          const fruitMat = new THREE.MeshStandardMaterial({
            color: dna.colors.fruit,
            emissive: dna.colors.fruit,
            emissiveIntensity: 0.1
          });
          const fruit = new THREE.Mesh(fruitGeo, fruitMat);
          fruit.position.set(
            Math.cos(angle) * 0.35 + (Math.random() - 0.5) * 0.2,
            Math.random() * dna.bushHeight * heightScale,
            Math.sin(angle) * 0.35 + (Math.random() - 0.5) * 0.2
          );
          group.add(fruit);
        }
      }
    }
  }

  generateVineGeometry(group, dna, stage, sizeMultiplier) {
    const lengthScale = [0.3, 0.5, 0.7, 0.9, 1.0][stage] * sizeMultiplier;
    const segments = 10;

    // Create curving vine
    for (let i = 0; i < segments; i++) {
      const t = i / segments;
      const segmentGeo = new THREE.CylinderGeometry(0.04, 0.05, dna.length * lengthScale / segments, 6);
      const segmentMat = new THREE.MeshStandardMaterial({ color: dna.colors.vine });
      const segment = new THREE.Mesh(segmentGeo, segmentMat);

      // Curving path
      const x = Math.sin(t * Math.PI * dna.curliness) * 0.5;
      const y = t * dna.length * lengthScale;
      const z = Math.cos(t * Math.PI * dna.curliness * 0.7) * 0.3;

      segment.position.set(x, y, z);
      segment.rotation.z = Math.sin(t * Math.PI * dna.curliness) * 0.5;
      group.add(segment);

      // Leaves along vine
      if (stage >= GrowthStages.SMALL && i % 2 === 0) {
        const leafGeo = new THREE.PlaneGeometry(0.15, 0.2);
        const leafMat = new THREE.MeshStandardMaterial({
          color: dna.colors.leaves,
          side: THREE.DoubleSide
        });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(x + 0.1, y, z);
        leaf.rotation.y = t * Math.PI;
        group.add(leaf);
      }

      // Flowers (mature only)
      if (stage === GrowthStages.MATURE && i % 3 === 0 && i < dna.flowerCount * 3) {
        const flowerGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const flowerMat = new THREE.MeshStandardMaterial({
          color: dna.colors.flowers,
          emissive: dna.colors.flowers,
          emissiveIntensity: 0.2
        });
        const flower = new THREE.Mesh(flowerGeo, flowerMat);
        flower.position.set(x + 0.15, y, z);
        group.add(flower);
      }
    }
  }

  generateFlowerGeometry(group, dna, stage, color, sizeMultiplier) {
    // Use existing flower geometry but enhanced with DNA
    const growthScale = sizeMultiplier;

    if (stage === GrowthStages.SEED) {
      const seedGeo = new THREE.SphereGeometry(0.1 * growthScale, 8, 8);
      const seedMat = new THREE.MeshStandardMaterial({ color: 0x8b6914 });
      const seed = new THREE.Mesh(seedGeo, seedMat);
      seed.position.y = 0.05;
      group.add(seed);
    } else if (stage >= GrowthStages.SMALL) {
      // Enhanced petals based on DNA
      const petalCount = dna.petalCount || 6;
      const petalSize = stage === GrowthStages.MATURE ? 0.25 : 0.15;

      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const petalGeo = new THREE.SphereGeometry(petalSize * growthScale, 12, 12);

        switch (dna.petalShape) {
          case 'pointed':
            petalGeo.scale(1.5, 0.3, 0.6);
            break;
          case 'heart':
            petalGeo.scale(1.2, 0.3, 0.8);
            break;
          default:
            petalGeo.scale(1.3, 0.3, 0.8);
        }

        const petalMat = new THREE.MeshStandardMaterial({
          color: color,
          transparent: true,
          opacity: 0.85,
          roughness: 0.7,
          side: THREE.DoubleSide
        });

        const petal = new THREE.Mesh(petalGeo, petalMat);
        petal.position.x = Math.cos(angle) * 0.3 * growthScale;
        petal.position.z = Math.sin(angle) * 0.3 * growthScale;
        petal.position.y = (dna.stemHeight || 0.5) * growthScale;
        petal.rotation.y = -angle;
        petal.rotation.x = Math.PI / 6;
        group.add(petal);
      }

      // Center
      const centerGeo = new THREE.SphereGeometry((dna.centerSize || 0.12) * growthScale, 12, 12);
      const centerMat = new THREE.MeshStandardMaterial({ color: dna.colors.center || 0xFFD700 });
      const center = new THREE.Mesh(centerGeo, centerMat);
      center.position.y = (dna.stemHeight || 0.5) * growthScale;
      group.add(center);

      // Stem
      const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, (dna.stemHeight || 0.5) * growthScale, 6);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = (dna.stemHeight || 0.5) * growthScale / 2;
      group.add(stem);
    }
  }

  addRainbowEffect(plantGroup) {
    // Add animated rainbow glow
    const glowGeo = new THREE.SphereGeometry(1.5, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    plantGroup.add(glow);

    const animateRainbow = () => {
      const hue = (Date.now() % 3000) / 3000;
      glowMat.color.setHSL(hue, 1, 0.5);
      if (plantGroup.parent) {
        requestAnimationFrame(animateRainbow);
      }
    };
    animateRainbow();
  }

  addGeneticGlow(plantGroup, glowType) {
    const intensity = glowType === 'bright' ? 0.5 : 0.2;
    const glowGeo = new THREE.SphereGeometry(1.0, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x87ceeb,
      transparent: true,
      opacity: intensity,
      blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    plantGroup.add(glow);

    gsap.to(glowMat, {
      opacity: intensity * 0.3,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }

  updatePlantGeometry(plantGroup, plant, color) {
    // Clear existing geometry
    while (plantGroup.children.length > 0) {
      const child = plantGroup.children[0];
      plantGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    const threeColor = new THREE.Color(color);

    // Create geometry based on stage
    switch (plant.stage) {
      case GrowthStages.SEED:
        // Small brown sphere
        const seedGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const seedMat = new THREE.MeshStandardMaterial({
          color: 0x8b6914,
          roughness: 0.9
        });
        const seed = new THREE.Mesh(seedGeo, seedMat);
        seed.position.y = 0.05;
        plantGroup.add(seed);
        break;

      case GrowthStages.SPROUT:
        // Small green sprout
        const sproutGeo = new THREE.ConeGeometry(0.05, 0.3, 6);
        const sproutMat = new THREE.MeshStandardMaterial({
          color: 0x4CAF50,
          roughness: 0.8
        });
        const sprout = new THREE.Mesh(sproutGeo, sproutMat);
        sprout.position.y = 0.15;
        plantGroup.add(sprout);
        break;

      case GrowthStages.SMALL:
        // Small flower bud
        const budGeo = new THREE.SphereGeometry(0.15, 12, 12);
        const budMat = new THREE.MeshStandardMaterial({
          color: threeColor,
          roughness: 0.7,
          metalness: 0.1
        });
        const bud = new THREE.Mesh(budGeo, budMat);
        bud.position.y = 0.3;
        plantGroup.add(bud);

        // Stem
        const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6);
        const stemMat = new THREE.MeshStandardMaterial({
          color: 0x4CAF50,
          roughness: 0.8
        });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.15;
        plantGroup.add(stem);
        break;

      case GrowthStages.MEDIUM:
        // Growing flower with petals forming
        const petalCount = 5;
        for (let i = 0; i < petalCount; i++) {
          const angle = (i / petalCount) * Math.PI * 2;
          const petalGeo = new THREE.SphereGeometry(0.2, 12, 12);
          petalGeo.scale(1.3, 0.3, 0.6);

          const petalMat = new THREE.MeshStandardMaterial({
            color: threeColor,
            transparent: true,
            opacity: 0.85,
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
          });

          const petal = new THREE.Mesh(petalGeo, petalMat);
          petal.position.x = Math.cos(angle) * 0.25;
          petal.position.z = Math.sin(angle) * 0.25;
          petal.position.y = 0.5;
          petal.rotation.y = -angle;
          petal.rotation.x = Math.PI / 6;

          plantGroup.add(petal);
        }

        // Center
        const centerGeo = new THREE.SphereGeometry(0.12, 12, 12);
        const centerMat = new THREE.MeshStandardMaterial({
          color: 0xffd700,
          roughness: 0.4,
          metalness: 0.2
        });
        const center = new THREE.Mesh(centerGeo, centerMat);
        center.position.y = 0.5;
        plantGroup.add(center);

        // Longer stem
        const stemGeo2 = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6);
        const stemMat2 = new THREE.MeshStandardMaterial({
          color: 0x4CAF50,
          roughness: 0.8
        });
        const stem2 = new THREE.Mesh(stemGeo2, stemMat2);
        stem2.position.y = 0.25;
        plantGroup.add(stem2);
        break;

      case GrowthStages.MATURE:
        // Full flower with glow
        const maturePetalCount = 6;
        for (let i = 0; i < maturePetalCount; i++) {
          const angle = (i / maturePetalCount) * Math.PI * 2;
          const petalGeo = new THREE.SphereGeometry(0.25, 16, 16);
          petalGeo.scale(1.5, 0.3, 0.8);

          const petalMat = new THREE.MeshStandardMaterial({
            color: threeColor,
            transparent: true,
            opacity: 0.85,
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide,
            emissive: threeColor,
            emissiveIntensity: 0.2
          });

          const petal = new THREE.Mesh(petalGeo, petalMat);
          petal.position.x = Math.cos(angle) * 0.35;
          petal.position.z = Math.sin(angle) * 0.35;
          petal.position.y = 0.6;
          petal.rotation.y = -angle;
          petal.rotation.x = Math.PI / 6;

          plantGroup.add(petal);
        }

        // Bright center
        const matureCenterGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const matureCenterMat = new THREE.MeshStandardMaterial({
          color: 0xffd700,
          roughness: 0.4,
          metalness: 0.2,
          emissive: 0xffd700,
          emissiveIntensity: 0.5
        });
        const matureCenter = new THREE.Mesh(matureCenterGeo, matureCenterMat);
        matureCenter.position.y = 0.65;
        plantGroup.add(matureCenter);

        // Glow effect
        const glowGeo = new THREE.SphereGeometry(0.7, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
          color: threeColor,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.y = 0.6;
        plantGroup.add(glow);
        plantGroup.userData.glow = glow;

        // Pulsing glow animation
        gsap.to(glowMat, {
          opacity: 0.5,
          duration: 2,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut'
        });

        // Full stem
        const stemGeo3 = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8);
        const stemMat3 = new THREE.MeshStandardMaterial({
          color: 0x4CAF50,
          roughness: 0.8
        });
        const stem3 = new THREE.Mesh(stemGeo3, stemMat3);
        stem3.position.y = 0.3;
        plantGroup.add(stem3);

        // Leaves
        for (let i = 0; i < 2; i++) {
          const leafGeo = new THREE.SphereGeometry(0.15, 12, 12);
          leafGeo.scale(2, 0.1, 1);
          const leafMat = new THREE.MeshStandardMaterial({
            color: 0x4CAF50,
            roughness: 0.8,
            side: THREE.DoubleSide
          });
          const leaf = new THREE.Mesh(leafGeo, leafMat);
          leaf.position.y = 0.2 + i * 0.15;
          leaf.position.x = (i % 2 === 0 ? 0.2 : -0.2);
          leaf.rotation.z = (i % 2 === 0 ? -0.5 : 0.5);
          plantGroup.add(leaf);
        }
        break;
    }
  }

  removePlantMesh(plantId) {
    const mesh = this.plantMeshes.get(plantId);
    if (!mesh) return;

    // Harvest animation
    gsap.to(mesh.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.5,
      ease: 'back.in',
      onComplete: () => {
        this.scene.remove(mesh);

        // Dispose of all geometries and materials
        mesh.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });

        this.plantMeshes.delete(plantId);
      }
    });

    // Create harvest sparkles
    const position = mesh.position.clone();
    const count = 15;

    for (let i = 0; i < count; i++) {
      const geometry = new THREE.SphereGeometry(0.08, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 1
      });
      const particle = new THREE.Mesh(geometry, material);

      particle.position.copy(position);
      particle.position.y += 0.5;

      this.scene.add(particle);

      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 0.5;

      gsap.to(particle.position, {
        x: position.x + Math.cos(angle) * radius,
        y: position.y + 1 + Math.random() * 0.5,
        z: position.z + Math.sin(angle) * radius,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      });

      gsap.to(particle.material, {
        opacity: 0,
        duration: 0.8,
        ease: 'none'
      });
    }
  }

  // Show a poem line
  showPoem(text) {
    const poemEl = document.createElement('div');
    poemEl.className = 'garden-poem';
    poemEl.textContent = text;
    this.element.appendChild(poemEl);

    // Fade in
    gsap.fromTo(poemEl,
      { opacity: 0, y: -20 },
      {
        opacity: 1,
        y: 0,
        duration: 2,
        ease: 'power2.out'
      }
    );

    // Fade out after a few seconds
    setTimeout(() => {
      gsap.to(poemEl, {
        opacity: 0,
        y: 20,
        duration: 2,
        ease: 'power2.in',
        onComplete: () => poemEl.remove()
      });
    }, 5000);
  }

  // Reward given on exit only
  complete() {
    if (this.isComplete) return;
    this.isComplete = true;

    if (this.onComplete) {
      this.onComplete();
    }
  }

  animate() {
    if (!this.isAnimating || !this.renderer) return;
    requestAnimationFrame(() => this.animate());

    const tNow = performance.now() / 1000;
    const dt = Math.min(0.05, tNow - this.lastTime);
    this.lastTime = tNow;
    this.realTime += dt;

    // Update game time
    this.gameTime = (this.gameTime + dt * this.timeScale) % 24;
    this.updateSkyAndLighting(this.gameTime);

    // Update simulator (plant growth)
    this.simulator.update(dt);
    this.updatePlantGrowth();

    // Update ground shader
    if (this.ground) {
      this.ground.material.uniforms.time.value = this.realTime;
    }

    // Update stars
    if (this.stars) {
      this.stars.material.uniforms.time.value = this.realTime;
      this.stars.rotation.y += 0.0001;
    }

    // Animate atmospheric particles
    if (this.atmosphericParticleSystem) {
      const posArray = this.atmosphericParticleSystem.geometry.attributes.position.array;
      const velArray = this.atmosphericParticleSystem.geometry.attributes.velocity.array;

      for (let i = 0; i < posArray.length / 3; i++) {
        const idx = i * 3;

        // Apply velocity
        posArray[idx] += velArray[idx];
        posArray[idx + 1] += velArray[idx + 1];
        posArray[idx + 2] += velArray[idx + 2];

        // Wrap around
        if (posArray[idx + 1] > 15) {
          posArray[idx + 1] = 0;
        }
        if (Math.abs(posArray[idx]) > 20) {
          posArray[idx] = -posArray[idx];
        }
        if (Math.abs(posArray[idx + 2]) > 20) {
          posArray[idx + 2] = -posArray[idx + 2];
        }
      }

      this.atmosphericParticleSystem.geometry.attributes.position.needsUpdate = true;
      this.atmosphericParticleSystem.material.uniforms.time.value = this.realTime;

      // Update day/night phase for atmospheric particles
      const normalized = (Math.sin((this.gameTime / 24) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      this.atmosphericParticleSystem.material.uniforms.dayNightPhase.value = normalized;
    }

    // Animate butterflies
    this.butterflies.forEach(butterfly => {
      const userData = butterfly.userData;

      // Circular flight pattern
      userData.flyAngle += dt * userData.flySpeed;

      butterfly.position.x = Math.cos(userData.flyAngle) * userData.flyRadius;
      butterfly.position.z = Math.sin(userData.flyAngle) * userData.flyRadius;

      // Bob up and down
      userData.bobPhase += dt * 2;
      butterfly.position.y = 2.5 + Math.sin(userData.bobPhase) * 0.5;

      // Face direction of movement
      butterfly.rotation.y = -userData.flyAngle + Math.PI / 2;

      // Flap wings
      if (userData.wings) {
        userData.wingPhase += dt * 10;
        const flapAngle = Math.sin(userData.wingPhase) * 0.5;

        userData.wings[0].rotation.y = Math.PI * 0.3 + flapAngle;
        userData.wings[1].rotation.y = -Math.PI * 0.3 - flapAngle;
      }
    });

    // Animate fireflies
    if (this.fireflySystem) {
      const posArray = this.fireflySystem.geometry.attributes.position.array;
      const speedArray = this.fireflySystem.geometry.attributes.speed.array;
      for (let i = 0; i < speedArray.length; i++) {
        posArray[i * 3] += Math.sin(this.realTime * speedArray[i]) * 0.002;
        posArray[i * 3 + 1] += Math.cos(this.realTime * speedArray[i] * 0.7) * 0.003;
      }
      this.fireflySystem.geometry.attributes.position.needsUpdate = true;
    }

    // Animate mist
    if (this.mist) {
      this.mist.rotation.y += 0.0002;
    }

    // Create shooting stars occasionally (during night/dusk)
    if (this.gameTime >= 18 || this.gameTime <= 6) {
      if (tNow - this.lastShootingStar > 8 + Math.random() * 12) {
        this.createShootingStar();
        this.lastShootingStar = tNow;
      }
    }

    // Animate existing shooting stars
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const star = this.shootingStars[i];
      star.position.x += star.userData.velocity.x * dt;
      star.position.y += star.userData.velocity.y * dt;
      star.position.z += star.userData.velocity.z * dt;

      star.userData.life -= dt;
      if (star.userData.life <= 0) {
        this.scene.remove(star);
        if (star.geometry) star.geometry.dispose();
        if (star.material) star.material.dispose();
        this.shootingStars.splice(i, 1);
      } else {
        // Fade out
        star.material.opacity = star.userData.life / star.userData.maxLife;
      }
    }

    // Gentle camera sway
    this.camera.position.x = Math.sin(this.realTime * 0.06) * 1.5;
    this.camera.lookAt(0, 0, 0);

    // Flamingo love story animation - state machine
    this.flamingos.forEach((flamingo, index) => {
      const userData = flamingo.userData;
      const partner = userData.partner;
      const isNight = this.gameTime >= 20 || this.gameTime < 5;

      // Update state timer
      if (userData.stateTimer > 0) {
        userData.stateTimer -= dt;
      }

      // State machine
      switch (userData.state) {
        case 'waiting':
          // Flamingo 2 waits before flying in
          if (userData.stateTimer <= 0) {
            this.flyInFlamingo(flamingo, new THREE.Vector3(8, -2.0, 6));
          }
          break;

        case 'flying_in':
        case 'flying_in_together':
        case 'flying_away':
          // Handled by GSAP animations
          // Just rotate to face movement direction
          const velocity = new THREE.Vector3().subVectors(
            flamingo.position,
            userData.lastPosition || flamingo.position
          );
          if (velocity.length() > 0.01) {
            const targetAngle = Math.atan2(velocity.x, velocity.z);
            flamingo.rotation.y = targetAngle;
          }
          userData.lastPosition = flamingo.position.clone();
          break;

        case 'wandering_solo':
          // Wander alone, waiting to meet
          userData.turnTimer -= dt;
          if (userData.turnTimer <= 0) {
            userData.walkDirection = new THREE.Vector3(
              Math.random() - 0.5,
              0,
              Math.random() - 0.5
            ).normalize();
            userData.turnTimer = 3 + Math.random() * 4;
          }

          // Walk
          flamingo.position.x += userData.walkDirection.x * userData.walkSpeed;
          flamingo.position.z += userData.walkDirection.z * userData.walkSpeed;

          // Keep within bounds
          const distSolo = Math.sqrt(flamingo.position.x ** 2 + flamingo.position.z ** 2);
          if (distSolo > 12) {
            userData.walkDirection = new THREE.Vector3(
              -flamingo.position.x,
              0,
              -flamingo.position.z
            ).normalize();
          }

          // Look in walking direction
          flamingo.rotation.y = Math.atan2(userData.walkDirection.x, userData.walkDirection.z);

          // Bob while walking
          userData.bobPhase += dt * 2;
          flamingo.position.y = -2.0 + Math.sin(userData.bobPhase) * 0.03;

          // Check if time to meet (both need to be wandering_solo)
          if (userData.stateTimer <= 0 && partner && partner.userData.state === 'wandering_solo') {
            this.startMeeting(flamingo, partner);
          }
          break;

        case 'meeting':
          // Walk towards meeting point
          if (userData.meetingPoint) {
            const toMeeting = new THREE.Vector3().subVectors(
              userData.meetingPoint,
              flamingo.position
            );
            const distToMeeting = toMeeting.length();

            if (distToMeeting > 0.5) {
              // Still walking to meeting point
              toMeeting.normalize();
              flamingo.position.x += toMeeting.x * userData.walkSpeed;
              flamingo.position.z += toMeeting.z * userData.walkSpeed;
              flamingo.rotation.y = Math.atan2(toMeeting.x, toMeeting.z);

              // Bob while walking
              userData.bobPhase += dt * 2;
              flamingo.position.y = -2.0 + Math.sin(userData.bobPhase) * 0.03;
            } else {
              // Reached meeting point - wait for partner
              if (partner && partner.userData.state === 'meeting') {
                const partnerDist = new THREE.Vector3().subVectors(
                  userData.meetingPoint,
                  partner.position
                ).length();

                if (partnerDist < 0.5) {
                  // Both at meeting point - fly away together!
                  if (userData.id === 1) { // Only trigger once
                    this.flyAwayTogether(flamingo, partner);
                  }
                }
              }
            }
          }
          break;

        case 'together':
          // Walk together, staying close
          if (partner && partner.userData.state === 'together') {
            // Follow partner with slight offset
            const offset = userData.id === 1 ? -1.5 : 1.5;
            const targetPos = new THREE.Vector3(
              partner.position.x + offset,
              -2.0,
              partner.position.z
            );

            if (userData.id === 1) {
              // Leader - random walking
              userData.turnTimer -= dt;
              if (userData.turnTimer <= 0) {
                userData.walkDirection = new THREE.Vector3(
                  Math.random() - 0.5,
                  0,
                  Math.random() - 0.5
                ).normalize();
                userData.turnTimer = 3 + Math.random() * 4;
              }

              flamingo.position.x += userData.walkDirection.x * userData.walkSpeed;
              flamingo.position.z += userData.walkDirection.z * userData.walkSpeed;

              // Keep within bounds
              const distTogether = Math.sqrt(flamingo.position.x ** 2 + flamingo.position.z ** 2);
              if (distTogether > 12) {
                userData.walkDirection = new THREE.Vector3(
                  -flamingo.position.x,
                  0,
                  -flamingo.position.z
                ).normalize();
              }

              flamingo.rotation.y = Math.atan2(userData.walkDirection.x, userData.walkDirection.z);
            } else {
              // Follower - follow partner
              const toPartner = new THREE.Vector3().subVectors(targetPos, flamingo.position);
              if (toPartner.length() > 0.5) {
                toPartner.normalize();
                flamingo.position.x += toPartner.x * userData.walkSpeed;
                flamingo.position.z += toPartner.z * userData.walkSpeed;
                flamingo.rotation.y = Math.atan2(toPartner.x, toPartner.z);
              }
            }

            // Bob while walking
            userData.bobPhase += dt * 2;
            flamingo.position.y = -2.0 + Math.sin(userData.bobPhase) * 0.03;
          }

          // Check if night - go to sleep
          if (isNight && !userData.sleeping) {
            userData.sleeping = true;
            userData.state = 'sleeping';
            // Move to sleep position near pond
            gsap.to(flamingo.position, {
              x: userData.sleepPosition.x,
              y: userData.sleepPosition.y,
              z: userData.sleepPosition.z,
              duration: 3,
              ease: 'power2.inOut'
            });
          }
          break;

        case 'sleeping':
          // Sleep near pond, minimal movement
          // Stand on one leg (shift position slightly)
          flamingo.position.y = userData.sleepPosition.y + Math.sin(this.realTime * 0.3) * 0.01;

          // Tuck head (rotate slightly)
          if (!userData.sleepRotation) {
            userData.sleepRotation = flamingo.rotation.y;
            gsap.to(flamingo.rotation, {
              y: userData.sleepRotation + 0.5,
              duration: 2,
              ease: 'power2.inOut'
            });
          }

          // Wake up at dawn
          if (!isNight && userData.sleeping) {
            userData.sleeping = false;
            userData.state = 'together';
            userData.sleepRotation = null;
            gsap.to(flamingo.rotation, {
              y: 0,
              duration: 2,
              ease: 'power2.out'
            });
          }
          break;
      }

      // Subtle wing animation (walking pace)
      if (userData.wings && (userData.state === 'wandering_solo' || userData.state === 'meeting' || userData.state === 'together')) {
        userData.wings.forEach((wing, i) => {
          const baseRotation = (i === 0 ? -0.3 : 0.3);
          wing.rotation.z = baseRotation + Math.sin(this.realTime * 1.5 + i * Math.PI) * 0.05;
        });
      }
    });

    // Animate goldfish swimming slowly in circles
    this.goldfish.forEach(fish => {
      const userData = fish.userData;

      // Swim in gentle circles (very slow)
      userData.swimAngle += dt * userData.swimSpeed;

      fish.position.x = Math.cos(userData.swimAngle) * userData.swimRadius;
      fish.position.z = Math.sin(userData.swimAngle) * userData.swimRadius;

      // Look in swimming direction
      fish.rotation.y = -userData.swimAngle + Math.PI / 2;

      // Gentle up/down motion in water
      fish.position.y = -2.05 + Math.sin(this.realTime * 1.5 + userData.swimAngle) * 0.03;
    });

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    if (!this.renderer) return;

    const container = this.element.querySelector('.garden-canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // ========== NEW ENHANCEMENT METHODS ==========

  /**
   * Load achievements and stats from localStorage
   */
  loadAchievementsAndStats() {
    try {
      const saved = localStorage.getItem('mila:eternal-garden-achievements');
      if (saved) {
        const data = JSON.parse(saved);
        this.achievements = { ...this.achievements, ...data.achievements };
        this.gardenStats = { ...this.gardenStats, ...data.stats };
        // Convert colorsDiscovered back to Set
        if (data.stats.colorsDiscovered) {
          this.gardenStats.colorsDiscovered = new Set(data.stats.colorsDiscovered);
        }
      }
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  }

  /**
   * Save achievements and stats to localStorage
   */
  saveAchievementsAndStats() {
    try {
      const data = {
        achievements: this.achievements,
        stats: {
          ...this.gardenStats,
          colorsDiscovered: Array.from(this.gardenStats.colorsDiscovered)
        }
      };
      localStorage.setItem('mila:eternal-garden-achievements', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save achievements:', error);
    }
  }

  /**
   * Show floating +XP number
   */
  showFloatingXP(xpAmount, position) {
    const xpDiv = document.createElement('div');
    xpDiv.className = 'floating-xp';
    xpDiv.textContent = `+${xpAmount} XP`;
    xpDiv.style.position = 'fixed';
    xpDiv.style.color = '#4ade80';
    xpDiv.style.fontSize = '20px';
    xpDiv.style.fontWeight = 'bold';
    xpDiv.style.textShadow = '0 0 10px rgba(74, 222, 128, 0.8)';
    xpDiv.style.pointerEvents = 'none';
    xpDiv.style.zIndex = '1000';

    // Convert 3D position to screen position if provided
    if (position && position.x !== undefined) {
      const vector = new THREE.Vector3(position.x, position.y + 1, position.z);
      vector.project(this.camera);

      const x = (vector.x * 0.5 + 0.5) * this.renderer.domElement.clientWidth;
      const y = (-(vector.y) * 0.5 + 0.5) * this.renderer.domElement.clientHeight;

      xpDiv.style.left = `${x}px`;
      xpDiv.style.top = `${y}px`;
    } else {
      // Center of screen
      xpDiv.style.left = '50%';
      xpDiv.style.top = '50%';
      xpDiv.style.transform = 'translate(-50%, -50%)';
    }

    this.element.appendChild(xpDiv);

    // Animate float up and fade out
    gsap.to(xpDiv, {
      y: -50,
      opacity: 0,
      duration: 1,
      ease: 'power2.out',
      onComplete: () => {
        xpDiv.remove();
      }
    });

    // Check for level up after showing XP
    this.checkForLevelUp();
  }

  /**
   * Check if player leveled up
   */
  checkForLevelUp() {
    const xpForNextLevel = 100 + (this.simulator.skill.level - 1) * 10;
    if (this.simulator.skill.experience >= xpForNextLevel) {
      const oldLevel = this.simulator.skill.level;
      this.simulator.skill.experience -= xpForNextLevel;
      this.simulator.skill.level++;
      this.simulator.saveState();
      this.onLevelUp(this.simulator.skill.level);
    }
  }

  /**
   * Check and unlock achievement
   */
  checkAchievement(achievementId) {
    const achievement = this.achievements[achievementId];
    if (!achievement || achievement.unlocked) return;

    let shouldUnlock = false;

    switch (achievementId) {
      case 'first_plant':
        shouldUnlock = this.gardenStats.totalPlantsGrown >= 1;
        break;
      case 'level_5':
        shouldUnlock = this.simulator.skill.level >= 5;
        break;
      case 'level_10':
        shouldUnlock = this.simulator.skill.level >= 10;
        break;
      case 'first_breed':
        shouldUnlock = this.gardenStats.breedsCreated >= 1;
        break;
      case '10_breeds':
        shouldUnlock = this.gardenStats.breedsCreated >= 10;
        break;
      case 'all_colors':
        shouldUnlock = this.gardenStats.colorsDiscovered.size >= 6;
        break;
      case '100_plants':
        shouldUnlock = this.gardenStats.totalPlantsGrown >= 100;
        break;
    }

    if (shouldUnlock) {
      achievement.unlocked = true;
      this.unlockAchievement(achievement);
      this.saveAchievementsAndStats();
    }
  }

  /**
   * Show achievement unlock popup with confetti
   */
  unlockAchievement(achievement) {
    // Play special sound
    this.playSpecialSound('achievement');

    // Create confetti
    this.createConfetti(50, 2000);

    // Show achievement popup
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
      <div class="achievement-content">
        <div class="achievement-title">${achievement.title}</div>
        <div class="achievement-desc">${achievement.desc}</div>
        <div class="achievement-reward">+${achievement.reward} XP</div>
      </div>
    `;
    popup.style.position = 'fixed';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.background = 'rgba(0, 0, 0, 0.9)';
    popup.style.color = 'white';
    popup.style.padding = '30px';
    popup.style.borderRadius = '20px';
    popup.style.textAlign = 'center';
    popup.style.zIndex = '2000';
    popup.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.5)';
    popup.style.border = '2px solid gold';
    popup.style.minWidth = '300px';

    this.element.appendChild(popup);

    // Animate in
    gsap.fromTo(popup,
      { scale: 0, rotation: -180 },
      { scale: 1, rotation: 0, duration: 0.8, ease: 'back.out(1.7)' }
    );

    // Grant XP
    const oldLevel = this.simulator.skill.level;
    this.simulator.skill.experience += achievement.reward;
    this.updateUI();

    // Check for level up
    const xpForNextLevel = 100 + (this.simulator.skill.level - 1) * 10;
    if (this.simulator.skill.experience >= xpForNextLevel) {
      this.simulator.skill.experience -= xpForNextLevel;
      this.simulator.skill.level++;
      this.onLevelUp(this.simulator.skill.level);
    }

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      gsap.to(popup, {
        opacity: 0,
        scale: 0.8,
        duration: 0.5,
        onComplete: () => popup.remove()
      });
    }, 3000);
  }

  /**
   * Create confetti particles
   */
  createConfetti(count, duration) {
    const container = this.element.querySelector('.garden-canvas-container');
    if (!container) return;

    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.top = '-20px';
      confetti.style.zIndex = '1500';
      confetti.style.pointerEvents = 'none';

      container.appendChild(confetti);

      gsap.to(confetti, {
        y: window.innerHeight + 100,
        x: (Math.random() - 0.5) * 400,
        rotation: Math.random() * 720,
        duration: duration / 1000,
        ease: 'none',
        onComplete: () => confetti.remove()
      });
    }
  }

  /**
   * Level up celebration
   */
  onLevelUp(newLevel) {
    // Screen shake
    this.screenShake(0.5, 0.5);

    // Big confetti
    this.createConfetti(100, 3000);

    // Play level up sound
    this.playSpecialSound('levelup');

    // Show big level up text
    const levelUpDiv = document.createElement('div');
    levelUpDiv.className = 'level-up-text';
    levelUpDiv.textContent = '+1 LEVEL!';
    levelUpDiv.style.position = 'fixed';
    levelUpDiv.style.top = '50%';
    levelUpDiv.style.left = '50%';
    levelUpDiv.style.transform = 'translate(-50%, -50%)';
    levelUpDiv.style.fontSize = '80px';
    levelUpDiv.style.fontWeight = 'bold';
    levelUpDiv.style.color = '#ffd700';
    levelUpDiv.style.textShadow = '0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.5)';
    levelUpDiv.style.zIndex = '1500';
    levelUpDiv.style.pointerEvents = 'none';

    this.element.appendChild(levelUpDiv);

    gsap.fromTo(levelUpDiv,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' }
    );

    gsap.to(levelUpDiv, {
      opacity: 0,
      y: -100,
      duration: 1,
      delay: 1.5,
      onComplete: () => levelUpDiv.remove()
    });

    // Make all plants glow
    this.plantMeshes.forEach(mesh => {
      const originalEmissive = mesh.userData.originalEmissive || new THREE.Color(0x000000);
      if (mesh.children[0] && mesh.children[0].material) {
        mesh.children[0].material.emissive = new THREE.Color(0xffd700);
        mesh.children[0].material.emissiveIntensity = 0.5;

        setTimeout(() => {
          gsap.to(mesh.children[0].material, {
            emissiveIntensity: 0,
            duration: 2,
            onComplete: () => {
              mesh.children[0].material.emissive.copy(originalEmissive);
            }
          });
        }, 2000);
      }
    });

    // Check level achievements
    this.checkAchievement(`level_${newLevel}`);
  }

  /**
   * Screen shake effect
   */
  screenShake(intensity, duration) {
    const camera = this.camera;
    const originalPos = camera.position.clone();

    let elapsed = 0;
    const shakeInterval = setInterval(() => {
      elapsed += 0.016; // ~60fps

      if (elapsed >= duration) {
        camera.position.copy(originalPos);
        clearInterval(shakeInterval);
        return;
      }

      const shakeMagnitude = intensity * (1 - elapsed / duration); // Decay over time
      camera.position.x = originalPos.x + (Math.random() - 0.5) * shakeMagnitude;
      camera.position.y = originalPos.y + (Math.random() - 0.5) * shakeMagnitude;
      camera.position.z = originalPos.z + (Math.random() - 0.5) * shakeMagnitude;
    }, 16);
  }

  /**
   * Play special sounds
   */
  playSpecialSound(type) {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    switch (type) {
      case 'levelup':
        // Happy ascending chime
        osc.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, this.audioContext.currentTime + 0.3); // C6
        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.5);
        break;

      case 'achievement':
        // Special sparkly sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(2400, this.audioContext.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.3);
        break;

      case 'rare':
        // Magical rare plant sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.setValueAtTime(1200, this.audioContext.currentTime + 0.1);
        osc.frequency.setValueAtTime(1600, this.audioContext.currentTime + 0.2);
        gain.gain.setValueAtTime(0.25, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.4);
        break;
    }
  }

  /**
   * Generate rare plant traits
   */
  generateRarePlant(genetics) {
    const rand = Math.random();

    if (rand < 0.001) {
      // 0.1% - Rainbow!
      genetics.rarity = 'rainbow';
      genetics.rarityLevel = 3;
      return genetics;
    } else if (rand < 0.01) {
      // 1% - Golden!
      genetics.rarity = 'golden';
      genetics.rarityLevel = 2;
      return genetics;
    } else if (rand < 0.05) {
      // 5% - Shimmering
      genetics.rarity = 'shimmering';
      genetics.rarityLevel = 1;
      return genetics;
    }

    genetics.rarity = 'common';
    genetics.rarityLevel = 0;
    return genetics;
  }

  /**
   * Update garden stats panel
   */
  updateStatsPanel() {
    const playtime = Math.floor((Date.now() - this.gardenStats.startTime) / 60000); // minutes
    const xpRate = playtime > 0 ? Math.floor(this.simulator.skill.experience / playtime) : 0;

    // Calculate beauty score
    let beautyScore = 0;
    this.simulator.plants.forEach(plant => {
      if (plant.stage === GrowthStages.MATURE) {
        beautyScore += 10;
        if (plant.genetics.rarity === 'shimmering') beautyScore += 25;
        if (plant.genetics.rarity === 'golden') beautyScore += 100;
        if (plant.genetics.rarity === 'rainbow') beautyScore += 500;
      }
    });

    // Update UI
    const statPlants = this.element.querySelector('#stat-plants');
    const statRarest = this.element.querySelector('#stat-rarest');
    const statPlaytime = this.element.querySelector('#stat-playtime');
    const statXpRate = this.element.querySelector('#stat-xp-rate');
    const statBeauty = this.element.querySelector('#stat-beauty');

    if (statPlants) statPlants.textContent = this.gardenStats.totalPlantsGrown;
    if (statRarest) statRarest.textContent = this.gardenStats.rarestPlantDiscovered;
    if (statPlaytime) statPlaytime.textContent = `${playtime}m`;
    if (statXpRate) statXpRate.textContent = xpRate;
    if (statBeauty) statBeauty.textContent = beautyScore;

    // Update rarity badge
    const rarestPlant = this.element.querySelector('#rarest-plant');
    if (rarestPlant) {
      rarestPlant.textContent = this.gardenStats.rarestPlantDiscovered;
      rarestPlant.style.color = this.getRarityColor(this.gardenStats.rarestPlantDiscovered);
    }
  }

  /**
   * Get rarity color
   */
  getRarityColor(rarity) {
    switch (rarity) {
      case 'rainbow': return '#ff00ff';
      case 'golden': return '#ffd700';
      case 'shimmering': return '#87ceeb';
      default: return '#888';
    }
  }

  /**
   * Get rarity level number
   */
  getRarityLevel(rarity) {
    switch (rarity) {
      case 'rainbow': return 3;
      case 'golden': return 2;
      case 'shimmering': return 1;
      default: return 0;
    }
  }

  /**
   * Add hover tooltip for plants
   */
  showPlantTooltip(plant, screenX, screenY) {
    // Remove existing tooltip
    const existing = this.element.querySelector('.plant-tooltip');
    if (existing) existing.remove();

    const stageNames = ['Seed', 'Sprout', 'Small', 'Medium', 'Mature'];
    const stageName = stageNames[plant.stage];
    const color = plant.genetics.colors.expressed;
    const size = plant.genetics.sizes.expressed;
    const rarity = plant.genetics.rarity || 'common';

    const tooltip = document.createElement('div');
    tooltip.className = 'plant-tooltip';
    tooltip.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">${rarity !== 'common' ? plant.genetics.rarity.toUpperCase() + ' ' : ''}${size} ${color}</div>
      <div>Stage: ${stageName}</div>
      ${rarity !== 'common' ? `<div style="color: ${this.getRarityColor(rarity)};">⭐ ${rarity}</div>` : ''}
    `;
    tooltip.style.position = 'fixed';
    tooltip.style.left = `${screenX + 10}px`;
    tooltip.style.top = `${screenY + 10}px`;
    tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '10px';
    tooltip.style.borderRadius = '8px';
    tooltip.style.fontSize = '14px';
    tooltip.style.zIndex = '1000';
    tooltip.style.pointerEvents = 'none';

    this.element.appendChild(tooltip);
  }

  /**
   * Remove plant tooltip
   */
  removePlantTooltip() {
    const tooltip = this.element.querySelector('.plant-tooltip');
    if (tooltip) tooltip.remove();
  }

  hide() {
    // Give reward when she leaves
    if (this.onComplete) {
      this.onComplete();
    }

    this.isAnimating = false;

    gsap.to(this.element, {
      opacity: 0,
      duration: 1,
      ease: 'power2.in',
      onComplete: () => {
        if (this.element && this.element.parentNode) {
          this.element.remove();
        }

        if (this.renderer) {
          this.renderer.dispose();
          this.scene.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              if (Array.isArray(obj.material)) {
                obj.material.forEach(m => m.dispose());
              } else {
                obj.material.dispose();
              }
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
  background: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.garden-container {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.garden-exit-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.garden-exit-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #FFB6C1;
  transform: scale(1.15) rotate(90deg);
}

.garden-exit-btn:active {
  transform: scale(0.95) rotate(90deg);
}

.garden-exit-btn .exit-icon {
  font-size: 1.6rem;
  color: #FFF8F0;
  font-weight: 400;
}

.garden-canvas-container {
  flex: 1;
  position: relative;
  touch-action: none;
}

.garden-time-indicator {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  pointer-events: none;
  z-index: 50;
}

.current-time {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.5px;
}

/* Resources Panel */
.garden-resources-panel {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(15px);
  border-radius: 30px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  z-index: 50;
}

.skill-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-right: 1rem;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.skill-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.skill-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.skill-level {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.xp-bar {
  width: 80px;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.xp-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 3px;
  transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
  position: relative;
}

.xp-fill.gaining {
  animation: xpGlow 0.8s ease-out;
}

@keyframes xpGlow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
  }
  50% {
    box-shadow: 0 0 20px rgba(76, 175, 80, 1),
                0 0 40px rgba(139, 195, 74, 0.8);
  }
}

.resources {
  display: flex;
  gap: 1rem;
}

.resource {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.resource-icon {
  font-size: 1.2rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.resource-value {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  min-width: 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.resource-value.changed {
  animation: resourcePulse 0.5s ease-out;
}

@keyframes resourcePulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
    color: #FFD700;
    text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
  }
  100% {
    transform: scale(1);
  }
}

/* Action Buttons */
.garden-actions {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(15px);
  border-radius: 40px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  z-index: 50;
}

.action-btn {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.action-btn:active::before {
  width: 120%;
  height: 120%;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.1);
}

.action-btn:active {
  transform: scale(0.95);
}

.action-btn.active {
  background: rgba(76, 175, 80, 0.4);
  border-color: rgba(76, 175, 80, 0.8);
  box-shadow: 0 0 20px rgba(136, 238, 136, 0.6),
              inset 0 0 15px rgba(136, 238, 136, 0.3);
}

.action-btn.active::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid rgba(76, 175, 80, 0.6);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05);
  }
}

.action-icon {
  font-size: 1.8rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* Info Display */
.garden-info {
  position: absolute;
  bottom: 8rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(15px);
  border-radius: 25px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 50;
  max-width: 300px;
  min-width: 200px;
}

.garden-info.visible {
  animation: slideUpFade 0.3s ease-out forwards;
  opacity: 1;
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.garden-info.success {
  background: rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.8);
  color: #88ee88;
  box-shadow: 0 4px 20px rgba(76, 175, 80, 0.4);
}

.garden-info.error {
  border-color: rgba(244, 67, 54, 0.6);
  background: rgba(244, 67, 54, 0.2);
  box-shadow: 0 0 20px rgba(244, 67, 54, 0.4);
}

.garden-poem {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  padding: 1.5rem 2rem;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 182, 193, 0.4);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  max-width: 500px;
  z-index: 50;
  pointer-events: none;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.2rem;
  font-weight: 400;
  font-style: italic;
  line-height: 1.6;
  color: rgba(255, 243, 230, 0.95);
  text-shadow: 0 2px 10px rgba(255, 182, 193, 0.3);
}

/* =========================================================================
   ULTIMATE NEW FEATURES - SPECIAL SEEDS & DISCOVERIES PANELS
   ========================================================================= */

/* Special Seeds Panel */
.special-seeds-panel {
  position: absolute;
  bottom: 10rem;
  right: 1rem;
  z-index: 60;
}

.seeds-toggle {
  width: 56px;
  height: 56px;
  background: rgba(255, 215, 0, 0.3);
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 215, 0, 0.6);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
  font-size: 1.8rem;
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.seeds-toggle:hover {
  background: rgba(255, 215, 0, 0.5);
  transform: scale(1.1) rotate(10deg);
  box-shadow: 0 6px 30px rgba(255, 215, 0, 0.5);
}

.seeds-toggle:active {
  transform: scale(0.95);
}

.special-seeds-panel.open .seeds-toggle {
  transform: rotate(180deg) scale(1.1);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
}

.seeds-content {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 280px;
  max-height: 0;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  opacity: 0;
  transform-origin: bottom right;
}

.special-seeds-panel.open .seeds-content {
  max-height: 400px;
  opacity: 1;
  padding: 1rem;
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.seeds-header {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #FFD700;
  text-align: center;
  margin-bottom: 1rem;
  text-shadow: 0 2px 10px rgba(255, 215, 0, 0.5);
}

.seed-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  opacity: 0;
  animation: fadeInStagger 0.3s ease-out forwards;
}

.seed-item:nth-child(2) { animation-delay: 0.05s; }
.seed-item:nth-child(3) { animation-delay: 0.1s; }
.seed-item:nth-child(4) { animation-delay: 0.15s; }
.seed-item:nth-child(5) { animation-delay: 0.2s; }
.seed-item:nth-child(6) { animation-delay: 0.25s; }

.seed-item:hover {
  background: rgba(255, 215, 0, 0.15);
  border-color: rgba(255, 215, 0, 0.5);
  transform: translateX(-5px);
}

.seed-item:active {
  transform: translateX(-3px) scale(0.98);
}

.seed-item.active {
  background: rgba(255, 215, 0, 0.3);
  border-color: rgba(255, 215, 0, 0.8);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.4),
              inset 0 0 10px rgba(255, 215, 0, 0.2);
}

.seed-icon {
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.seed-name {
  flex: 1;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.seed-count {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  color: #FFD700;
  background: rgba(255, 215, 0, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  border: 1px solid rgba(255, 215, 0, 0.4);
}

/* Discoveries Encyclopedia Panel */
.discoveries-panel {
  position: absolute;
  bottom: 10rem;
  left: 1rem;
  z-index: 60;
}

.discoveries-toggle {
  width: 56px;
  height: 56px;
  background: rgba(135, 206, 235, 0.3);
  backdrop-filter: blur(15px);
  border: 2px solid rgba(135, 206, 235, 0.6);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 20px rgba(135, 206, 235, 0.3);
  font-size: 1.8rem;
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.discoveries-toggle:hover {
  background: rgba(135, 206, 235, 0.5);
  transform: scale(1.1) rotate(-10deg);
  box-shadow: 0 6px 30px rgba(135, 206, 235, 0.5);
}

.discoveries-toggle:active {
  transform: scale(0.95);
}

.discoveries-panel.open .discoveries-toggle {
  transform: rotate(180deg) scale(1.1);
  box-shadow: 0 0 20px rgba(135, 206, 235, 0.8);
}

.discoveries-content {
  position: absolute;
  bottom: 70px;
  left: 0;
  width: 320px;
  max-height: 0;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  opacity: 0;
  transform-origin: bottom left;
}

.discoveries-panel.open .discoveries-content {
  max-height: 500px;
  opacity: 1;
  padding: 1rem;
  animation: slideInLeft 0.3s ease-out;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.discoveries-header {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #87CEEB;
  text-align: center;
  margin-bottom: 1rem;
  text-shadow: 0 2px 10px rgba(135, 206, 235, 0.5);
}

.discovery-section {
  margin-bottom: 1.5rem;
}

.discovery-section-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.discovery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.discovery-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(135, 206, 235, 0.15);
  border-radius: 12px;
  border: 2px solid rgba(135, 206, 235, 0.3);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: help;
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.discovery-item:hover {
  background: rgba(135, 206, 235, 0.25);
  border-color: rgba(135, 206, 235, 0.6);
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(135, 206, 235, 0.3);
}

.discovery-item:active {
  transform: translateY(-1px) scale(0.98);
}

.discovery-item.undiscovered {
  background: rgba(50, 50, 50, 0.3);
  border-color: rgba(100, 100, 100, 0.3);
  opacity: 0.5;
}

.discovery-item.undiscovered .discovery-icon {
  filter: grayscale(100%) brightness(0.5);
}

.discovery-icon {
  font-size: 1.8rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.discovery-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
}

.discovery-stats {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.discovery-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
}

.discovery-stat .stat-label {
  color: rgba(255, 255, 255, 0.7);
}

.discovery-stat .stat-value {
  color: #87CEEB;
  font-weight: 700;
}

/* Garden Stats Panel (Enhanced) */
.garden-stats-panel {
  position: absolute;
  top: 50%;
  right: 1rem;
  transform: translateY(-50%);
  z-index: 60;
}

.stats-toggle {
  width: 56px;
  height: 56px;
  background: rgba(76, 175, 80, 0.3);
  backdrop-filter: blur(15px);
  border: 2px solid rgba(76, 175, 80, 0.6);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
  font-size: 1.8rem;
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.stats-toggle:hover {
  background: rgba(76, 175, 80, 0.5);
  transform: scale(1.1);
  box-shadow: 0 6px 30px rgba(76, 175, 80, 0.5);
}

.stats-toggle:active {
  transform: scale(0.95);
}

.garden-stats-panel.open .stats-toggle {
  transform: rotate(180deg) scale(1.1);
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.8);
}

.stats-content {
  position: absolute;
  top: 0;
  right: 70px;
  width: 280px;
  max-height: 0;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px) saturate(180%);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  opacity: 0;
  transform-origin: top right;
}

.garden-stats-panel.open .stats-content {
  max-height: 350px;
  opacity: 1;
  padding: 1rem;
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.stats-header {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #4CAF50;
  text-align: center;
  margin-bottom: 1rem;
  text-shadow: 0 2px 10px rgba(76, 175, 80, 0.5);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  opacity: 0;
  animation: fadeInStagger 0.3s ease-out forwards;
}

.stat-row:nth-child(1) { animation-delay: 0.05s; }
.stat-row:nth-child(2) { animation-delay: 0.1s; }
.stat-row:nth-child(3) { animation-delay: 0.15s; }
.stat-row:nth-child(4) { animation-delay: 0.2s; }
.stat-row:nth-child(5) { animation-delay: 0.25s; }
.stat-row:nth-child(6) { animation-delay: 0.3s; }

@keyframes fadeInStagger {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.stat-row .stat-label {
  color: rgba(255, 255, 255, 0.7);
}

.stat-row .stat-value {
  color: #4CAF50;
  font-weight: 700;
}

@media (max-width: 768px) {
  .garden-exit-btn {
    width: 40px;
    height: 40px;
  }

  .garden-time-indicator {
    padding: 0.4rem 0.8rem;
  }

  .current-time {
    font-size: 0.75rem;
  }

  .garden-resources-panel {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem 0.9rem;
    top: 3.5rem;
    left: 1rem;
    transform: none;
  }

  .skill-display {
    padding-right: 0;
    padding-bottom: 0.5rem;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .resources {
    gap: 0.75rem;
  }

  .garden-actions {
    gap: 0.6rem;
    padding: 0.5rem;
    bottom: 1.5rem;
  }

  .action-btn {
    width: 52px;
    height: 52px;
    min-width: 52px;
  }

  .action-icon {
    font-size: 1.6rem;
  }

  .garden-info {
    bottom: 6.5rem;
    max-width: 85%;
    font-size: 0.9rem;
    padding: 0.9rem 1.3rem;
  }

  .garden-poem {
    padding: 1.2rem 1.5rem;
    max-width: 85%;
    font-size: 1rem;
  }

  .stats-toggle,
  .seeds-toggle,
  .discoveries-toggle {
    width: 52px;
    height: 52px;
    min-width: 52px;
    min-height: 52px;
  }

  .special-seeds-panel,
  .discoveries-panel {
    bottom: 8rem;
  }

  .seeds-content,
  .discoveries-content {
    max-width: calc(100vw - 2rem);
    width: 300px;
  }

  .stats-content {
    width: 260px;
    max-width: calc(100vw - 2rem);
  }
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
