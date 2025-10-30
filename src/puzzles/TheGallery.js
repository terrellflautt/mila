/**
 * Act II - Puzzle 2: "The Gallery of Us"
 * GLSL shader-based gallery frames that react to proximity and dwell time
 */

import * as THREE from 'three';
import gsap from 'gsap';
import confetti from 'canvas-confetti';

export class TheGallery {
  constructor(stage, onComplete) {
    this.stage = stage;
    this.onComplete = onComplete;

    // Gallery frames
    this.frames = [];
    this.frameCount = 5;
    this.clarityThreshold = 0.75; // How "warm" a frame needs to be

    // State
    this.isActive = false;
    this.completedFrames = 0;

    // UI
    this.ui = null;

    // Completion callback
    this._completionCallback = null;
  }

  /**
   * Start the puzzle
   */
  start() {
    this.isActive = true;
    this.createGalleryFrames();
    this.createUI();
    this.animateEntrance();
    this.updateLoop();
  }

  /**
   * Create gallery frames with shaders
   */
  createGalleryFrames() {
    const positions = [
      { x: -3, y: 1.5, z: -2 },
      { x: -1.5, y: 0.8, z: -1.5 },
      { x: 0, y: 1.2, z: -2.2 },
      { x: 1.5, y: 0.9, z: -1.8 },
      { x: 3, y: 1.6, z: -2.5 }
    ];

    positions.forEach((pos, i) => {
      const frame = this.createFrame(i);
      frame.position.set(pos.x, pos.y, pos.z);
      this.stage.scene.add(frame);
      this.frames.push({
        mesh: frame,
        warmth: 0, // 0 = cool, 1 = warm
        dwellTime: 0,
        clarified: false
      });
    });
  }

  /**
   * Create a single frame with custom shader
   */
  createFrame(index) {
    const geometry = new THREE.PlaneGeometry(1.2, 1.6, 32, 32);

    // Custom shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        warmth: { value: 0 },
        hue: { value: 200 + index * 30 }, // Start with cool colors
        pointerDistance: { value: 1.0 }
      },
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.frameIndex = index;

    // Add frame border
    const borderGeo = new THREE.PlaneGeometry(1.3, 1.7);
    const borderMat = new THREE.MeshBasicMaterial({
      color: 0x4a4a6a,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.z = -0.01;
    mesh.add(border);

    return mesh;
  }

  /**
   * Vertex shader for animated frames
   */
  getVertexShader() {
    return `
      varying vec2 vUv;
      varying vec3 vPosition;
      uniform float time;
      uniform float warmth;

      void main() {
        vUv = uv;
        vPosition = position;

        // Subtle wave animation
        vec3 pos = position;
        pos.z += sin(position.x * 2.0 + time) * 0.02 * (1.0 - warmth * 0.5);
        pos.z += cos(position.y * 2.0 + time * 1.3) * 0.02 * (1.0 - warmth * 0.5);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;
  }

  /**
   * Fragment shader for color shifting
   */
  getFragmentShader() {
    return `
      varying vec2 vUv;
      varying vec3 vPosition;
      uniform float time;
      uniform float warmth;
      uniform float hue;
      uniform float pointerDistance;

      // HSL to RGB conversion
      vec3 hsl2rgb(vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
        return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
      }

      // Noise function
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        // Animated noise
        vec2 st = vUv * 3.0;
        float n = noise(st + time * 0.2);
        n += 0.5 * noise(st * 2.0 - time * 0.15);
        n += 0.25 * noise(st * 4.0 + time * 0.1);
        n /= 1.75;

        // Shift hue from cool to warm based on warmth
        float currentHue = mix(hue, hue - 180.0, warmth); // Cool blues to warm oranges
        currentHue = mod(currentHue, 360.0) / 360.0;

        // Increase saturation and lightness with warmth
        float saturation = mix(0.3, 0.7, warmth);
        float lightness = mix(0.3, 0.6, warmth);

        // Apply noise to create texture
        lightness = mix(lightness * 0.5, lightness * 1.2, n);

        // Convert HSL to RGB
        vec3 color = hsl2rgb(vec3(currentHue, saturation, lightness));

        // Add glow effect when warm
        float glow = warmth * 0.4;
        color += vec3(glow * 0.3, glow * 0.2, 0.0);

        // Fade edges
        float edgeFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
        edgeFade *= smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);

        // Proximity glow
        float proximityGlow = 1.0 - pointerDistance;
        proximityGlow = pow(proximityGlow, 3.0) * 0.3;
        color += vec3(proximityGlow);

        float alpha = edgeFade * mix(0.6, 0.9, warmth);

        gl_FragColor = vec4(color, alpha);
      }
    `;
  }

  /**
   * Create UI overlay
   */
  createUI() {
    this.ui = document.createElement('div');
    this.ui.className = 'gallery-ui';
    this.ui.innerHTML = `
      <div class="gallery-header">
        <div class="puzzle-title">The Gallery of Us</div>
        <div class="puzzle-instruction">Linger on each memory — watch it warm</div>
      </div>

      <div class="gallery-progress">
        <div class="progress-text">Memories clarified: <span class="progress-count">0/${this.frameCount}</span></div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width: 0%"></div>
        </div>
      </div>
    `;

    this.stage.container.appendChild(this.ui);
  }

  /**
   * Animate entrance
   */
  animateEntrance() {
    // Fade in frames one by one
    this.frames.forEach((frame, i) => {
      gsap.fromTo(frame.mesh.scale,
        { x: 0, y: 0, z: 0 },
        {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.8,
          delay: i * 0.2,
          ease: 'back.out(1.7)'
        }
      );
    });

    // Fade in UI
    gsap.fromTo(this.ui,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.5,
        ease: 'power2.out'
      }
    );

    // Pulse rim light
    gsap.to(this.stage.lights.rim, {
      intensity: 1.2,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }

  /**
   * Update loop
   */
  updateLoop() {
    if (!this.isActive) return;

    requestAnimationFrame(() => this.updateLoop());

    const time = performance.now() * 0.001;

    // Update each frame
    this.frames.forEach((frame, i) => {
      if (frame.clarified) return;

      const material = frame.mesh.material;

      // Update time uniform
      material.uniforms.time.value = time;

      // Calculate distance to pointer in 3D space
      const pointer = this.stage.pointer;
      const worldPointer = new THREE.Vector3(
        pointer.nx * 4,
        pointer.ny * 2 + 0.6,
        -0.5
      );

      const distance = frame.mesh.position.distanceTo(worldPointer);
      const normalizedDistance = Math.min(distance / 3, 1);

      material.uniforms.pointerDistance.value = normalizedDistance;

      // If pointer is close, increase dwell time
      if (normalizedDistance < 0.5) {
        frame.dwellTime += 0.016; // ~60fps

        // Increase warmth based on dwell time
        frame.warmth = Math.min(frame.warmth + 0.008, 1);

        // Check if clarified
        if (frame.warmth >= this.clarityThreshold && !frame.clarified) {
          this.clarifyFrame(i);
        }
      } else {
        // Slowly cool down if not hovering
        frame.warmth = Math.max(frame.warmth - 0.002, 0);
      }

      material.uniforms.warmth.value = frame.warmth;
    });
  }

  /**
   * Mark frame as clarified
   */
  clarifyFrame(index) {
    const frame = this.frames[index];
    frame.clarified = true;
    this.completedFrames++;

    // Play note
    const frequencies = [523.25, 587.33, 659.25, 698.46, 783.99];
    this.stage.playNote(frequencies[index], 1, 0.2);

    // Glow effect
    gsap.to(frame.mesh.material.uniforms.warmth, {
      value: 1.2,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });

    // Update UI
    this.updateProgress();

    // Check if all frames clarified
    if (this.completedFrames >= this.frameCount) {
      setTimeout(() => this.complete(), 800);
    }
  }

  /**
   * Update progress display
   */
  updateProgress() {
    const progressText = this.ui.querySelector('.progress-count');
    const progressBar = this.ui.querySelector('.progress-bar-fill');

    progressText.textContent = `${this.completedFrames}/${this.frameCount}`;

    const percentage = (this.completedFrames / this.frameCount) * 100;

    gsap.to(progressBar, {
      width: `${percentage}%`,
      duration: 0.6,
      ease: 'power2.out'
    });
  }

  /**
   * Complete puzzle
   */
  async complete() {
    this.isActive = false;

    // Merge frames into luminous sphere
    this.createLuminousSphere();

    // Play completion chord (E minor)
    const chord = [659.25, 783.99, 987.77]; // E5, G5, B5
    chord.forEach((freq, i) => {
      setTimeout(() => this.stage.playNote(freq, 2.5, 0.2), i * 120);
    });

    // Confetti
    confetti({
      particleCount: 70,
      spread: 65,
      origin: { y: 0.5 },
      colors: ['#ffcc77', '#ff8866', '#ffd6a6']
    });

    await this.wait(2000);

    this.showReward();
  }

  /**
   * Create luminous sphere from merged frames
   */
  createLuminousSphere() {
    // Animate frames to center
    this.frames.forEach((frame, i) => {
      gsap.to(frame.mesh.position, {
        x: 0,
        y: 1.2,
        z: -2,
        duration: 1.5,
        ease: 'power2.inOut'
      });

      gsap.to(frame.mesh.scale, {
        x: 0.3,
        y: 0.3,
        z: 0.3,
        duration: 1.5,
        ease: 'power2.inOut'
      });
    });

    // Create sphere
    setTimeout(() => {
      const sphereGeo = new THREE.SphereGeometry(0.5, 32, 32);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: 0xffaa66,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });

      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(0, 1.2, -2);
      this.stage.scene.add(sphere);

      // Fade in sphere
      gsap.to(sphereMat, {
        opacity: 0.8,
        duration: 1,
        ease: 'power2.out'
      });

      // Pulse
      gsap.to(sphere.scale, {
        x: 1.4,
        y: 1.4,
        z: 1.4,
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });

      // Hide frames
      this.frames.forEach(frame => {
        gsap.to(frame.mesh.material, {
          opacity: 0,
          duration: 0.8
        });
      });
    }, 1500);
  }

  /**
   * Show reward
   */
  showReward() {
    const reward = document.createElement('div');
    reward.className = 'gallery-reward';
    reward.innerHTML = `
      <div class="reward-content">
        <div class="reward-title">Every memory is painted with you</div>
        <div class="reward-poem">
          "Each memory paints its own portrait, and somehow, your color fills them all."
        </div>
        <div class="reward-question">If your life were a painting, what would dominate the canvas?</div>
        <div class="reward-options">
          <button class="reward-option" data-answer="Bold colors and motion">Bold colors and motion</button>
          <button class="reward-option" data-answer="Quiet details and texture">Quiet details and texture</button>
          <button class="reward-option" data-answer="Light breaking through darkness">Light breaking through darkness</button>
          <button class="reward-option" data-answer="Figures in conversation">Figures in conversation</button>
          <button class="reward-option custom" data-answer="custom">Write my own</button>
          <button class="reward-option" data-answer="Ask me in person">Ask me in person</button>
        </div>
        <textarea class="custom-answer" placeholder="Type your answer..." style="display: none;"></textarea>
        <button class="custom-submit" style="display: none;">Submit</button>
      </div>
    `;

    this.stage.container.appendChild(reward);

    gsap.fromTo(reward,
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: 'back.out(1.4)'
      }
    );

    // Handle option clicks
    reward.querySelectorAll('.reward-option').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.answer === 'custom') {
          reward.querySelector('.custom-answer').style.display = 'block';
          reward.querySelector('.custom-submit').style.display = 'block';
        } else {
          this.submitAnswer(btn.dataset.answer, reward);
        }
      });
    });

    reward.querySelector('.custom-submit').addEventListener('click', () => {
      const customAnswer = reward.querySelector('.custom-answer').value.trim();
      if (customAnswer) {
        this.submitAnswer(customAnswer, reward);
      }
    });
  }

  /**
   * Submit answer and close
   */
  async submitAnswer(answer, rewardElement) {
    const content = rewardElement.querySelector('.reward-content');
    content.style.opacity = '0.5';
    content.style.pointerEvents = 'none';

    try {
      const { submitAnswer } = await import('../utils/api.js');
      await submitAnswer({
        questionId: 'act2-q2',
        puzzle: 'gallery',
        answer: answer,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }

    gsap.to(rewardElement, {
      opacity: 0,
      duration: 0.6,
      onComplete: () => {
        rewardElement.remove();
        this.cleanup();

        if (this._completionCallback) {
          this._completionCallback({
            puzzleId: 'gallery',
            completed: true,
            poemLine: "Each memory paints its own portrait, and somehow, your color fills them all.",
            questionId: 'act2-q2',
            answer: answer
          });
        }
      }
    });
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.isActive = false;

    // Remove frames
    this.frames.forEach(frame => {
      this.stage.scene.remove(frame.mesh);
      frame.mesh.geometry.dispose();
      frame.mesh.material.dispose();
    });

    // Remove UI
    if (this.ui) {
      gsap.to(this.ui, {
        opacity: 0,
        duration: 0.6,
        onComplete: () => this.ui.remove()
      });
    }
  }

  /**
   * Utility wait function
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Register completion callback
   */
  onComplete(callback) {
    this._completionCallback = callback;
  }
}

// Styles
const styles = `
.gallery-ui {
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  pointer-events: none;
  z-index: 100;
}

.gallery-header {
  margin-bottom: 2rem;
}

.gallery-progress {
  background: rgba(15, 7, 34, 0.7);
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 204, 119, 0.2);
}

.progress-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.75rem;
}

.progress-bar-container {
  width: 200px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin: 0 auto;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffcc77, #ff8866);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.gallery-reward {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  background: rgba(15, 7, 34, 0.98);
  border-radius: 20px;
  border: 2px solid rgba(255, 136, 102, 0.3);
  padding: 2.5rem;
  z-index: 200;
}

.gallery-reward .reward-poem {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  line-height: 1.8;
  color: #ff8866;
  margin: 1.5rem 0;
  font-style: italic;
}

.gallery-reward .reward-question {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 2rem 0 1.5rem;
}

.gallery-reward .reward-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.gallery-reward .reward-option {
  padding: 0.875rem 1.5rem;
  background: rgba(255, 136, 102, 0.08);
  border: 1px solid rgba(255, 136, 102, 0.2);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.gallery-reward .reward-option:hover {
  background: rgba(255, 136, 102, 0.15);
  border-color: rgba(255, 136, 102, 0.4);
  transform: translateX(4px);
}

.gallery-reward .custom-answer {
  width: 100%;
  min-height: 80px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #fff;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  margin-top: 1rem;
  resize: vertical;
}

.gallery-reward .custom-submit {
  padding: 0.875rem 2rem;
  background: rgba(255, 136, 102, 0.2);
  border: 1px solid rgba(255, 136, 102, 0.4);
  border-radius: 12px;
  color: #ff8866;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.75rem;
  transition: all 0.3s ease;
}

.gallery-reward .custom-submit:hover {
  background: rgba(255, 136, 102, 0.3);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .gallery-reward {
    padding: 1.5rem;
  }

  .gallery-reward .reward-poem {
    font-size: 1.25rem;
  }

  .gallery-reward .reward-question {
    font-size: 1rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
