/**
 * Constellation You - A love letter written in stars
 *
 * She connects stars by dragging between them, slowly revealing
 * meaningful constellations that represent your story together.
 * Each discovery brings a gentle poem and soft particles of light.
 */

import * as THREE from 'three';
import gsap from 'gsap';

export class ConstellationYou {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.element = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.stars = [];
    this.lines = [];
    this.currentSequence = [];
    this.isDrawing = false;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.discovered = new Set();

    // Constellation definitions
    this.constellations = [
      {
        id: 'mila',
        name: 'M·I·L·A',
        pattern: [0, 1, 2, 3], // Simple 4-star pattern
        poem: [
          "Four letters spell a universe,",
          "Each star a miracle unfurled.",
          "In you, I found my meaning—",
          "M·I·L·A, you are my world."
        ],
        color: 0xffb6c1
      }
    ];
  }

  show() {
    this.element = this.createElement();
    document.body.appendChild(this.element);

    this.initScene();
    this.createStarfield();
    this.addEventListeners();
    this.animate();

    // Fade in
    gsap.fromTo(this.element,
      { opacity: 0 },
      { opacity: 1, duration: 2, ease: 'power2.out' }
    );
  }

  createElement() {
    const el = document.createElement('div');
    el.className = 'constellation-puzzle-v2';
    el.innerHTML = `
      <style>
        .constellation-puzzle-v2 {
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, #000814 0%, #1a1a2e 100%);
          touch-action: none;
          overflow: hidden;
        }

        .constellation-hint {
          position: absolute;
          top: 5%;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.8);
          font-family: 'Playfair Display', serif;
          font-size: clamp(14px, 2.5vw, 20px);
          text-align: center;
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          z-index: 10;
          pointer-events: none;
        }

        .constellation-poem {
          position: absolute;
          top: 20%;
          left: 50%;
          transform: translateX(-50%);
          width: min(600px, 90%);
          text-align: center;
          color: rgba(255, 243, 230, 0.95);
          font-family: 'Playfair Display', serif;
          font-size: clamp(16px, 3vw, 24px);
          line-height: 1.6;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
          opacity: 0;
          z-index: 15;
          pointer-events: none;
        }

        .poem-line {
          display: block;
          margin: 8px 0;
          opacity: 0;
        }

        .constellation-canvas {
          position: absolute;
          inset: 0;
        }
      </style>

      <div class="constellation-hint">
        Drag between the stars to reveal what connects you
      </div>

      <div class="constellation-poem" id="poem"></div>

      <div class="constellation-canvas"></div>
    `;

    return el;
  }

  initScene() {
    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 15;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const container = this.element.querySelector('.constellation-canvas');
    container.appendChild(this.renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambient);
  }

  createStarfield() {
    // Background stars (atmospheric)
    const bgCount = 150;
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(bgCount * 3);

    for (let i = 0; i < bgCount; i++) {
      bgPos[i * 3] = (Math.random() - 0.5) * 100;
      bgPos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      bgPos[i * 3 + 2] = (Math.random() - 0.5) * 30 - 10;
    }

    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    const bgMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });

    const bgStars = new THREE.Points(bgGeo, bgMat);
    this.scene.add(bgStars);

    // Slow rotation for depth
    gsap.to(bgStars.rotation, {
      y: Math.PI * 2,
      duration: 200,
      repeat: -1,
      ease: 'none'
    });

    // Interactive stars - spell M I L A in a gentle arc
    const starPositions = [
      { x: -6, y: 2, z: 0 },   // M
      { x: -2, y: 3, z: 0 },   // I
      { x: 2, y: 3, z: 0 },    // L
      { x: 6, y: 2, z: 0 }     // A
    ];

    starPositions.forEach((pos, i) => {
      // Star sphere
      const geo = new THREE.SphereGeometry(0.3, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95
      });

      const star = new THREE.Mesh(geo, mat);
      star.position.set(pos.x, pos.y, pos.z);
      star.userData = { index: i };

      // Glow
      const glowGeo = new THREE.SphereGeometry(0.5, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffb6c1,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });

      const glow = new THREE.Mesh(glowGeo, glowMat);
      star.add(glow);
      star.userData.glow = glow;

      // Gentle twinkle
      gsap.to(mat, {
        opacity: 0.7,
        duration: 1 + Math.random(),
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });

      this.stars.push(star);
      this.scene.add(star);
    });
  }

  addEventListeners() {
    const canvas = this.renderer.domElement;

    // Mouse/Touch start
    canvas.addEventListener('pointerdown', (e) => {
      this.isDrawing = true;
      this.currentSequence = [];
      this.clearLines();
      this.checkIntersection(e);
    });

    // Mouse/Touch move
    canvas.addEventListener('pointermove', (e) => {
      if (this.isDrawing) {
        this.checkIntersection(e);
      }
    });

    // Mouse/Touch end
    window.addEventListener('pointerup', () => {
      if (this.isDrawing) {
        this.isDrawing = false;
        this.checkPattern();
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  checkIntersection(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.stars);

    if (intersects.length > 0) {
      const star = intersects[0].object;
      const index = star.userData.index;

      // Add to sequence if new
      if (this.currentSequence.length === 0 ||
          index !== this.currentSequence[this.currentSequence.length - 1]) {

        this.currentSequence.push(index);

        // Glow the star
        gsap.to(star.userData.glow.material, {
          opacity: 0.6,
          duration: 0.3
        });

        // Draw line if we have 2+ stars
        if (this.currentSequence.length >= 2) {
          const prevIndex = this.currentSequence[this.currentSequence.length - 2];
          this.drawLine(prevIndex, index);
        }

        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate(5);
      }
    }
  }

  drawLine(fromIndex, toIndex) {
    const from = this.stars[fromIndex].position;
    const to = this.stars[toIndex].position;

    const points = [from.clone(), to.clone()];
    const geo = new THREE.BufferGeometry().setFromPoints(points);

    const mat = new THREE.LineBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0,
      linewidth: 2
    });

    const line = new THREE.Line(geo, mat);
    this.lines.push(line);
    this.scene.add(line);

    // Animate line in
    gsap.to(mat, {
      opacity: 0.8,
      duration: 0.3,
      ease: 'power2.out'
    });
  }

  clearLines() {
    this.lines.forEach(line => {
      this.scene.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    this.lines = [];

    // Reset glows
    this.stars.forEach(star => {
      gsap.to(star.userData.glow.material, {
        opacity: 0,
        duration: 0.3
      });
    });
  }

  checkPattern() {
    // Check if current sequence matches M I L A (0,1,2,3)
    const milaPattern = this.constellations[0].pattern;

    if (this.arraysEqual(this.currentSequence, milaPattern)) {
      if (!this.discovered.has('mila')) {
        this.discovered.add('mila');
        this.revealConstellation(this.constellations[0]);
      }
    }
  }

  arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  revealConstellation(constellation) {
    // Fade background stars
    const tl = gsap.timeline();

    tl.to(this.camera.position, {
      z: 12,
      duration: 2,
      ease: 'power2.inOut'
    });

    // Color shift lines
    this.lines.forEach(line => {
      tl.to(line.material.color, {
        r: (constellation.color >> 16 & 255) / 255,
        g: (constellation.color >> 8 & 255) / 255,
        b: (constellation.color & 255) / 255,
        duration: 1.5
      }, 0);

      tl.to(line.material, {
        opacity: 1,
        duration: 1.5
      }, 0);
    });

    // Show poem
    const poemEl = this.element.querySelector('#poem');
    poemEl.innerHTML = constellation.poem.map(line =>
      `<span class="poem-line">${line}</span>`
    ).join('');

    const lines = poemEl.querySelectorAll('.poem-line');

    tl.to(poemEl, { opacity: 1, duration: 0.5 });

    lines.forEach((line, i) => {
      tl.fromTo(line,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out' },
        i * 0.6
      );
    });

    // Complete after poem
    tl.call(() => {
      setTimeout(() => {
        this.complete();
      }, 4000);
    });
  }

  complete() {
    gsap.to(this.element, {
      opacity: 0,
      duration: 2,
      ease: 'power2.in',
      onComplete: () => {
        this.element.remove();
        if (this.onComplete) this.onComplete();
      }
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
}
