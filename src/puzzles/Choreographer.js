/**
 * Act II - Puzzle 1: "The Choreographer"
 * a silhouette of a dancer mirrors her movements
 * She traces poses in the air, and when the dancer matches them, magic happens
 */

import * as THREE from 'three';
import gsap from 'gsap';
import confetti from 'canvas-confetti';

export class Choreographer {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.element = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = [];
    this.trailParticles = [];
    this.dancerParticles = [];
    this.mousePos = { x: 0, y: 0 };
    this.lastMousePos = { x: 0, y: 0 };
    this.isDrawing = false;
    this.poses = [];
    this.targetPoses = this.generateTargetPoses();
    this.completedPoses = 0;
    this.isComplete = false;
  }

  /**
   * Generate target poses that she needs to trace
   */
  generateTargetPoses() {
    // Three elegant poses: Circle, Figure-8, Heart
    return [
      { name: 'circle', points: this.generateCirclePoints(), matched: false },
      { name: 'wave', points: this.generateWavePoints(), matched: false },
      { name: 'heart', points: this.generateHeartPoints(), matched: false }
    ];
  }

  /**
   * Generate circle pose points - simplified for easier recognition
   */
  generateCirclePoints() {
    const points = [];
    const radius = 0.3;
    // Fewer points for more forgiving matching
    for (let i = 0; i <= 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      points.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      });
    }
    return points;
  }

  /**
   * Generate wave pose points
   */
  generateWavePoints() {
    const points = [];
    for (let i = 0; i <= 32; i++) {
      const t = i / 32;
      points.push({
        x: (t - 0.5) * 1.2,
        y: Math.sin(t * Math.PI * 3) * 0.2
      });
    }
    return points;
  }

  /**
   * Generate heart pose points - simplified V shape for easier recognition
   */
  generateHeartPoints() {
    const points = [];
    // Make a simple V or inverted triangle - much easier to draw
    const segments = 12;

    // Left side of V
    for (let i = 0; i <= segments / 2; i++) {
      const t = i / (segments / 2);
      points.push({
        x: -0.3 + t * 0.3,
        y: 0.2 - t * 0.4
      });
    }

    // Right side of V
    for (let i = 0; i <= segments / 2; i++) {
      const t = i / (segments / 2);
      points.push({
        x: t * 0.3,
        y: -0.2 + t * 0.4
      });
    }

    return points;
  }

  /**
   * Show the puzzle
   */
  show() {
    this.element = this.createPuzzleElement();
    document.body.appendChild(this.element);

    // Initialize Three.js scene
    this.initScene();

    // Add interaction handlers
    this.addEventListeners();

    // Animate in
    gsap.fromTo(this.element,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
        onComplete: () => {
          this.showInstructions();
        }
      }
    );

    // Start render loop
    this.animate();
  }

  /**
   * Create puzzle HTML
   */
  createPuzzleElement() {
    const puzzle = document.createElement('div');
    puzzle.className = 'choreographer-puzzle';
    puzzle.innerHTML = `
      <div class="choreographer-container">
        <div class="choreographer-header">
          <div class="puzzle-title">The Choreographer</div>
          <div class="puzzle-subtitle">Move your finger across the stage</div>
          <div class="puzzle-instruction">Trace ${this.targetPoses.length} elegant movements to awaken the dancer</div>
        </div>

        <div class="choreographer-canvas-container">
          <!-- Three.js canvas will be inserted here -->
        </div>

        <div class="choreographer-progress">
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: 0%"></div>
          </div>
          <div class="progress-text">0 of ${this.targetPoses.length} poses discovered</div>
        </div>

        <div class="choreographer-hint">
          <div class="hint-icon">✨</div>
          <div class="hint-text">Try drawing a circle, a wave, or a heart...</div>
        </div>
      </div>
    `;

    return puzzle;
  }

  /**
   * Initialize Three.js scene
   */
  initScene() {
    const container = this.element.querySelector('.choreographer-canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);

    // Camera
    this.camera = new THREE.OrthographicCamera(
      -1, 1, 1, -1, 0.1, 10
    );
    this.camera.position.z = 5;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Create particle system for dancer
    this.createDancerParticles();

    // Resize handler
    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Create dancer particle system
   */
  createDancerParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(300 * 3); // 300 particles
    const colors = new Float32Array(300 * 3);
    const sizes = new Float32Array(300);

    // Initialize particles in a humanoid silhouette
    for (let i = 0; i < 300; i++) {
      // Random position within humanoid shape
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.3;
      const height = (Math.random() - 0.5) * 1.5;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = 0;

      // Gradient colors (pink to gold)
      const t = (height + 0.75) / 1.5;
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.4 + t * 0.4;
      colors[i * 3 + 2] = 0.6 + t * 0.3;

      sizes[i] = 0.02 + Math.random() * 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: false
    });

    this.dancerParticles = new THREE.Points(geometry, material);
    this.dancerParticles.position.set(0.5, 0, 0);
    this.scene.add(this.dancerParticles);

    // Animate dancer idle movement
    gsap.to(this.dancerParticles.position, {
      y: 0.05,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }

  /**
   * Add event listeners for interaction
   */
  addEventListeners() {
    const canvas = this.renderer.domElement;

    // Mouse events
    canvas.addEventListener('mousedown', (e) => this.onInteractionStart(e));
    canvas.addEventListener('mousemove', (e) => this.onInteractionMove(e));
    canvas.addEventListener('mouseup', () => this.onInteractionEnd());
    canvas.addEventListener('mouseleave', () => this.onInteractionEnd());

    // Touch events (mobile)
    canvas.addEventListener('touchstart', (e) => this.onInteractionStart(e.touches[0]), { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.onInteractionMove(e.touches[0]);
    }, { passive: false });
    canvas.addEventListener('touchend', () => this.onInteractionEnd());
  }

  /**
   * Handle interaction start
   */
  onInteractionStart(e) {
    this.isDrawing = true;
    this.poses = [];
    this.updateMousePosition(e);
  }

  /**
   * Handle interaction move
   */
  onInteractionMove(e) {
    if (!this.isDrawing) return;

    this.updateMousePosition(e);

    // Create trail particle
    this.createTrailParticle(this.mousePos.x, this.mousePos.y);

    // Record pose
    this.poses.push({ x: this.mousePos.x, y: this.mousePos.y, time: Date.now() });

    // Mirror dancer movement (with delay)
    this.moveDancer(this.mousePos.x, this.mousePos.y);
  }

  /**
   * Handle interaction end
   */
  onInteractionEnd() {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    // Check if pose matches any target
    this.checkPoseMatch();
  }

  /**
   * Update mouse position
   */
  updateMousePosition(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.lastMousePos = { ...this.mousePos };
    this.mousePos = {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1
    };
  }

  /**
   * Create beautiful trail particle
   */
  createTrailParticle(x, y) {
    const geometry = new THREE.CircleGeometry(0.03, 16); // Larger particles
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1.0, 0.7, 0.8),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    const particle = new THREE.Mesh(geometry, material);
    particle.position.set(x, y, 0);
    this.scene.add(particle);

    // Fade out and shrink - longer duration so trail is visible
    gsap.to(particle.scale, {
      x: 0,
      y: 0,
      duration: 2.5, // Increased from 1 to 2.5 seconds
      ease: 'power2.in'
    });

    gsap.to(particle.material, {
      opacity: 0,
      duration: 2.5, // Increased from 1 to 2.5 seconds
      ease: 'power2.in',
      onComplete: () => {
        this.scene.remove(particle);
        geometry.dispose();
        material.dispose();
      }
    });

    this.trailParticles.push(particle);
  }

  /**
   * Move dancer to mirror user's movement
   */
  moveDancer(x, y) {
    gsap.to(this.dancerParticles.position, {
      x: x * 0.8,
      y: y * 0.8,
      duration: 0.3,
      ease: 'power2.out'
    });

    // Slight rotation based on movement direction
    const dx = x - this.lastMousePos.x;
    const dy = y - this.lastMousePos.y;
    const rotation = Math.atan2(dy, dx);

    gsap.to(this.dancerParticles.rotation, {
      z: rotation * 0.1,
      duration: 0.3,
      ease: 'power2.out'
    });
  }

  /**
   * Check if drawn pose matches any target pose
   */
  checkPoseMatch() {
    if (this.poses.length < 5) return; // Lowered from 10 to 5 - super forgiving

    // Normalize poses
    const normalized = this.normalizePose(this.poses);

    // Check each target pose
    for (let i = 0; i < this.targetPoses.length; i++) {
      const target = this.targetPoses[i];
      if (target.matched) continue;

      const similarity = this.calculateSimilarity(normalized, target.points);

      // Debug log to help troubleshoot
      console.log(`🎨 Testing ${target.name}: similarity = ${similarity.toFixed(3)} (need > 0.25)`);

      if (similarity > 0.25) { // Lowered from 0.40 to 0.25 - VERY forgiving
        console.log(`✅ MATCH! Recognized ${target.name}`);
        this.onPoseMatched(i);
        break;
      }
    }
  }

  /**
   * Normalize pose for comparison
   */
  normalizePose(poses) {
    // Find bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    poses.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const scale = Math.max(width, height);

    // Normalize to unit square
    return poses.map(p => ({
      x: (p.x - minX) / scale - 0.5,
      y: (p.y - minY) / scale - 0.5
    }));
  }

  /**
   * Calculate similarity between two poses
   */
  calculateSimilarity(pose1, pose2) {
    // Resample to same number of points
    const samples = 32;
    const p1 = this.resamplePose(pose1, samples);
    const p2 = this.resamplePose(pose2, samples);

    // Calculate average distance
    let totalDist = 0;
    for (let i = 0; i < samples; i++) {
      const dx = p1[i].x - p2[i].x;
      const dy = p1[i].y - p2[i].y;
      totalDist += Math.sqrt(dx * dx + dy * dy);
    }

    const avgDist = totalDist / samples;
    const similarity = Math.max(0, 1 - avgDist * 2);

    return similarity;
  }

  /**
   * Resample pose to fixed number of points
   */
  resamplePose(pose, count) {
    const result = [];
    const len = pose.length;

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const index = t * (len - 1);
      const i1 = Math.floor(index);
      const i2 = Math.min(i1 + 1, len - 1);
      const frac = index - i1;

      result.push({
        x: pose[i1].x + (pose[i2].x - pose[i1].x) * frac,
        y: pose[i1].y + (pose[i2].y - pose[i1].y) * frac
      });
    }

    return result;
  }

  /**
   * Handle pose matched
   */
  onPoseMatched(index) {
    this.targetPoses[index].matched = true;
    this.completedPoses++;

    // Visual celebration
    this.celebratePose(this.targetPoses[index].name);

    // Update progress
    this.updateProgress();

    // Check if all poses completed
    if (this.completedPoses >= this.targetPoses.length) {
      this.complete();
    }
  }

  /**
   * Celebrate pose match
   */
  celebratePose(poseName) {
    // Flash effect on dancer
    gsap.to(this.dancerParticles.material, {
      opacity: 1,
      duration: 0.2,
      yoyo: true,
      repeat: 3,
      ease: 'power2.inOut'
    });

    // Show pose name
    const hint = this.element.querySelector('.hint-text');
    hint.textContent = `Beautiful! You traced a ${poseName}`;

    setTimeout(() => {
      if (this.completedPoses < this.targetPoses.length) {
        hint.textContent = 'Try another movement...';
      }
    }, 2000);
  }

  /**
   * Update progress display
   */
  updateProgress() {
    const progress = (this.completedPoses / this.targetPoses.length) * 100;

    gsap.to(this.element.querySelector('.progress-bar-fill'), {
      width: `${progress}%`,
      duration: 0.8,
      ease: 'power2.out'
    });

    this.element.querySelector('.progress-text').textContent =
      `${this.completedPoses} of ${this.targetPoses.length} poses discovered`;
  }

  /**
   * Complete the puzzle
   */
  async complete() {
    if (this.isComplete) return;
    this.isComplete = true;

    // Final celebration - crown of light
    this.createCrownOfLight();

    // Wait a moment for celebration, then complete (removed built-in poem - shown in main reward)
    setTimeout(() => {
      if (this.onComplete) {
        this.onComplete();
      }
      this.hide();
    }, 3000);
  }

  /**
   * Create crown of light effect
   */
  createCrownOfLight() {
    // Create ring of particles above dancer
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const radius = 0.5;

      const geometry = new THREE.CircleGeometry(0.03, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(1.0, 0.85, 0.3),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.position.set(
        Math.cos(angle) * radius,
        0.7 + Math.sin(angle) * 0.1,
        0
      );
      this.scene.add(particle);

      // Animate in
      gsap.to(particle.material, {
        opacity: 0.9,
        duration: 0.5,
        delay: i * 0.03,
        ease: 'power2.out'
      });

      // Rotate
      gsap.to(particle.position, {
        x: Math.cos(angle + Math.PI * 0.2) * radius,
        y: 0.7 + Math.sin(angle + Math.PI * 0.2) * 0.1,
        duration: 2,
        repeat: -1,
        ease: 'none'
      });
    }
  }

  /**
   * Show poem lines
   */
  async showPoemLines() {
    const poemEl = document.createElement('div');
    poemEl.className = 'choreographer-poem';
    poemEl.innerHTML = `
      <div class="poem-line">We move through the same quiet rhythm,</div>
      <div class="poem-line">even when silence keeps the beat.</div>
    `;

    this.element.appendChild(poemEl);

    gsap.fromTo(poemEl,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.5, ease: 'power2.out' }
    );
  }

  /**
   * Show instructions
   */
  showInstructions() {
    const hint = this.element.querySelector('.choreographer-hint');
    gsap.fromTo(hint,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.5,
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

    // Gentle particle movement
    if (this.dancerParticles) {
      const time = Date.now() * 0.001;
      const positions = this.dancerParticles.geometry.attributes.position.array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time + i) * 0.0005;
      }

      this.dancerParticles.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize
   */
  onResize() {
    if (!this.renderer) return;

    const container = this.element.querySelector('.choreographer-canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

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
      }
    });
  }
}

// Styles
const styles = `
.choreographer-puzzle {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
}

.choreographer-container {
  width: 90%;
  max-width: 900px;
  height: 85vh;
  display: flex;
  flex-direction: column;
}

.choreographer-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.choreographer-canvas-container {
  flex: 1;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  background: #0a0a0a;
  touch-action: none;
  cursor: crosshair;
}

.choreographer-progress {
  margin-top: 1.5rem;
  text-align: center;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFB6C1 0%, #FFD700 100%);
  border-radius: 4px;
  transition: width 0.8s ease;
}

.progress-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.7);
}

.choreographer-hint {
  margin-top: 1rem;
  text-align: center;
  opacity: 0;
}

.hint-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  animation: float 3s ease-in-out infinite;
}

.hint-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 300;
  font-style: italic;
  color: rgba(255, 255, 255, 0.6);
}

.choreographer-poem {
  position: absolute;
  bottom: 8rem;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  max-width: 600px;
}

.poem-line {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 400;
  font-style: italic;
  color: var(--color-primary, #FFF8F0);
  line-height: 1.8;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.8);
}

@media (max-width: 768px) {
  .choreographer-container {
    width: 95%;
    height: 90vh;
  }

  .choreographer-canvas-container {
    border-radius: 12px;
  }

  .poem-line {
    font-size: 1.25rem;
  }

  .choreographer-poem {
    bottom: 6rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
