/**
 * Three.js Stage Environment
 * A theatrical stage that serves as the canvas for all interactions
 */

import * as THREE from 'three';
import gsap from 'gsap';

export class Stage {
  constructor(container, palette, seed) {
    this.container = container;
    this.palette = palette;
    this.seed = seed;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.curtain = null;
    this.particles = [];
    this.lights = {};

    this.init();
  }

  /**
   * Initialize Three.js scene
   */
  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 2, 10);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Set background color from palette
    const bgColor = new THREE.Color(this.palette.dark);
    this.renderer.setClearColor(bgColor, 1);

    // Create stage elements
    this.createStageFloor();
    this.createCurtains();
    this.createLighting();
    this.createParticles();

    // Handle resize
    window.addEventListener('resize', () => this.onResize());

    // Start animation loop
    this.animate();
  }

  /**
   * Create stage floor
   */
  createStageFloor() {
    const geometry = new THREE.PlaneGeometry(20, 15);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.palette.dark),
      roughness: 0.8,
      metalness: 0.2
    });

    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2;
    floor.receiveShadow = true;

    this.scene.add(floor);
  }

  /**
   * Create curtains - the theatrical entrance
   */
  createCurtains() {
    const curtainGeometry = new THREE.PlaneGeometry(6, 12);
    const curtainMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x722F37), // Rich burgundy/maroon for theatrical velvet curtains
      side: THREE.DoubleSide,
      roughness: 0.98, // Very high roughness for deep velvet appearance
      metalness: 0.02, // Almost no metalness for fabric
      emissive: new THREE.Color(0x3D1620), // Subtle burgundy glow
      emissiveIntensity: 0.15
    });

    // Left curtain
    const leftCurtain = new THREE.Mesh(curtainGeometry, curtainMaterial);
    leftCurtain.position.set(-3, 3, -2);
    leftCurtain.castShadow = true;
    this.scene.add(leftCurtain);

    // Right curtain
    const rightCurtain = new THREE.Mesh(curtainGeometry, curtainMaterial);
    rightCurtain.position.set(3, 3, -2);
    rightCurtain.castShadow = true;
    this.scene.add(rightCurtain);

    this.curtain = {
      left: leftCurtain,
      right: rightCurtain,
      isOpen: false
    };
  }

  /**
   * Create theatrical lighting
   */
  createLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(
      new THREE.Color(this.palette.secondary),
      0.3
    );
    this.scene.add(ambient);
    this.lights.ambient = ambient;

    // Spotlight (main)
    const spotlight = new THREE.SpotLight(
      new THREE.Color(this.palette.highlight),
      1.5
    );
    spotlight.position.set(0, 8, 5);
    spotlight.angle = Math.PI / 6;
    spotlight.penumbra = 0.5;
    spotlight.decay = 2;
    spotlight.distance = 30;
    spotlight.castShadow = true;
    spotlight.shadow.mapSize.width = 1024;
    spotlight.shadow.mapSize.height = 1024;
    this.scene.add(spotlight);
    this.lights.spotlight = spotlight;

    // Rim lights for depth
    const rimLeft = new THREE.PointLight(
      new THREE.Color(this.palette.primary),
      0.5,
      15
    );
    rimLeft.position.set(-5, 3, 2);
    this.scene.add(rimLeft);
    this.lights.rimLeft = rimLeft;

    const rimRight = new THREE.PointLight(
      new THREE.Color(this.palette.accent),
      0.5,
      15
    );
    rimRight.position.set(5, 3, 2);
    this.scene.add(rimRight);
    this.lights.rimRight = rimRight;
  }

  /**
   * Create floating particles (stage dust)
   */
  createParticles() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = Math.random() * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      velocities.push({
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.02
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: new THREE.Color(this.palette.primary),
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    this.particles = {
      mesh: particles,
      velocities: velocities,
      geometry: geometry
    };
  }

  /**
   * Animate curtains opening
   */
  openCurtains() {
    if (this.curtain.isOpen) return;

    this.curtain.isOpen = true;

    // Animate left curtain
    gsap.to(this.curtain.left.position, {
      x: -8,
      duration: 2.5,
      ease: 'power2.inOut'
    });

    // Animate right curtain
    gsap.to(this.curtain.right.position, {
      x: 8,
      duration: 2.5,
      ease: 'power2.inOut'
    });

    // Brighten lights
    gsap.to(this.lights.spotlight, {
      intensity: 2,
      duration: 2,
      ease: 'power2.out'
    });

    gsap.to(this.lights.ambient, {
      intensity: 0.5,
      duration: 2,
      ease: 'power2.out'
    });
  }

  /**
   * Create spotlight effect at position
   */
  createSpotlight(x, y, z, color) {
    const light = new THREE.SpotLight(color, 2);
    light.position.set(x, y, z);
    light.angle = Math.PI / 8;
    light.penumbra = 0.3;
    light.decay = 2;
    light.distance = 20;
    light.castShadow = true;

    this.scene.add(light);

    // Fade in
    gsap.from(light, {
      intensity: 0,
      duration: 0.5,
      ease: 'power2.out'
    });

    return light;
  }

  /**
   * Update particles animation
   */
  updateParticles() {
    if (!this.particles.mesh) return;

    const positions = this.particles.geometry.attributes.position.array;

    for (let i = 0; i < this.particles.velocities.length; i++) {
      const velocity = this.particles.velocities[i];

      positions[i * 3] += velocity.x;
      positions[i * 3 + 1] += velocity.y;
      positions[i * 3 + 2] += velocity.z;

      // Boundary check
      if (Math.abs(positions[i * 3]) > 10) velocity.x *= -1;
      if (positions[i * 3 + 1] > 10 || positions[i * 3 + 1] < 0) velocity.y *= -1;
      if (Math.abs(positions[i * 3 + 2]) > 5) velocity.z *= -1;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Animation loop
   */
  animate() {
    requestAnimationFrame(() => this.animate());

    // Update particles
    this.updateParticles();

    // Subtle camera sway
    const time = Date.now() * 0.0001;
    this.camera.position.x = Math.sin(time) * 0.2;
    this.camera.lookAt(0, 0, 0);

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize
   */
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Update palette colors
   */
  updatePalette(newPalette) {
    this.palette = newPalette;

    // Update background
    const bgColor = new THREE.Color(newPalette.dark);
    this.renderer.setClearColor(bgColor, 1);

    // Update curtains - keep them theatrical burgundy/maroon
    if (this.curtain) {
      const curtainColor = new THREE.Color(0x722F37); // Always use rich burgundy/maroon for curtains
      this.curtain.left.material.color = curtainColor;
      this.curtain.right.material.color = curtainColor;
      this.curtain.left.material.emissive = new THREE.Color(0x3D1620);
      this.curtain.right.material.emissive = new THREE.Color(0x3D1620);
    }

    // Update lights
    if (this.lights.spotlight) {
      this.lights.spotlight.color = new THREE.Color(newPalette.highlight);
    }
    if (this.lights.ambient) {
      this.lights.ambient.color = new THREE.Color(newPalette.secondary);
    }

    // Update particles
    if (this.particles.mesh) {
      this.particles.mesh.material.color = new THREE.Color(newPalette.primary);
    }
  }

  /**
   * Dispose of resources
   */
  dispose() {
    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }

    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }
  }
}
