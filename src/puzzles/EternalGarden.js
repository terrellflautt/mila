/**
 * Eternal Garden - Beautiful, Artistic Edition
 * A stunning, impressionistic garden experience for mobile
 * Enhanced with interactive planting, growth simulation, and genetics
 */

import * as THREE from 'three';
import gsap from 'gsap';
import { animate as anime } from 'animejs';
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

    // Day/night palette - enhanced with more vibrant colors
    this.palette = {
      dayTop: new THREE.Color(0x87CEEB),      // Sky blue
      dayBottom: new THREE.Color(0xffeaa7),   // Soft yellow
      dawnTop: new THREE.Color(0xFFB6C1),     // Light pink
      dawnBottom: new THREE.Color(0xFFD4A3),  // Peach
      duskTop: new THREE.Color(0xFF6B9D),     // Vibrant pink
      duskBottom: new THREE.Color(0xFF8E53),  // Orange-rose
      nightTop: new THREE.Color(0x1e3a8a),    // Deep navy blue
      nightBottom: new THREE.Color(0x2d1b3d)  // Dark purple
    };

    // Shooting star system
    this.shootingStars = [];
    this.lastShootingStar = 0;
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

    group.scale.setScalar(0.5); // Make them smaller

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
    // Smoother transitions
    const normalized = (Math.sin((hour / 24) * Math.PI * 2 - Math.PI / 2) + 1) / 2;

    // Determine if dusk/dawn (golden hour)
    const isDusk = (hour >= 17 && hour < 20) || (hour >= 5 && hour < 8);
    const goldenBlend = isDusk ? Math.sin((hour - 17) / 3 * Math.PI) : 0;

    let top, bottom;

    if (isDusk && goldenBlend > 0) {
      top = new THREE.Color().copy(this.palette.duskTop);
      bottom = new THREE.Color().copy(this.palette.duskBottom);
    } else {
      top = new THREE.Color().copy(this.palette.dayTop).lerp(this.palette.nightTop, 1 - normalized);
      bottom = new THREE.Color().copy(this.palette.dayBottom).lerp(this.palette.nightBottom, 1 - normalized);
    }

    // Draw gradient
    const gradient = this.bgContext.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#' + top.getHexString());
    gradient.addColorStop(1, '#' + bottom.getHexString());
    this.bgContext.fillStyle = gradient;
    this.bgContext.fillRect(0, 0, 2, 256);
    this.bgTexture.needsUpdate = true;

    // Update fog color
    if (this.scene.fog) {
      this.scene.fog.color.copy(bottom);
    }

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
        anime({
          targets: mesh.scale,
          x: targetScale,
          y: targetScale,
          z: targetScale,
          duration: 2000,
          easing: 'easeOutElastic(1, 0.5)'
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

      anime({
        targets: particle.position,
        x: position.x + Math.cos(angle) * radius,
        y: position.y + 0.8 + Math.random() * 0.4,
        z: position.z + Math.sin(angle) * radius,
        duration: 1000,
        easing: 'easeOutQuad',
        complete: () => {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      });

      anime({
        targets: particle.material,
        opacity: 0,
        duration: 1000,
        easing: 'linear'
      });

      anime({
        targets: particle.scale,
        x: 1.5,
        y: 1.5,
        z: 1.5,
        duration: 500,
        easing: 'easeOutQuad'
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
          this.createPlantingBurst(intersectPoint);
          this.playGrowthSound(0.9);
          this.createPlantMesh(result.plant);
          this.updateUI();
          this.showInfo('Seed planted!');
        } else {
          this.showInfo(result.message, 2000, true);
        }
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
    const result = this.simulator.waterPlant(plantId);

    if (result.success) {
      this.createWaterParticles(plantId);
      this.playGrowthSound(1.2);
      this.updateUI();
      this.showInfo('Plant watered!');
    } else {
      this.showInfo(result.message, 2000, true);
    }
  }

  fertilizePlant(plantId) {
    const result = this.simulator.fertilizePlant(plantId);

    if (result.success) {
      this.createFertilizerParticles(plantId);
      this.playGrowthSound(1.3);
      this.updateUI();
      this.showInfo('Plant fertilized!');
    } else {
      this.showInfo(result.message, 2000, true);
    }
  }

  harvestPlant(plantId) {
    const result = this.simulator.harvestPlant(plantId);

    if (result.success) {
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
        this.createBreedingEffect(this.selectedPlants[0], this.selectedPlants[1]);
        this.playGrowthSound(1.8);
        this.updateUI();
        this.showInfo(result.message);

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
      // Add selection indicator (glow effect)
      if (!mesh.userData.selectionGlow) {
        const glowGeo = new THREE.SphereGeometry(1.2, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
          color: 0xffff00,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.scale.setScalar(1.5);
        mesh.add(glow);
        mesh.userData.selectionGlow = glow;

        // Pulse animation
        anime({
          targets: glow.scale,
          x: 1.7,
          y: 1.7,
          z: 1.7,
          duration: 800,
          easing: 'easeInOutSine',
          direction: 'alternate',
          loop: true
        });
      }
    } else {
      // Remove selection indicator
      if (mesh.userData.selectionGlow) {
        mesh.remove(mesh.userData.selectionGlow);
        mesh.userData.selectionGlow.geometry.dispose();
        mesh.userData.selectionGlow.material.dispose();
        mesh.userData.selectionGlow = null;
      }
    }
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

      anime({
        targets: particle.position,
        x: position.x + Math.cos(angle) * radius,
        y: position.y - 0.5,
        z: position.z + Math.sin(angle) * radius,
        duration: 600 + Math.random() * 400,
        easing: 'easeInQuad',
        complete: () => {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      });

      anime({
        targets: particle.material,
        opacity: 0,
        duration: 600,
        easing: 'linear'
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

      anime({
        targets: particle.position,
        x: position.x + Math.cos(angle) * radius,
        y: position.y + 1 + Math.random() * 0.5,
        z: position.z + Math.sin(angle) * radius,
        duration: 800 + Math.random() * 400,
        easing: 'easeOutQuad',
        complete: () => {
          // Sparkle at the end
          anime({
            targets: particle.scale,
            x: 2,
            y: 2,
            z: 2,
            duration: 200,
            easing: 'easeOutQuad',
            complete: () => {
              this.scene.remove(particle);
              geometry.dispose();
              material.dispose();
            }
          });
        }
      });

      anime({
        targets: particle.material,
        opacity: 0,
        duration: 1000,
        delay: 200,
        easing: 'linear'
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

    anime({
      targets: ripple.scale,
      x: 5,
      y: 5,
      z: 5,
      duration: 1000,
      easing: 'easeOutQuad'
    });

    anime({
      targets: rippleMat,
      opacity: 0,
      duration: 1000,
      easing: 'linear',
      complete: () => {
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

      anime({
        targets: particle.position,
        x: midpoint.x + Math.cos(angle) * radius,
        y: midpoint.y + 1,
        z: midpoint.z + Math.sin(angle) * radius,
        duration: 1000,
        easing: 'easeOutQuad',
        complete: () => {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      });

      anime({
        targets: particle.material,
        opacity: 0,
        duration: 1000,
        easing: 'linear'
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
      anime({
        targets: plantGroup.scale,
        x: scale,
        y: scale,
        z: scale,
        duration: 1000,
        easing: 'easeOutElastic(1, 0.5)'
      });
    }

    // Gentle sway animation
    anime({
      targets: plantGroup.rotation,
      z: (Math.random() - 0.5) * 0.1,
      duration: 2000 + Math.random() * 2000,
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine'
    });

    return plantGroup;
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
        anime({
          targets: glowMat,
          opacity: 0.5,
          duration: 2000,
          direction: 'alternate',
          loop: true,
          easing: 'easeInOutSine'
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
    anime({
      targets: mesh.scale,
      x: 0,
      y: 0,
      z: 0,
      duration: 500,
      easing: 'easeInBack',
      complete: () => {
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

      anime({
        targets: particle.position,
        x: position.x + Math.cos(angle) * radius,
        y: position.y + 1 + Math.random() * 0.5,
        z: position.z + Math.sin(angle) * radius,
        duration: 800,
        easing: 'easeOutQuad',
        complete: () => {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      });

      anime({
        targets: particle.material,
        opacity: 0,
        duration: 800,
        easing: 'linear'
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
  transition: all 0.3s ease;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.garden-exit-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: #FFB6C1;
  transform: scale(1.15) rotate(90deg);
}

.garden-exit-btn:active {
  transform: scale(1.05) rotate(90deg);
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
  transition: width 0.5s ease;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
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
  transition: all 0.3s ease;
  position: relative;
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
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.6);
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
  padding: 0.75rem 1.5rem;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(15px);
  border-radius: 25px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  font-family: 'Montserrat', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  color: #fff;
  text-align: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 50;
  max-width: 300px;
}

.garden-info.success {
  border-color: rgba(76, 175, 80, 0.6);
  background: rgba(76, 175, 80, 0.2);
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.4);
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
    padding: 0.5rem 1rem;
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
    gap: 0.5rem;
    padding: 0.5rem;
    bottom: 1rem;
  }

  .action-btn {
    width: 48px;
    height: 48px;
  }

  .action-icon {
    font-size: 1.5rem;
  }

  .garden-info {
    bottom: 6rem;
    max-width: 85%;
    font-size: 0.85rem;
  }

  .garden-poem {
    padding: 1.2rem 1.5rem;
    max-width: 85%;
    font-size: 1rem;
  }
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
