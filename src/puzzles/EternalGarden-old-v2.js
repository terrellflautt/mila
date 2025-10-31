/**
 * Act III - Finale: "Eternal Garden" (v2)
 * A living, breathing garden with real day/night cycle, flocking flamingos,
 * and GPU-instanced flowers that grow at different rates.
 * Mobile-first, performant, romantic.
 */

import * as THREE from 'three';
import gsap from 'gsap';

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
    this.gameTime = 6; // Start at dawn (6 AM)
    this.timeScale = 0.012; // Speed of day/night cycle
    this.lastTime = performance.now() / 1000;

    // Garden state
    this.isComplete = false;
    this.seedQueue = [];
    this.lastPlantTick = 0;
    this.flowerCount = 0;
    this.maxFlowers = 32; // Mobile-optimized
    this.visitStartTime = null;

    // Flamingo state
    this.flamingosPresent = false;
    this.lastFlockCheck = 0;

    // Systems
    this.flowerSystem = null;
    this.flamingoSystem = null;
    this.fireflySystem = null;
    this.ground = null;
    this.stars = null;

    // Day/night palette
    this.palette = {
      dayTop: new THREE.Color(0x8fdff7),
      dayBottom: new THREE.Color(0xfff2d1),
      nightTop: new THREE.Color(0x071226),
      nightBottom: new THREE.Color(0x0b0e1a)
    };
  }

  /**
   * Detect mobile
   */
  isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 800;
  }

  /**
   * Show the puzzle
   */
  show() {
    this.element = this.createPuzzleElement();
    document.body.appendChild(this.element);

    // Initialize Three.js scene
    this.initScene();

    // Create garden base
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

    // Track visit time for reward
    this.visitStartTime = performance.now();

    // Auto-complete after 60 seconds of being in the garden
    setTimeout(() => {
      if (!this.isComplete) {
        this.complete();
      }
    }, 60000);
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

        <div class="garden-canvas-container">
          <!-- Three.js canvas will be inserted here -->
        </div>

        <div class="garden-time-indicator">
          <span class="current-time">Dawn</span>
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

    // Dynamic background for day/night cycle
    this.bgCanvas = document.createElement('canvas');
    this.bgCanvas.width = 2;
    this.bgCanvas.height = 256;
    this.bgContext = this.bgCanvas.getContext('2d');
    this.bgTexture = new THREE.CanvasTexture(this.bgCanvas);
    this.scene.background = this.bgTexture;

    // Camera
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    this.camera.position.set(0, 8, 25);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile() ? 1 : 1.5));
    container.appendChild(this.renderer.domElement);

    // Lighting
    this.ambientLight = new THREE.HemisphereLight(0xffffee, 0x0d1320, 0.55);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff1d8, 0.9);
    this.sunLight.position.set(10, 15, 10);
    this.scene.add(this.sunLight);

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Create garden base
   */
  createGardenBase() {
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3d1a,
      roughness: 0.95,
      metalness: 0.02
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -3;
    this.scene.add(this.ground);

    // Stars (appear at night)
    this.createStars();

    // GPU-instanced flower system
    this.flowerSystem = this.createFlowerSystem();
    this.scene.add(this.flowerSystem.mesh);

    // Flamingo flock system
    this.flamingoSystem = this.createFlamingoSystem();
    this.scene.add(this.flamingoSystem.group);

    // Fireflies
    this.fireflySystem = this.createFireflies();
    this.scene.add(this.fireflySystem.points);
  }

  /**
   * Create stars for night sky
   */
  createStars() {
    const starCount = this.isMobile() ? 100 : 200;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 150;
      positions[i * 3 + 1] = Math.random() * 50 + 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 150;
      sizes[i] = Math.random() * 0.8 + 0.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0,
      sizeAttenuation: true
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  /**
   * Create GPU-instanced flower system
   */
  createFlowerSystem() {
    const geometry = new THREE.PlaneGeometry(0.8, 0.8);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        time: { value: 0 },
        dayNightPhase: { value: 0 }
      },
      vertexShader: `
        attribute vec3 instancePos;
        attribute float instanceProgress;
        attribute float instanceHue;
        attribute float instanceScale;
        varying float vProgress;
        varying float vHue;

        void main() {
          vProgress = instanceProgress;
          vHue = instanceHue;
          vec3 pos = position;
          float s = instanceScale * (0.2 + 0.8 * instanceProgress);
          vec3 displaced = vec3(pos.x * s, pos.y * s, 0.0);
          vec4 mvPos = modelViewMatrix * vec4(instancePos + displaced, 1.0);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float dayNightPhase;
        varying float vProgress;
        varying float vHue;

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          vec2 uv = gl_PointCoord.xy - 0.5;
          float d = length(uv);
          float alpha = smoothstep(0.5, 0.0, d) * vProgress;

          vec3 color = hsv2rgb(vec3(vHue, 0.8, 0.9));
          // Glow more at night
          float glow = 1.0 + (1.0 - dayNightPhase) * 0.5;

          gl_FragColor = vec4(color * glow, alpha);
        }
      `
    });

    const mesh = new THREE.InstancedMesh(geometry, material, this.maxFlowers);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Instance attributes
    const instancePos = new Float32Array(this.maxFlowers * 3);
    const instanceProgress = new Float32Array(this.maxFlowers);
    const instanceHue = new Float32Array(this.maxFlowers);
    const instanceScale = new Float32Array(this.maxFlowers);

    for (let i = 0; i < this.maxFlowers; i++) {
      instancePos[i * 3] = 9999; // Offscreen
      instancePos[i * 3 + 1] = 9999;
      instancePos[i * 3 + 2] = 9999;
      instanceProgress[i] = 0;
      instanceHue[i] = Math.random();
      instanceScale[i] = 0.5 + Math.random() * 1.0;
    }

    geometry.setAttribute('instancePos', new THREE.InstancedBufferAttribute(instancePos, 3));
    geometry.setAttribute('instanceProgress', new THREE.InstancedBufferAttribute(instanceProgress, 1));
    geometry.setAttribute('instanceHue', new THREE.InstancedBufferAttribute(instanceHue, 1));
    geometry.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(instanceScale, 1));

    // Metadata
    const instancesMeta = new Array(this.maxFlowers).fill(0).map(() => ({
      busy: false,
      worldPos: new THREE.Vector3(),
      params: {}
    }));

    return {
      mesh,
      instancesMeta,
      allocate: (idx, worldPos) => {
        const meta = instancesMeta[idx];
        meta.busy = true;
        meta.worldPos.copy(worldPos);

        const posArray = geometry.attributes.instancePos.array;
        posArray[idx * 3] = worldPos.x;
        posArray[idx * 3 + 1] = worldPos.y;
        posArray[idx * 3 + 2] = worldPos.z;
        geometry.attributes.instancePos.needsUpdate = true;

        // Very slow, meditative growth (30-90 seconds)
        const growthDuration = 30 + Math.random() * 60;
        meta.params = {
          birth: performance.now() / 1000,
          growthDuration,
          bloomed: false
        };

        return meta;
      },
      update: (tNow) => {
        material.uniforms.time.value = tNow;

        const progressArray = geometry.attributes.instanceProgress.array;
        for (let i = 0; i < instancesMeta.length; i++) {
          const meta = instancesMeta[i];
          if (!meta.busy) continue;

          const dt = tNow - meta.params.birth;
          const progress = Math.min(dt / meta.params.growthDuration, 1);
          progressArray[i] = progress;

          // Trigger bloom callback
          if (progress >= 1 && !meta.params.bloomed) {
            meta.params.bloomed = true;
            this.playGrowthSound(1 + Math.random() * 0.5);
          }
        }
        geometry.attributes.instanceProgress.needsUpdate = true;
      }
    };
  }

  /**
   * Create flamingo flock system with boids behavior
   */
  createFlamingoSystem() {
    const group = new THREE.Group();
    group.position.y = 0;

    const boidCount = this.isMobile() ? 4 : 8;
    const boids = [];

    // Simple flamingo geometry
    const bodyGeo = new THREE.ConeGeometry(0.4, 0.9, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xff6b9d,
      roughness: 0.5,
      metalness: 0.1
    });

    for (let i = 0; i < boidCount; i++) {
      const mesh = new THREE.Mesh(bodyGeo, bodyMat);
      mesh.scale.setScalar(0.9 + Math.random() * 0.3);
      mesh.rotation.x = Math.PI;
      mesh.visible = false;

      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        -10,
        (Math.random() - 0.5) * 40
      );
      mesh.position.copy(pos);
      group.add(mesh);

      boids.push({
        mesh,
        pos: pos.clone(),
        vel: new THREE.Vector3(),
        state: 'idle',
        t: Math.random() * 10
      });
    }

    return {
      group,
      boids,
      spawn: () => {
        boids.forEach((b, i) => {
          b.mesh.visible = true;
          b.state = 'approach';
          // Start offscreen
          b.pos.set(
            (Math.random() - 0.5) * 60,
            15 + i * 2,
            -40 - i * 3
          );
          b.mesh.position.copy(b.pos);
        });
      },
      dismiss: () => {
        boids.forEach(b => {
          b.state = 'depart';
        });
      },
      update: (dt) => {
        const center = new THREE.Vector3(0, 2, 0);

        boids.forEach((b, idx) => {
          if (b.state === 'depart') {
            // Fly away upward
            b.pos.y += dt * 2;
            b.mesh.position.copy(b.pos);
            b.mesh.rotation.z += dt * 0.3;
            if (b.pos.y > 30) {
              b.mesh.visible = false;
            }
            return;
          }

          if (b.state === 'approach') {
            // Move toward center
            const target = center.clone().add(
              new THREE.Vector3(
                Math.sin(idx * 0.6) * 5,
                0,
                Math.cos(idx * 0.6) * 5
              )
            );
            b.pos.lerp(target, dt * 0.3);
            b.mesh.position.copy(b.pos);
            b.mesh.rotation.x = Math.sin(this.realTime * 0.5 + idx) * 0.2 + Math.PI;

            b.t += dt;
            if (b.t > 8) {
              b.state = 'idle';
              b.t = 0;
            }
            return;
          }

          // Idle - gentle bobbing
          b.pos.x += Math.sin(this.realTime * 0.3 + idx) * 0.015;
          b.pos.y += Math.sin(this.realTime * 0.4 + idx) * 0.01;
          b.mesh.position.copy(b.pos);
          b.mesh.rotation.z = Math.sin(this.realTime * 0.2 + idx) * 0.15;
        });
      }
    };
  }

  /**
   * Create fireflies
   */
  createFireflies() {
    const count = this.isMobile() ? 40 : 80;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = Math.random() * 20 - 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
      speeds[i] = 0.1 + Math.random() * 0.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));

    const material = new THREE.PointsMaterial({
      size: this.isMobile() ? 0.04 : 0.06,
      color: 0xfff1c8,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);

    return {
      points,
      update: (tNow) => {
        const posArray = geometry.attributes.position.array;
        const speedArray = geometry.attributes.speed.array;

        for (let i = 0; i < count; i++) {
          posArray[i * 3] += Math.sin(tNow * speedArray[i]) * 0.003;
          posArray[i * 3 + 1] += Math.cos(tNow * speedArray[i] * 0.7) * 0.004;
        }
        geometry.attributes.position.needsUpdate = true;
      }
    };
  }

  /**
   * Update sky gradient based on time of day
   */
  updateSkyAndLighting(hour) {
    // Normalize hour to 0-1
    const normalized = (Math.sin((hour / 24) * Math.PI * 2 - Math.PI / 2) + 1) / 2;

    // Lerp colors
    const top = new THREE.Color().copy(this.palette.dayTop).lerp(this.palette.nightTop, 1 - normalized);
    const bottom = new THREE.Color().copy(this.palette.dayBottom).lerp(this.palette.nightBottom, 1 - normalized);

    // Draw gradient
    const gradient = this.bgContext.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#' + top.getHexString());
    gradient.addColorStop(1, '#' + bottom.getHexString());
    this.bgContext.fillStyle = gradient;
    this.bgContext.fillRect(0, 0, 2, 256);
    this.bgTexture.needsUpdate = true;

    // Update lights
    const lightIntensity = Math.max(0.3, normalized);
    this.ambientLight.intensity = 0.3 + normalized * 0.6;
    this.sunLight.intensity = lightIntensity * 0.9;

    // Update stars opacity (visible at night)
    if (this.stars) {
      this.stars.material.opacity = (1 - normalized) * 0.9;
    }

    // Update flower shader day/night phase
    if (this.flowerSystem) {
      this.flowerSystem.mesh.material.uniforms.dayNightPhase.value = normalized;
    }

    // Update time display
    const timeText = this.element?.querySelector('.current-time');
    if (timeText) {
      let label = 'Dawn';
      if (hour >= 9 && hour < 17) label = 'Day';
      else if (hour >= 17 && hour < 20) label = 'Dusk';
      else if (hour >= 20 || hour < 6) label = 'Night';
      timeText.textContent = label;
    }
  }

  /**
   * Check flamingo arrival/departure based on time
   */
  checkFlamingoCycle(hour) {
    const dawnStart = 5.5;
    const dawnEnd = 9.0;
    const duskStart = 18.0;

    if (hour >= dawnStart && hour <= dawnEnd && !this.flamingosPresent) {
      this.flamingosPresent = true;
      this.flamingoSystem.spawn();
    } else if (hour >= duskStart && this.flamingosPresent) {
      this.flamingosPresent = false;
      this.flamingoSystem.dismiss();
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

    oscillator.frequency.setValueAtTime(300 * pitch, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(450 * pitch, this.audioContext.currentTime + 0.3);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }

  /**
   * Add event listeners
   */
  addEventListeners() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('click', (e) => this.onCanvasClick(e));

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
   * Handle canvas click - queue a seed
   */
  onCanvasClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast to ground
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const groundY = -3;
    const intersectPoint = new THREE.Vector3();

    const ray = this.raycaster.ray;
    const t = (groundY - ray.origin.y) / ray.direction.y;
    if (t > 0) {
      intersectPoint.copy(ray.origin).addScaledVector(ray.direction, t);

      // Queue seed for slow planting
      this.seedQueue.push({
        pos: intersectPoint.clone(),
        queuedAt: performance.now() / 1000
      });

      // Visual feedback
      this.createPlantingBurst(intersectPoint);
      this.playGrowthSound(0.8);
    }
  }

  /**
   * Create particle burst when planting
   */
  createPlantingBurst(position) {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.12, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0x8b4513,
        transparent: true,
        opacity: 1
      });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      particle.position.y = -2.8;

      this.scene.add(particle);

      const angle = (i / particleCount) * Math.PI * 2;
      const distance = 0.8 + Math.random() * 0.5;
      const targetX = position.x + Math.cos(angle) * distance;
      const targetZ = position.z + Math.sin(angle) * distance;

      gsap.to(particle.position, {
        x: targetX,
        z: targetZ,
        y: -2.5,
        duration: 0.5,
        ease: 'power2.out'
      });

      gsap.to(particle.material, {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      });
    }
  }

  /**
   * Process seed queue - very slow organic planting rate
   */
  processSeedQueue(tNow) {
    if (!this.seedQueue.length) return;

    // Slower planting rate for meditative feel
    const plantInterval = 3.5;
    if (tNow - this.lastPlantTick < plantInterval) return;

    this.lastPlantTick = tNow;
    const entry = this.seedQueue.shift();

    // Allocate flower instance
    if (this.flowerCount >= this.maxFlowers) {
      // Recycle oldest
      const idx = this.flowerCount % this.maxFlowers;
      this.flowerSystem.instancesMeta[idx].busy = false;
    }

    const idx = this.flowerCount % this.maxFlowers;
    this.flowerCount++;

    // Plant after longer delay
    setTimeout(() => {
      this.flowerSystem.allocate(idx, entry.pos);
    }, (4 + Math.random() * 6) * 1000);
  }

  /**
   * Complete the puzzle - reward just for visiting
   */
  async complete() {
    if (this.isComplete) return;
    this.isComplete = true;

    // Show peaceful message
    await this.showFinalMessage();

    // Give reward after message
    setTimeout(() => {
      if (this.onComplete) {
        this.onComplete();
      }
    }, 6000);
  }

  /**
   * Show final message
   */
  async showFinalMessage() {
    const finalEl = document.createElement('div');
    finalEl.className = 'garden-final';
    finalEl.innerHTML = `
      <div class="final-text">
        In gardens, time moves differently.<br>
        <br>
        Every seed you plant is an act of faith—<br>
        believing in growth you cannot rush,<br>
        beauty that unfolds in its own time.<br>
        <br>
        This garden will keep blooming,<br>
        just like we will.
      </div>
      <div class="final-signature">— Love, eternally</div>
    `;

    this.element.appendChild(finalEl);

    gsap.fromTo(finalEl,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 2.5, ease: 'power2.out' }
    );
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.isAnimating || !this.renderer) return;
    requestAnimationFrame(() => this.animate());

    const tNow = performance.now() / 1000;
    const dt = Math.min(0.05, tNow - this.lastTime);
    this.lastTime = tNow;
    this.realTime += dt;

    // Update game time (day/night cycle)
    this.gameTime = (this.gameTime + dt * this.timeScale) % 24;
    this.updateSkyAndLighting(this.gameTime);

    // Check flamingo cycle
    if (tNow - this.lastFlockCheck > 2.0) {
      this.lastFlockCheck = tNow;
      this.checkFlamingoCycle(this.gameTime);
    }

    // Process seed queue
    this.processSeedQueue(tNow);

    // Update systems
    if (this.flowerSystem) {
      this.flowerSystem.update(tNow);
    }
    if (this.flamingoSystem) {
      this.flamingoSystem.update(dt);
    }
    if (this.fireflySystem) {
      this.fireflySystem.update(tNow);
    }

    // Gentle camera sway
    this.camera.position.x = Math.sin(this.realTime * 0.08) * 2;
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
    // Give reward if they leave early
    if (!this.isComplete && this.onComplete) {
      this.onComplete();
    }

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
  background: #0a0a0a;
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
}

.garden-canvas-container {
  flex: 1;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
  position: relative;
  cursor: crosshair;
  touch-action: none;
}

.garden-time-indicator {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
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
    width: 100%;
    height: 100vh;
    height: 100dvh;
  }

  .garden-exit-btn {
    top: 1rem;
    right: 1rem;
    width: 40px;
    height: 40px;
  }

  .garden-canvas-container {
    border-radius: 0;
    border: none;
  }

  .garden-time-indicator {
    top: 1rem;
    left: 1rem;
    right: auto;
    padding: 0.4rem 0.8rem;
  }

  .current-time {
    font-size: 0.75rem;
  }

  .garden-final {
    padding: 2rem 1.5rem;
    max-width: 90%;
    max-height: 80vh;
  }

  .final-text {
    font-size: 1.1rem;
    line-height: 1.7;
  }

  .final-signature {
    font-size: 0.95rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
