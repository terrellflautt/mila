/**
 * Act III - Puzzle 2: "Mirror of Moments"
 * Fragmented glass pieces that she brings together
 * Each piece holds a memory, together they form the complete picture
 */

import * as THREE from 'three';
import gsap from 'gsap';
import confetti from 'canvas-confetti';

export class MirrorOfMoments {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.element = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.fragments = [];
    this.connectedFragments = [];
    this.draggedFragment = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isComplete = false;
    this.totalFragments = 12; // Heart shape with varied pieces
    this.audioContext = null;
  }

  /**
   * Show the puzzle
   */
  show() {
    this.element = this.createPuzzleElement();
    document.body.appendChild(this.element);

    // Initialize Three.js scene
    this.initScene();

    // Create fragments
    this.createFragments();

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
    puzzle.className = 'mirror-puzzle';
    puzzle.innerHTML = `
      <div class="mirror-container">
        <button class="mirror-exit-btn" title="Exit">✕</button>
        <div class="mirror-header">
          <div class="puzzle-title">Mirror of Moments</div>
          <div class="puzzle-subtitle">Drag pieces together</div>
        </div>

        <div class="mirror-canvas-container">
          <!-- Three.js canvas will be inserted here -->
        </div>

        <div class="mirror-progress">
          <div class="progress-text">${this.connectedFragments.length} of ${this.totalFragments} pieces</div>
        </div>
      </div>
    `;

    return puzzle;
  }

  /**
   * Initialize Three.js scene
   */
  initScene() {
    const container = this.element.querySelector('.mirror-canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.z = 25;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xaaccff, 1, 100);
    pointLight.position.set(0, 0, 20);
    this.scene.add(pointLight);

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Create mirror fragments - Heart shape with origami-like varied pieces
   */
  createFragments() {
    // Define heart-shaped puzzle pieces with varied origami shapes
    // Each piece has: position, shape vertices, and type
    const heartPieces = [
      // Top left curve - irregular pentagon
      { x: -4, y: 3, shape: 'pentagon', rotation: 0.3, scale: 1.1 },
      // Top center left - triangle
      { x: -2, y: 4, shape: 'triangle', rotation: 0, scale: 1.2 },
      // Top center right - triangle
      { x: 2, y: 4, shape: 'triangle', rotation: 0, scale: 1.2 },
      // Top right curve - irregular pentagon
      { x: 4, y: 3, shape: 'pentagon', rotation: -0.3, scale: 1.1 },
      // Middle left - trapezoid
      { x: -3.5, y: 1, shape: 'trapezoid', rotation: 0.2, scale: 1.3 },
      // Middle center - diamond
      { x: 0, y: 1.5, shape: 'diamond', rotation: 0, scale: 1.4 },
      // Middle right - trapezoid
      { x: 3.5, y: 1, shape: 'trapezoid', rotation: -0.2, scale: 1.3 },
      // Lower middle left - irregular quad
      { x: -2.5, y: -1, shape: 'quad', rotation: 0.1, scale: 1.3 },
      // Lower middle right - irregular quad
      { x: 2.5, y: -1, shape: 'quad', rotation: -0.1, scale: 1.3 },
      // Bottom left - kite
      { x: -1.5, y: -3, shape: 'kite', rotation: 0.4, scale: 1.2 },
      // Bottom right - kite
      { x: 1.5, y: -3, shape: 'kite', rotation: -0.4, scale: 1.2 },
      // Heart point - small triangle
      { x: 0, y: -5, shape: 'triangle', rotation: Math.PI, scale: 1.0 }
    ];

    heartPieces.forEach((piece, index) => {
      // Create ghost outline
      this.createGhostOutline(piece.x, piece.y, piece.shape, piece.rotation, piece.scale);

      const fragment = this.createFragment(index, piece.x, piece.y, piece.shape, piece.rotation, piece.scale);
      this.fragments.push(fragment);
      this.scene.add(fragment.group);
    });
  }

  /**
   * Create origami-shaped geometry based on shape type
   */
  createOrigamiShape(shapeType, scale = 1) {
    const size = 2 * scale;
    let shape;

    switch (shapeType) {
      case 'triangle':
        shape = new THREE.Shape();
        shape.moveTo(0, size * 0.7);
        shape.lineTo(-size * 0.6, -size * 0.5);
        shape.lineTo(size * 0.6, -size * 0.5);
        shape.lineTo(0, size * 0.7);
        break;

      case 'pentagon':
        shape = new THREE.Shape();
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * size * 0.6;
          const y = Math.sin(angle) * size * 0.6;
          if (i === 0) shape.moveTo(x, y);
          else shape.lineTo(x, y);
        }
        break;

      case 'trapezoid':
        shape = new THREE.Shape();
        shape.moveTo(-size * 0.6, size * 0.4);
        shape.lineTo(size * 0.6, size * 0.4);
        shape.lineTo(size * 0.4, -size * 0.4);
        shape.lineTo(-size * 0.4, -size * 0.4);
        shape.lineTo(-size * 0.6, size * 0.4);
        break;

      case 'diamond':
        shape = new THREE.Shape();
        shape.moveTo(0, size * 0.7);
        shape.lineTo(size * 0.5, 0);
        shape.lineTo(0, -size * 0.7);
        shape.lineTo(-size * 0.5, 0);
        shape.lineTo(0, size * 0.7);
        break;

      case 'quad':
        shape = new THREE.Shape();
        shape.moveTo(-size * 0.5, size * 0.6);
        shape.lineTo(size * 0.6, size * 0.4);
        shape.lineTo(size * 0.4, -size * 0.5);
        shape.lineTo(-size * 0.6, -size * 0.4);
        shape.lineTo(-size * 0.5, size * 0.6);
        break;

      case 'kite':
        shape = new THREE.Shape();
        shape.moveTo(0, size * 0.8);
        shape.lineTo(size * 0.4, 0);
        shape.lineTo(0, -size * 0.4);
        shape.lineTo(-size * 0.4, 0);
        shape.lineTo(0, size * 0.8);
        break;

      default:
        shape = new THREE.Shape();
        shape.moveTo(-size * 0.5, size * 0.5);
        shape.lineTo(size * 0.5, size * 0.5);
        shape.lineTo(size * 0.5, -size * 0.5);
        shape.lineTo(-size * 0.5, -size * 0.5);
    }

    return new THREE.ShapeGeometry(shape);
  }

  /**
   * Create ghost outline showing target position
   */
  createGhostOutline(x, y, shapeType, rotation, scale) {
    const geometry = this.createOrigamiShape(shapeType, scale);
    const material = new THREE.MeshBasicMaterial({
      color: 0x88ddff,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    const ghost = new THREE.Mesh(geometry, material);
    ghost.position.set(x, y, -0.5);
    ghost.rotation.z = rotation;

    // Edge outline
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x88ddff,
      transparent: true,
      opacity: 0.3
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    ghost.add(edges);

    // Gentle pulse animation
    gsap.to(material, {
      opacity: 0.25,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    this.scene.add(ghost);
  }

  /**
   * Create individual fragment
   */
  createFragment(index, targetX, targetY, shapeType, targetRotation, scale) {
    const group = new THREE.Group();

    // Scatter fragments initially - Keep within safe view bounds
    const scatterRadius = 10; // Reduced to keep pieces on screen
    const angle = (index / this.totalFragments) * Math.PI * 2;
    group.position.x = Math.cos(angle) * scatterRadius;
    group.position.y = Math.sin(angle) * scatterRadius;
    group.position.z = 0; // Keep fragments at same depth for easier dragging

    // Random initial rotation
    group.rotation.x = (Math.random() - 0.5) * Math.PI * 0.5;
    group.rotation.y = (Math.random() - 0.5) * Math.PI * 0.5;
    group.rotation.z = (Math.random() - 0.5) * Math.PI;

    // Origami fragment geometry with varied shapes
    const geometry = this.createOrigamiShape(shapeType, scale);

    // Shader material for glass effect
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        hue: { value: index / this.totalFragments },
        opacity: { value: 0.8 }
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
        uniform float hue;
        uniform float opacity;
        varying vec2 vUv;

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          vec2 uv = vUv;

          // Origami fold lines (diagonal creases)
          float fold1 = abs(sin((uv.x + uv.y) * 3.14159)) * 0.5;
          float fold2 = abs(sin((uv.x - uv.y) * 3.14159)) * 0.5;
          float folds = smoothstep(0.45, 0.5, fold1) + smoothstep(0.45, 0.5, fold2);
          folds *= 0.15;

          // Paper texture (subtle)
          float paper = sin(uv.x * 100.0) * sin(uv.y * 100.0) * 0.05 + 0.95;

          // Glass refraction effect (reduced for paper feel)
          float distortion = sin(uv.x * 10.0 + time) * 0.01;
          uv.y += distortion;

          // Edge glow
          float edge = length(uv - 0.5) * 2.0;
          float glow = 1.0 - smoothstep(0.7, 1.0, edge);

          // Color based on position - softer colors for origami
          vec3 color = hsv2rgb(vec3(hue + time * 0.05, 0.5, 0.95));
          color += vec3(1.0) * glow * 0.2;
          color *= paper; // Apply paper texture
          color -= vec3(folds); // Darken along fold lines

          // Paper-like opacity (less transparent than glass)
          float alpha = opacity * (0.75 + glow * 0.25);

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);

    // Edge highlight
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.4
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    group.add(edges);

    // Gentle floating animation (reduced movement)
    gsap.to(group.position, {
      z: group.position.z + (Math.random() - 0.5) * 0.5,
      duration: 2 + Math.random(),
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    return {
      group,
      mesh,
      material,
      targetX,
      targetY,
      targetRotation,
      shapeType,
      index,
      connected: false,
      homeDistance: 8.0 // Distance to snap home (very forgiving)
    };
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
   * Play connection chime
   */
  playChime(frequency = 523.25) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 2, this.audioContext.currentTime + 0.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);

    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.6);
  }

  /**
   * Add event listeners
   */
  addEventListeners() {
    const canvas = this.renderer.domElement;

    // Exit button
    const exitBtn = this.element.querySelector('.mirror-exit-btn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.hide());
    }

    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.onMouseUp(e);
    }, { passive: false });
  }

  /**
   * Handle mouse down
   */
  onMouseDown(event) {
    this.updateMousePosition(event);

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.fragments.map(f => f.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const intersectedMesh = intersects[0].object;
      const fragment = this.fragments.find(f => f.mesh === intersectedMesh);

      if (fragment && !fragment.connected) {
        this.draggedFragment = fragment;

        // Visual feedback
        gsap.to(fragment.group.scale, {
          x: 1.1,
          y: 1.1,
          z: 1.1,
          duration: 0.3,
          ease: 'back.out(2)'
        });

        gsap.to(fragment.material.uniforms.opacity, {
          value: 1,
          duration: 0.3
        });
      }
    }
  }

  /**
   * Handle mouse move
   */
  onMouseMove(event) {
    this.updateMousePosition(event);

    if (this.draggedFragment) {
      // Convert mouse position to world coordinates
      const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
      vector.unproject(this.camera);

      const dir = vector.sub(this.camera.position).normalize();
      const distance = -this.camera.position.z / dir.z;
      const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));

      // Calculate distance to home
      const dx = pos.x - this.draggedFragment.targetX;
      const dy = pos.y - this.draggedFragment.targetY;
      const distToHome = Math.sqrt(dx * dx + dy * dy);

      // Magnetic attraction when close to home
      if (distToHome < this.draggedFragment.homeDistance * 1.5) {
        const attractStrength = 1 - (distToHome / (this.draggedFragment.homeDistance * 1.5));
        pos.x = pos.x - dx * attractStrength * 0.3;
        pos.y = pos.y - dy * attractStrength * 0.3;
      }

      this.draggedFragment.group.position.x = pos.x;
      this.draggedFragment.group.position.y = pos.y;
    }
  }

  /**
   * Handle mouse up
   */
  onMouseUp(event) {
    if (this.draggedFragment) {
      this.checkSnap(this.draggedFragment);

      // Reset scale
      gsap.to(this.draggedFragment.group.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.3,
        ease: 'power2.out'
      });

      this.draggedFragment = null;
    }
  }

  /**
   * Update mouse position
   */
  updateMousePosition(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * Check if fragment should snap to home
   */
  checkSnap(fragment) {
    const dx = fragment.group.position.x - fragment.targetX;
    const dy = fragment.group.position.y - fragment.targetY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < fragment.homeDistance) {
      this.snapToHome(fragment);
    }
  }

  /**
   * Snap fragment to home position
   */
  snapToHome(fragment) {
    fragment.connected = true;
    this.connectedFragments.push(fragment);

    // Animate to exact position
    gsap.to(fragment.group.position, {
      x: fragment.targetX,
      y: fragment.targetY,
      z: 0,
      duration: 0.5,
      ease: 'back.out(1.5)'
    });

    // Rotate to target rotation (origami pieces need correct orientation)
    gsap.to(fragment.group.rotation, {
      x: 0,
      y: 0,
      z: fragment.targetRotation,
      duration: 0.5,
      ease: 'power2.out'
    });

    // Visual feedback
    gsap.to(fragment.material.uniforms.opacity, {
      value: 0.9,
      duration: 0.5
    });

    // Play chime (higher pitch for each piece)
    const baseFreq = 523.25; // C5
    const freq = baseFreq * Math.pow(2, fragment.index / 12);
    this.playChime(freq);

    // Light burst
    this.createLightBurst(fragment.group.position);

    // Update progress
    this.updateProgress();

    // Check completion
    if (this.connectedFragments.length >= this.totalFragments) {
      setTimeout(() => {
        this.complete();
      }, 1000);
    }
  }

  /**
   * Create light burst effect
   */
  createLightBurst(position) {
    const particleCount = 16;
    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.15, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.7),
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
        z: position.z + (Math.random() - 0.5) * 2,
        duration: 1,
        ease: 'power2.out'
      });

      gsap.to(particle.material, {
        opacity: 0,
        duration: 1,
        onComplete: () => {
          this.scene.remove(particle);
          geometry.dispose();
          material.dispose();
        }
      });
    }
  }

  /**
   * Update progress display
   */
  updateProgress() {
    const progressText = this.element.querySelector('.progress-text');
    progressText.textContent = `${this.connectedFragments.length} of ${this.totalFragments} pieces united`;

    gsap.fromTo(progressText,
      { scale: 1.2, color: '#88ddff' },
      { scale: 1, color: '', duration: 0.5, ease: 'back.out(2)' }
    );
  }

  /**
   * Complete the puzzle
   */
  async complete() {
    if (this.isComplete) return;
    this.isComplete = true;

    // Merge all fragments into one
    await this.mergeFragments();

    // Grand confetti
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.5 },
      colors: ['#88ddff', '#aaccff', '#ffffff', '#FFB6C1']
    });

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
   * Merge all fragments with beautiful animation
   */
  async mergeFragments() {
    // Bring all pieces to zero rotation
    this.fragments.forEach(fragment => {
      gsap.to(fragment.group.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 1,
        ease: 'power2.inOut'
      });

      gsap.to(fragment.material.uniforms.opacity, {
        value: 1,
        duration: 1
      });
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Unified glow
    this.fragments.forEach(fragment => {
      gsap.to(fragment.material.uniforms.hue, {
        value: 0.55, // Unified cyan-blue
        duration: 2
      });
    });

    // Play ascending chord
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C major chord
    frequencies.forEach((freq, i) => {
      setTimeout(() => this.playChime(freq), i * 150);
    });
  }

  /**
   * Show final message
   */
  async showFinalMessage() {
    const finalEl = document.createElement('div');
    finalEl.className = 'mirror-final';
    finalEl.innerHTML = `
      <div class="final-text">
        What seemed broken was never fractured—<br>
        just waiting to be seen as whole.<br>
        <br>
        Every piece was always part of this:<br>
        a mirror showing what we've become.
      </div>
    `;

    this.element.appendChild(finalEl);

    gsap.fromTo(finalEl,
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1,
        scale: 1,
        duration: 1.5,
        ease: 'power2.out'
      }
    );
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.renderer) return;

    requestAnimationFrame(() => this.animate());

    const time = Date.now() * 0.001;

    // Update fragment shaders
    this.fragments.forEach(fragment => {
      fragment.material.uniforms.time.value = time;
    });

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize
   */
  onResize() {
    if (!this.renderer) return;

    const container = this.element.querySelector('.mirror-canvas-container');
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
    gsap.to(this.element, {
      opacity: 0,
      duration: 1,
      ease: 'power2.in',
      onComplete: () => {
        if (this.element && this.element.parentNode) {
          this.element.remove();
        }

        // Cleanup
        if (this.renderer) {
          this.renderer.dispose();
          this.scene.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
          });
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
.mirror-puzzle {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  background: radial-gradient(circle at 50% 50%, #2a2a4a 0%, #1a1a2e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mirror-container {
  width: 90%;
  max-width: 1200px;
  height: 85vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.mirror-exit-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 100;
}

.mirror-exit-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(136, 221, 255, 0.6);
  transform: scale(1.1) rotate(90deg);
}

.mirror-header {
  text-align: center;
  margin-bottom: 1rem;
}

.mirror-canvas-container {
  flex: 1;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid rgba(136, 221, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 60px rgba(136, 221, 255, 0.1);
  position: relative;
  cursor: grab;
}

.mirror-canvas-container:active {
  cursor: grabbing;
}

.mirror-progress {
  margin-top: 0.75rem;
  text-align: center;
}

.progress-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.85rem;
  color: var(--color-secondary, #FFE4E1);
  opacity: 0.8;
}

.mirror-final {
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
  box-shadow: 0 0 60px rgba(136, 221, 255, 0.3);
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

@media (max-width: 768px) {
  .mirror-container {
    width: 95%;
    height: 80vh;
    padding-top: 1rem;
  }

  .mirror-header {
    margin-bottom: 0.5rem;
  }

  .puzzle-title {
    font-size: 1.8rem;
  }

  .puzzle-subtitle {
    font-size: 0.9rem;
  }

  .final-text {
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .mirror-container {
    height: 75vh;
  }

  .puzzle-title {
    font-size: 1.5rem;
  }

  .puzzle-subtitle {
    font-size: 0.8rem;
  }

  .final-text {
    font-size: 1.1rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
