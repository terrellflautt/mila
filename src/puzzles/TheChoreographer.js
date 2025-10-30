/**
 * Act II - Puzzle 1: "The Choreographer"
 * Particle trail system with silhouette mirroring
 * User traces gestures while the silhouette mirrors with delay
 */

import * as THREE from 'three';
import gsap from 'gsap';
import confetti from 'canvas-confetti';

export class TheChoreographer {
  constructor(stage, onComplete) {
    this.stage = stage;
    this.onComplete = onComplete;

    // Trail system
    this.trailPoints = [];
    this.trailMesh = null;
    this.maxTrailPoints = 80;

    // Gesture tracking
    this.gestures = [];
    this.currentGesture = 0;
    this.requiredGestures = [
      { type: 'wave', threshold: 0.4, duration: 1200 },
      { type: 'circle', threshold: 0.3, duration: 1500 },
      { type: 'heart', threshold: 0.35, duration: 1400 }
    ];

    // State
    this.isActive = false;
    this.gestureStartTime = 0;
    this.lastPointer = { x: 0, y: 0 };
    this.pathPoints = [];

    // UI
    this.ui = null;

    // Completion callback storage
    this._completionCallback = null;
  }

  /**
   * Start the puzzle
   */
  start() {
    this.isActive = true;
    this.createTrailSystem();
    this.createUI();
    this.animateEntrance();

    // Begin gesture tracking
    this.gestureStartTime = Date.now();
    this.updateLoop();
  }

  /**
   * Create particle trail system
   */
  createTrailSystem() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxTrailPoints * 3);
    const colors = new Float32Array(this.maxTrailPoints * 3);

    // Initialize with zeros
    for (let i = 0; i < this.maxTrailPoints; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      // Golden gradient
      const t = i / this.maxTrailPoints;
      colors[i * 3] = 1.0; // R
      colors[i * 3 + 1] = 0.8 - t * 0.3; // G
      colors[i * 3 + 2] = 0.47 - t * 0.3; // B
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      linewidth: 2
    });

    this.trailMesh = new THREE.Line(geometry, material);
    this.stage.scene.add(this.trailMesh);
  }

  /**
   * Create UI overlay
   */
  createUI() {
    this.ui = document.createElement('div');
    this.ui.className = 'choreographer-ui';
    this.ui.innerHTML = `
      <div class="choreographer-header">
        <div class="puzzle-title">The Choreographer</div>
        <div class="puzzle-instruction">Move with intention — the light remembers</div>
      </div>

      <div class="gesture-progress">
        <div class="gesture-orb" data-gesture="0"></div>
        <div class="gesture-orb" data-gesture="1"></div>
        <div class="gesture-orb" data-gesture="2"></div>
      </div>

      <div class="gesture-hint">Gesture ${this.currentGesture + 1} of 3: ${this.getGestureHint(0)}</div>
    `;

    this.stage.container.appendChild(this.ui);
  }

  /**
   * Get gesture hint text
   */
  getGestureHint(index) {
    const hints = [
      'Wave your hand across',
      'Draw a circle in the air',
      'Trace the shape of your heart'
    ];
    return hints[index] || '';
  }

  /**
   * Animate entrance
   */
  animateEntrance() {
    // Fade in silhouette
    gsap.to(this.stage.silhouette.material, {
      opacity: 0.6,
      duration: 1.5,
      ease: 'power2.out'
    });

    // Pulse spotlight
    gsap.to(this.stage.lights.spotlight, {
      intensity: 2.5,
      duration: 1,
      ease: 'power2.out'
    });

    // Fade in UI
    gsap.fromTo(this.ui,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.3,
        ease: 'power2.out'
      }
    );
  }

  /**
   * Update loop
   */
  updateLoop() {
    if (!this.isActive) return;

    requestAnimationFrame(() => this.updateLoop());

    // Update trail
    this.updateTrail();

    // Update silhouette to mirror pointer
    this.updateSilhouette();

    // Track gesture
    this.trackGesture();
  }

  /**
   * Update particle trail
   */
  updateTrail() {
    const pointer = this.stage.pointer;

    // Convert normalized pointer to world coords
    const worldX = pointer.nx * 4;
    const worldY = pointer.ny * 2 + 0.6;
    const worldZ = -0.5;

    // Add new point
    this.trailPoints.unshift({ x: worldX, y: worldY, z: worldZ });

    // Limit points
    if (this.trailPoints.length > this.maxTrailPoints) {
      this.trailPoints.pop();
    }

    // Update geometry
    const positions = this.trailMesh.geometry.attributes.position.array;

    for (let i = 0; i < this.maxTrailPoints; i++) {
      if (i < this.trailPoints.length) {
        const point = this.trailPoints[i];
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
      } else {
        // Fill remaining with last point to avoid gaps
        const last = this.trailPoints[this.trailPoints.length - 1] || { x: 0, y: 0, z: 0 };
        positions[i * 3] = last.x;
        positions[i * 3 + 1] = last.y;
        positions[i * 3 + 2] = last.z;
      }
    }

    this.trailMesh.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Update silhouette to mirror movements with delay
   */
  updateSilhouette() {
    const pointer = this.stage.pointer;

    // Smooth delayed following
    const targetX = pointer.nx * 0.3;
    const targetRotation = pointer.nx * 0.2;
    const targetScale = 1 + Math.abs(pointer.ny) * 0.15;

    gsap.to(this.stage.silhouette.position, {
      x: targetX,
      duration: 0.6,
      ease: 'power2.out'
    });

    gsap.to(this.stage.silhouette.rotation, {
      z: targetRotation,
      duration: 0.8,
      ease: 'power2.out'
    });

    gsap.to(this.stage.silhouette.scale, {
      x: targetScale,
      y: targetScale,
      duration: 0.5,
      ease: 'power2.out'
    });
  }

  /**
   * Track gesture patterns
   */
  trackGesture() {
    const pointer = this.stage.pointer;
    const now = Date.now();

    // Record path
    this.pathPoints.push({ x: pointer.x, y: pointer.y, time: now });

    // Keep only recent points (last 2 seconds)
    this.pathPoints = this.pathPoints.filter(p => now - p.time < 2000);

    // Check if current gesture is complete
    const gesture = this.requiredGestures[this.currentGesture];

    if (this.isGestureComplete(gesture)) {
      this.onGestureComplete();
    }
  }

  /**
   * Check if gesture pattern matches
   */
  isGestureComplete(gesture) {
    if (this.pathPoints.length < 20) return false;

    const now = Date.now();
    const recentPoints = this.pathPoints.filter(p => now - p.time < gesture.duration);

    if (recentPoints.length < 15) return false;

    // Calculate gesture metrics
    const minX = Math.min(...recentPoints.map(p => p.x));
    const maxX = Math.max(...recentPoints.map(p => p.x));
    const minY = Math.min(...recentPoints.map(p => p.y));
    const maxY = Math.max(...recentPoints.map(p => p.y));

    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    const totalRange = Math.max(rangeX, rangeY);

    // Different criteria for different gestures
    switch (gesture.type) {
      case 'wave':
        // Horizontal movement
        return rangeX > gesture.threshold && rangeY < gesture.threshold * 0.6;

      case 'circle':
        // Balanced movement in both directions
        return rangeX > gesture.threshold && rangeY > gesture.threshold;

      case 'heart':
        // Curved movement with vertical component
        return totalRange > gesture.threshold && recentPoints.length > 25;

      default:
        return false;
    }
  }

  /**
   * Handle gesture completion
   */
  onGestureComplete() {
    // Play note
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    this.stage.playNote(frequencies[this.currentGesture], 1.2, 0.25);

    // Light up orb
    const orb = this.ui.querySelector(`[data-gesture="${this.currentGesture}"]`);
    gsap.to(orb, {
      scale: 1.2,
      backgroundColor: '#ffcc77',
      boxShadow: '0 0 25px rgba(255, 204, 119, 0.8)',
      duration: 0.4,
      ease: 'back.out(1.4)'
    });

    // Flash trail
    gsap.to(this.trailMesh.material, {
      opacity: 1,
      duration: 0.2,
      yoyo: true,
      repeat: 1
    });

    // Move to next gesture
    this.currentGesture++;
    this.pathPoints = [];

    if (this.currentGesture >= this.requiredGestures.length) {
      // Puzzle complete!
      setTimeout(() => this.complete(), 600);
    } else {
      // Update hint
      const hint = this.ui.querySelector('.gesture-hint');
      hint.textContent = `Gesture ${this.currentGesture + 1} of 3: ${this.getGestureHint(this.currentGesture)}`;

      gsap.fromTo(hint,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out'
        }
      );
    }
  }

  /**
   * Complete puzzle
   */
  async complete() {
    this.isActive = false;

    // "Crown of light" effect
    this.createCrownOfLight();

    // Play completion chord (C major)
    const chord = [523.25, 659.25, 783.99]; // C5, E5, G5
    chord.forEach((freq, i) => {
      setTimeout(() => this.stage.playNote(freq, 2, 0.2), i * 100);
    });

    // Confetti
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#ffcc77', '#ffd6a6', '#ffb6c1']
    });

    await this.wait(1500);

    this.showReward();
  }

  /**
   * Create crown of light effect
   */
  createCrownOfLight() {
    const crownGeo = new THREE.TorusGeometry(0.4, 0.08, 16, 32);
    const crownMat = new THREE.MeshBasicMaterial({
      color: 0xffcc77,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });

    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.set(0, 1.8, -0.5);
    crown.rotation.x = Math.PI / 2;
    this.stage.scene.add(crown);

    // Animate crown
    gsap.to(crown.material, {
      opacity: 0.9,
      duration: 1,
      ease: 'power2.out'
    });

    gsap.to(crown.rotation, {
      z: Math.PI * 2,
      duration: 3,
      ease: 'none',
      repeat: -1
    });

    gsap.to(crown.scale, {
      x: 1.3,
      y: 1.3,
      z: 1.3,
      duration: 1.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    // Fade out after completion
    setTimeout(() => {
      gsap.to(crown.material, {
        opacity: 0,
        duration: 1,
        onComplete: () => {
          this.stage.scene.remove(crown);
          crown.geometry.dispose();
          crown.material.dispose();
        }
      });
    }, 5000);
  }

  /**
   * Show reward
   */
  showReward() {
    const reward = document.createElement('div');
    reward.className = 'choreographer-reward';
    reward.innerHTML = `
      <div class="reward-content">
        <div class="reward-title">You found the rhythm</div>
        <div class="reward-poem">
          "We move through the same quiet rhythm, even when silence keeps the beat."
        </div>
        <div class="reward-question">What's a movement or gesture that feels completely yours?</div>
        <div class="reward-options">
          <button class="reward-option" data-answer="The way I walk">The way I walk</button>
          <button class="reward-option" data-answer="How I use my hands when I talk">How I use my hands when I talk</button>
          <button class="reward-option" data-answer="My laugh">My laugh</button>
          <button class="reward-option" data-answer="The way I dance when no one's watching">The way I dance when no one's watching</button>
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
    // Show loading state
    const content = rewardElement.querySelector('.reward-content');
    content.style.opacity = '0.5';
    content.style.pointerEvents = 'none';

    // Submit to backend (using existing API)
    try {
      const { submitAnswer } = await import('../utils/api.js');
      await submitAnswer({
        questionId: 'act2-q1',
        puzzle: 'choreographer',
        answer: answer,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }

    // Close
    gsap.to(rewardElement, {
      opacity: 0,
      duration: 0.6,
      onComplete: () => {
        rewardElement.remove();
        this.cleanup();

        // Notify completion
        if (this._completionCallback) {
          this._completionCallback({
            puzzleId: 'choreographer',
            completed: true,
            poemLine: "We move through the same quiet rhythm, even when silence keeps the beat.",
            questionId: 'act2-q1',
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

    // Remove trail
    if (this.trailMesh) {
      this.stage.scene.remove(this.trailMesh);
      this.trailMesh.geometry.dispose();
      this.trailMesh.material.dispose();
    }

    // Fade out silhouette
    gsap.to(this.stage.silhouette.material, {
      opacity: 0,
      duration: 0.8
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
   * Register completion callback (to match expected interface)
   */
  onComplete(callback) {
    this._completionCallback = callback;
  }
}

// Styles
const styles = `
.choreographer-ui {
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  pointer-events: none;
  z-index: 100;
}

.choreographer-header {
  margin-bottom: 2rem;
}

.gesture-progress {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.gesture-orb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.gesture-hint {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 300;
  font-style: italic;
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
}

.choreographer-reward {
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
  border: 2px solid rgba(255, 204, 119, 0.3);
  padding: 2.5rem;
  z-index: 200;
}

.choreographer-reward .reward-poem {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  line-height: 1.8;
  color: #ffd6a6;
  margin: 1.5rem 0;
  font-style: italic;
}

.choreographer-reward .reward-question {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 2rem 0 1.5rem;
}

.choreographer-reward .reward-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.choreographer-reward .reward-option {
  padding: 0.875rem 1.5rem;
  background: rgba(255, 204, 119, 0.08);
  border: 1px solid rgba(255, 204, 119, 0.2);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.choreographer-reward .reward-option:hover {
  background: rgba(255, 204, 119, 0.15);
  border-color: rgba(255, 204, 119, 0.4);
  transform: translateX(4px);
}

.choreographer-reward .custom-answer {
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

.choreographer-reward .custom-submit {
  padding: 0.875rem 2rem;
  background: rgba(255, 204, 119, 0.2);
  border: 1px solid rgba(255, 204, 119, 0.4);
  border-radius: 12px;
  color: #ffd6a6;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.75rem;
  transition: all 0.3s ease;
}

.choreographer-reward .custom-submit:hover {
  background: rgba(255, 204, 119, 0.3);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .choreographer-reward {
    padding: 1.5rem;
  }

  .choreographer-reward .reward-poem {
    font-size: 1.25rem;
  }

  .choreographer-reward .reward-question {
    font-size: 1rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
