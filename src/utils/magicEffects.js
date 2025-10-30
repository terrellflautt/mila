/**
 * Magic Effects Utility - 2025 Web Animation Techniques
 * Provides reusable magical interactions throughout Mila's World
 */

import gsap from 'gsap';

/**
 * Create sparkle particles at a specific position
 */
export function createSparkles(x, y, count = 8, color = '#FFB6C1') {
  const container = document.createElement('div');
  container.className = 'sparkle-container';
  container.style.position = 'fixed';
  container.style.left = x + 'px';
  container.style.top = y + 'px';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'magic-sparkle';
    sparkle.style.position = 'absolute';
    sparkle.style.width = '8px';
    sparkle.style.height = '8px';
    sparkle.style.background = color;
    sparkle.style.borderRadius = '50%';
    sparkle.style.boxShadow = `0 0 8px ${color}`;

    container.appendChild(sparkle);

    const angle = (i / count) * Math.PI * 2;
    const distance = 30 + Math.random() * 30;
    const endX = Math.cos(angle) * distance;
    const endY = Math.sin(angle) * distance;

    gsap.fromTo(sparkle,
      { x: 0, y: 0, scale: 0, opacity: 1 },
      {
        x: endX,
        y: endY,
        scale: 1,
        opacity: 0,
        duration: 0.6 + Math.random() * 0.4,
        ease: 'power2.out',
        onComplete: () => sparkle.remove()
      }
    );
  }

  setTimeout(() => container.remove(), 1200);
}

/**
 * Create a magical poof effect that breaks an element into particles
 */
export function magicPoof(element, onComplete) {
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Create particle container
  const particleContainer = document.createElement('div');
  particleContainer.style.position = 'fixed';
  particleContainer.style.left = '0';
  particleContainer.style.top = '0';
  particleContainer.style.width = '100%';
  particleContainer.style.height = '100%';
  particleContainer.style.pointerEvents = 'none';
  particleContainer.style.zIndex = '9999';
  document.body.appendChild(particleContainer);

  // Determine particle type based on element
  const isText = element.tagName === 'DIV' || element.tagName === 'SPAN' || element.tagName === 'P';

  if (isText) {
    // Break text into letter particles
    const text = element.textContent;
    const letters = text.split('');

    letters.forEach((letter, i) => {
      if (letter.trim() === '') return;

      const particle = document.createElement('div');
      particle.textContent = letter;
      particle.style.position = 'absolute';
      particle.style.left = centerX + 'px';
      particle.style.top = centerY + 'px';
      particle.style.fontSize = window.getComputedStyle(element).fontSize;
      particle.style.fontFamily = window.getComputedStyle(element).fontFamily;
      particle.style.color = window.getComputedStyle(element).color;
      particle.style.fontWeight = window.getComputedStyle(element).fontWeight;

      particleContainer.appendChild(particle);

      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 200;
      const endX = centerX + Math.cos(angle) * distance;
      const endY = centerY + Math.sin(angle) * distance;

      gsap.fromTo(particle,
        { x: 0, y: 0, scale: 1, opacity: 1, rotation: 0 },
        {
          x: endX - centerX,
          y: endY - centerY,
          scale: 0,
          opacity: 0,
          rotation: Math.random() * 720 - 360,
          duration: 0.8 + Math.random() * 0.4,
          ease: 'power2.out'
        }
      );
    });
  } else {
    // Create colored pixel particles for images/other elements
    const particleCount = 30;
    const computedStyle = window.getComputedStyle(element);
    const bgColor = computedStyle.backgroundColor;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.left = centerX + (Math.random() - 0.5) * rect.width + 'px';
      particle.style.top = centerY + (Math.random() - 0.5) * rect.height + 'px';
      particle.style.width = '8px';
      particle.style.height = '8px';
      particle.style.borderRadius = '50%';
      particle.style.background = bgColor !== 'rgba(0, 0, 0, 0)' ? bgColor : '#FFB6C1';
      particle.style.boxShadow = '0 0 4px rgba(255, 182, 193, 0.6)';

      particleContainer.appendChild(particle);

      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 150;
      const endX = centerX + Math.cos(angle) * distance;
      const endY = centerY + Math.sin(angle) * distance;

      gsap.fromTo(particle,
        { scale: 1, opacity: 1 },
        {
          x: endX - parseFloat(particle.style.left),
          y: endY - parseFloat(particle.style.top),
          scale: 0,
          opacity: 0,
          duration: 0.6 + Math.random() * 0.4,
          ease: 'power2.out'
        }
      );
    }
  }

  // Fade out original element
  gsap.to(element, {
    scale: 0,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in',
    onComplete: () => {
      element.remove();
      setTimeout(() => {
        particleContainer.remove();
        if (onComplete) onComplete();
      }, 1000);
    }
  });
}

/**
 * Add magical hover effect to an element (sparkles on hover)
 */
export function addMagicHover(element, options = {}) {
  const { color = '#FFB6C1', intensity = 3 } = options;

  let hoverInterval;

  element.addEventListener('mouseenter', () => {
    hoverInterval = setInterval(() => {
      const rect = element.getBoundingClientRect();
      const x = rect.left + Math.random() * rect.width;
      const y = rect.top + Math.random() * rect.height;
      createSparkles(x, y, intensity, color);
    }, 200);
  });

  element.addEventListener('mouseleave', () => {
    clearInterval(hoverInterval);
  });
}

/**
 * Create a magic cursor trail effect
 */
export class MagicCursor {
  constructor() {
    this.trail = [];
    this.maxTrail = 20;
    this.lastX = 0;
    this.lastY = 0;
    this.init();
  }

  init() {
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
  }

  onMouseMove(e) {
    // Only create trail if mouse has moved significantly
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 10) return;

    this.lastX = e.clientX;
    this.lastY = e.clientY;

    // Create trail particle
    const particle = document.createElement('div');
    particle.className = 'cursor-trail';
    particle.style.position = 'fixed';
    particle.style.left = e.clientX + 'px';
    particle.style.top = e.clientY + 'px';
    particle.style.width = '6px';
    particle.style.height = '6px';
    particle.style.borderRadius = '50%';
    particle.style.background = 'radial-gradient(circle, rgba(255, 182, 193, 0.8) 0%, transparent 70%)';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9998';
    document.body.appendChild(particle);

    gsap.to(particle, {
      scale: 0,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => particle.remove()
    });
  }
}

/**
 * Add 3D tilt effect to card on hover (modern micro-interaction)
 */
export function add3DTilt(element, options = {}) {
  const { maxTilt = 15, perspective = 1000, scale = 1.05 } = options;

  element.style.transformStyle = 'preserve-3d';
  element.style.transition = 'transform 0.3s ease';

  element.addEventListener('mouseenter', () => {
    element.style.transform = `scale(${scale})`;
  });

  element.addEventListener('mousemove', (e) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * maxTilt;
    const rotateY = ((centerX - x) / centerX) * maxTilt;

    element.style.transform = `
      perspective(${perspective}px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(${scale})
    `;
  });

  element.addEventListener('mouseleave', () => {
    element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
  });
}

/**
 * Smooth page transition using View Transitions API (2025 technique)
 */
export function smoothTransition(callback) {
  if (!document.startViewTransition) {
    // Fallback for browsers without View Transitions API
    callback();
    return;
  }

  document.startViewTransition(() => {
    callback();
  });
}

/**
 * Create a ripple effect on click (micro-interaction)
 */
export function createRipple(e, element) {
  const rect = element.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const ripple = document.createElement('div');
  ripple.className = 'magic-ripple';
  ripple.style.position = 'absolute';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.style.width = '0';
  ripple.style.height = '0';
  ripple.style.borderRadius = '50%';
  ripple.style.background = 'radial-gradient(circle, rgba(255, 182, 193, 0.4) 0%, transparent 70%)';
  ripple.style.transform = 'translate(-50%, -50%)';
  ripple.style.pointerEvents = 'none';

  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);

  gsap.to(ripple, {
    width: Math.max(rect.width, rect.height) * 2,
    height: Math.max(rect.width, rect.height) * 2,
    opacity: 0,
    duration: 0.6,
    ease: 'power2.out',
    onComplete: () => ripple.remove()
  });
}

/**
 * Play a subtle success chime (micro-feedback)
 */
export function playSuccessChime() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;

    // C major chord (C-E-G)
    const frequencies = [523.25, 659.25, 783.99];

    frequencies.forEach((freq, i) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(freq, now + i * 0.05);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, now + i * 0.05);
      gainNode.gain.linearRampToValueAtTime(0.1, now + i * 0.05 + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.4);

      oscillator.start(now + i * 0.05);
      oscillator.stop(now + i * 0.05 + 0.5);
    });
  } catch (e) {
    console.warn('Audio not supported:', e);
  }
}

/**
 * Create themed discovery element based on type
 */
export function createThemedDiscoveryElement(type, color) {
  const element = document.createElement('div');
  element.className = `discovery-hint themed-${type}`;
  element.style.position = 'fixed';
  element.style.opacity = '0';
  element.style.pointerEvents = 'auto';
  element.style.cursor = 'pointer';
  element.style.zIndex = '50';

  const tooltip = document.createElement('div');
  tooltip.className = 'hint-tooltip';
  tooltip.style.opacity = '0';

  // Create themed visual based on type
  let visual;

  switch(type) {
    case 'shimmer':
      visual = createShimmerElement(color);
      break;
    case 'trail':
      visual = createTrailElement(color);
      break;
    case 'paint':
      visual = createPaintElement(color);
      break;
    case 'whisper':
      visual = createWhisperElement(color);
      break;
    case 'star':
      visual = createStarElement(color);
      break;
    case 'crystal':
      visual = createCrystalElement(color);
      break;
    default:
      visual = createSparkleElement(color);
  }

  element.appendChild(visual);
  element.appendChild(tooltip);

  return element;
}

function createShimmerElement(color) {
  const shimmer = document.createElement('div');
  shimmer.style.width = '30px';
  shimmer.style.height = '30px';
  shimmer.style.background = `linear-gradient(135deg, ${color} 0%, transparent 50%, ${color} 100%)`;
  shimmer.style.borderRadius = '50%';
  shimmer.style.boxShadow = `0 0 20px ${color}, 0 0 40px ${color}`;
  shimmer.style.animation = 'shimmer-pulse 2s ease-in-out infinite';
  return shimmer;
}

function createTrailElement(color) {
  const trail = document.createElement('div');
  trail.style.width = '40px';
  trail.style.height = '8px';
  trail.style.background = `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`;
  trail.style.borderRadius = '4px';
  trail.style.boxShadow = `0 0 10px ${color}`;
  trail.style.animation = 'trail-dance 1.5s ease-in-out infinite';
  return trail;
}

function createPaintElement(color) {
  const paint = document.createElement('div');
  paint.style.width = '24px';
  paint.style.height = '28px';
  paint.style.background = `radial-gradient(ellipse at top, ${color} 0%, ${color} 60%, transparent 100%)`;
  paint.style.borderRadius = '50% 50% 50% 50% / 60% 60% 40% 40%';
  paint.style.boxShadow = `0 0 15px ${color}`;
  paint.style.animation = 'paint-drip 2.5s ease-in-out infinite';
  return paint;
}

function createWhisperElement(color) {
  const whisper = document.createElement('div');
  whisper.style.width = '32px';
  whisper.style.height = '28px';
  whisper.style.background = color;
  whisper.style.borderRadius = '50% 50% 50% 0%';
  whisper.style.opacity = '0.7';
  whisper.style.boxShadow = `0 0 12px ${color}`;
  whisper.style.animation = 'whisper-float 3s ease-in-out infinite';
  return whisper;
}

function createStarElement(color) {
  const star = document.createElement('div');
  star.style.width = '28px';
  star.style.height = '28px';
  star.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
  star.style.background = color;
  star.style.boxShadow = `0 0 20px ${color}`;
  star.style.animation = 'star-twinkle 2s ease-in-out infinite';
  return star;
}

function createCrystalElement(color) {
  const crystal = document.createElement('div');
  crystal.style.width = '0';
  crystal.style.height = '0';
  crystal.style.borderLeft = '12px solid transparent';
  crystal.style.borderRight = '12px solid transparent';
  crystal.style.borderBottom = `20px solid ${color}`;
  crystal.style.filter = `drop-shadow(0 0 15px ${color})`;
  crystal.style.animation = 'crystal-rotate 4s linear infinite';
  return crystal;
}

function createSparkleElement(color) {
  const sparkle = document.createElement('div');
  sparkle.className = 'hint-sparkle';
  sparkle.style.background = `radial-gradient(circle, ${color} 0%, ${color} 40%, transparent 100%)`;
  sparkle.style.boxShadow = `0 0 15px ${color}`;
  return sparkle;
}
