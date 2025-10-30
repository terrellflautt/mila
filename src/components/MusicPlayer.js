/**
 * Music Player UI - Enhanced with visualizer, progress bar, and premium features
 * Masterpiece-level music player with audio visualization
 */

import gsap from 'gsap';
import { getStorageKey } from '../utils/storage.js';

export class MusicPlayer {
  constructor(musicSystem) {
    this.music = musicSystem;
    this.element = null;
    this.isExpanded = false;
    this.progressInterval = null;
    this.canvas = null;
    this.canvasCtx = null;
    this.analyser = null;
    this.audioContext = null;
    this.source = null;
    this.dataArray = null;
    this.animationId = null;
    this.isDragging = false;
    this.onVisualToggle = null; // Callback for visual experience toggle

    // Bind music system callback
    this.music.onTrackChange = () => this.updateTrackDisplay();

    // Load persisted volume
    this.loadVolume();
  }

  loadVolume() {
    const saved = localStorage.getItem(getStorageKey('music-volume'));
    if (saved !== null) {
      const volume = parseFloat(saved);
      this.music.setVolume(volume);
    }
  }

  saveVolume(volume) {
    localStorage.setItem(getStorageKey('music-volume'), volume.toString());
  }

  show() {
    this.element = this.createElement();
    document.body.appendChild(this.element);

    // Animate in from bottom with bounce
    gsap.fromTo(this.element,
      { y: 150, opacity: 0, scale: 0.9 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: 'back.out(1.7)',
        onComplete: () => this.initializeVisualizer()
      }
    );

    this.updateTrackDisplay();
    this.updatePlayPauseButton(); // Update button state based on actual playback
    this.addEventListeners();
    this.startProgressTracking();
  }

  /**
   * Update play/pause button to reflect current state
   */
  updatePlayPauseButton() {
    const btn = this.element?.querySelector('.player-play-pause');
    if (btn) {
      btn.textContent = this.music.isPlaying ? '⏸' : '▶️';
    }
  }

  createElement() {
    const player = document.createElement('div');
    player.className = 'music-player';
    player.innerHTML = `
      <div class="player-mini">
        <div class="player-track-info">
          <div class="player-icon">🎵</div>
          <div class="player-track-text">
            <div class="player-title">Loading...</div>
            <div class="player-artist">---</div>
          </div>
        </div>

        <div class="player-controls-mini">
          <button class="player-btn player-prev" title="Previous">⏮</button>
          <button class="player-btn player-play-pause" title="Pause">⏸</button>
          <button class="player-btn player-next" title="Next">⏭</button>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="player-progress-container">
        <div class="player-progress-bar">
          <div class="player-progress-fill"></div>
          <div class="player-progress-handle"></div>
        </div>
        <div class="player-time-display">
          <span class="player-time-current">0:00</span>
          <span class="player-time-total">0:00</span>
        </div>
      </div>

      <!-- Audio Visualizer Canvas -->
      <canvas class="player-visualizer" width="300" height="60"></canvas>

      <div class="player-expanded">
        <div class="player-controls-full">
          <button class="player-btn-full player-visual" title="Visual Experience">✨</button>
          <button class="player-btn-full player-shuffle ${this.music.shuffle ? 'active' : ''}" title="Shuffle">🔀</button>
          <button class="player-btn-full player-volume" title="Volume">🔊</button>
        </div>

        <div class="player-volume-slider" style="display: none;">
          <input type="range" class="volume-range" min="0" max="100" value="${this.music.volume * 100}" step="1">
          <div class="volume-percentage">${Math.round(this.music.volume * 100)}%</div>
        </div>
      </div>

      <button class="player-expand-btn" title="Expand">▲</button>
      <button class="player-minimize-btn" title="Minimize">▼</button>

      ${this.getStyles()}
    `;

    return player;
  }

  getStyles() {
    return `<style>
      .music-player {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, rgba(10, 5, 15, 0.95), rgba(30, 15, 30, 0.98));
        backdrop-filter: blur(30px);
        border: 1.5px solid rgba(255, 182, 193, 0.4);
        border-radius: 20px;
        padding: 16px 20px;
        font-family: 'Montserrat', sans-serif;
        color: rgba(255, 255, 255, 0.95);
        z-index: 9999;
        min-width: 360px;
        max-width: 400px;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6),
                    0 0 30px rgba(255, 182, 193, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        will-change: transform;
      }

      .music-player:hover {
        border-color: rgba(255, 182, 193, 0.6);
        box-shadow: 0 16px 56px rgba(0, 0, 0, 0.7),
                    0 0 40px rgba(255, 182, 193, 0.4);
        transform: translateY(-2px);
      }

      .player-mini {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 12px;
      }

      .player-track-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        min-width: 0;
      }

      .player-icon {
        font-size: 28px;
        animation: pulse-music 2.5s ease-in-out infinite;
        filter: drop-shadow(0 2px 8px rgba(255, 182, 193, 0.4));
      }

      @keyframes pulse-music {
        0%, 100% {
          transform: scale(1) rotate(0deg);
          opacity: 0.9;
        }
        25% {
          transform: scale(1.05) rotate(-5deg);
          opacity: 1;
        }
        50% {
          transform: scale(1.1) rotate(0deg);
          opacity: 1;
        }
        75% {
          transform: scale(1.05) rotate(5deg);
          opacity: 1;
        }
      }

      .player-track-text {
        flex: 1;
        min-width: 0;
      }

      .player-title {
        font-size: 1rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: rgba(255, 255, 255, 0.98);
        margin-bottom: 2px;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }

      .player-artist {
        font-size: 0.85rem;
        font-style: italic;
        color: rgba(255, 182, 193, 0.8);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 300;
      }

      .player-controls-mini {
        display: flex;
        gap: 6px;
        align-items: center;
      }

      .player-btn {
        background: rgba(255, 182, 193, 0.12);
        border: 1px solid rgba(255, 182, 193, 0.35);
        border-radius: 10px;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-size: 14px;
        position: relative;
        overflow: hidden;
      }

      .player-btn::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 182, 193, 0.3);
        transform: translate(-50%, -50%);
        transition: width 0.3s ease, height 0.3s ease;
      }

      .player-btn:hover::before {
        width: 100%;
        height: 100%;
      }

      .player-btn:hover {
        background: rgba(255, 182, 193, 0.25);
        border-color: rgba(255, 182, 193, 0.6);
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 4px 12px rgba(255, 182, 193, 0.3);
      }

      .player-btn:active {
        transform: translateY(0) scale(0.95);
        transition-duration: 0.1s;
      }

      /* Progress Bar Styles */
      .player-progress-container {
        margin: 12px 0;
      }

      .player-progress-bar {
        position: relative;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        cursor: pointer;
        margin-bottom: 6px;
        overflow: hidden;
      }

      .player-progress-bar::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg,
          rgba(255, 182, 193, 0.1) 0%,
          rgba(255, 182, 193, 0.2) 100%);
      }

      .player-progress-fill {
        height: 100%;
        background: linear-gradient(90deg,
          rgba(255, 182, 193, 0.8) 0%,
          rgba(255, 182, 193, 1) 50%,
          rgba(255, 150, 180, 1) 100%);
        border-radius: 3px;
        width: 0%;
        transition: width 0.1s linear;
        position: relative;
        box-shadow: 0 0 10px rgba(255, 182, 193, 0.5);
      }

      .player-progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 40px;
        background: linear-gradient(90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.3) 100%);
        animation: shimmer 1.5s infinite;
      }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .player-progress-handle {
        position: absolute;
        top: 50%;
        left: 0%;
        width: 14px;
        height: 14px;
        background: rgba(255, 182, 193, 1);
        border: 2px solid rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0);
        box-shadow: 0 2px 8px rgba(255, 182, 193, 0.6),
                    0 0 0 0 rgba(255, 182, 193, 0.4);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        cursor: grab;
      }

      .player-progress-bar:hover .player-progress-handle,
      .player-progress-handle.dragging {
        transform: translate(-50%, -50%) scale(1);
      }

      .player-progress-handle:active {
        cursor: grabbing;
      }

      .player-progress-bar:hover .player-progress-handle {
        animation: pulse-handle 1.5s ease-in-out infinite;
      }

      @keyframes pulse-handle {
        0%, 100% {
          box-shadow: 0 2px 8px rgba(255, 182, 193, 0.6),
                      0 0 0 0 rgba(255, 182, 193, 0.4);
        }
        50% {
          box-shadow: 0 2px 12px rgba(255, 182, 193, 0.8),
                      0 0 0 6px rgba(255, 182, 193, 0);
        }
      }

      .player-time-display {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 500;
        font-family: 'Courier New', monospace;
        letter-spacing: 0.5px;
      }

      /* Audio Visualizer */
      .player-visualizer {
        width: 100%;
        height: 60px;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.3);
        margin: 12px 0;
        display: block;
        box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
      }

      .player-expanded {
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .music-player.expanded .player-expanded {
        max-height: 150px;
        opacity: 1;
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px solid rgba(255, 182, 193, 0.25);
      }

      .player-controls-full {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-bottom: 12px;
      }

      .player-btn-full {
        background: rgba(255, 182, 193, 0.12);
        border: 1px solid rgba(255, 182, 193, 0.35);
        border-radius: 10px;
        padding: 10px 20px;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-size: 18px;
        position: relative;
        overflow: hidden;
      }

      .player-btn-full::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 182, 193, 0.2);
        transform: translate(-50%, -50%);
        transition: width 0.3s ease, height 0.3s ease;
      }

      .player-btn-full:hover::before {
        width: 150%;
        height: 150%;
      }

      .player-btn-full:hover {
        background: rgba(255, 182, 193, 0.25);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 182, 193, 0.3);
      }

      .player-btn-full:active {
        transform: translateY(0) scale(0.95);
      }

      .player-btn-full.active {
        background: rgba(255, 182, 193, 0.35);
        border-color: rgba(255, 182, 193, 0.7);
        box-shadow: 0 0 15px rgba(255, 182, 193, 0.4);
      }

      .player-volume-slider {
        padding: 10px 0;
      }

      .volume-range {
        width: 100%;
        height: 5px;
        border-radius: 3px;
        background: rgba(255, 182, 193, 0.2);
        outline: none;
        -webkit-appearance: none;
        cursor: pointer;
      }

      .volume-range::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(255, 182, 193, 1), rgba(255, 150, 180, 1));
        cursor: grab;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(255, 182, 193, 0.5);
      }

      .volume-range::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 3px 12px rgba(255, 182, 193, 0.7);
      }

      .volume-range::-webkit-slider-thumb:active {
        cursor: grabbing;
        transform: scale(1.1);
      }

      .volume-range::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(255, 182, 193, 1), rgba(255, 150, 180, 1));
        cursor: grab;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(255, 182, 193, 0.5);
        border: none;
      }

      .volume-percentage {
        text-align: center;
        font-size: 0.85rem;
        color: rgba(255, 182, 193, 0.9);
        margin-top: 6px;
        font-weight: 600;
      }

      .player-expand-btn {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, rgba(255, 182, 193, 0.3), rgba(255, 150, 180, 0.3));
        border: 1.5px solid rgba(255, 182, 193, 0.5);
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-size: 11px;
        box-shadow: 0 2px 8px rgba(255, 182, 193, 0.3);
      }

      .player-expand-btn:hover {
        background: linear-gradient(135deg, rgba(255, 182, 193, 0.5), rgba(255, 150, 180, 0.5));
        transform: translateX(-50%) scale(1.1);
        box-shadow: 0 4px 12px rgba(255, 182, 193, 0.5);
      }

      .player-expand-btn:active {
        transform: translateX(-50%) scale(0.95);
      }

      .music-player.expanded .player-expand-btn {
        transform: translateX(-50%) rotate(180deg);
      }

      .music-player.expanded .player-expand-btn:hover {
        transform: translateX(-50%) rotate(180deg) scale(1.1);
      }

      .player-minimize-btn {
        position: absolute;
        top: -12px;
        right: 10px;
        background: linear-gradient(135deg, rgba(255, 182, 193, 0.3), rgba(255, 150, 180, 0.3));
        border: 1.5px solid rgba(255, 182, 193, 0.5);
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        font-size: 11px;
        box-shadow: 0 2px 8px rgba(255, 182, 193, 0.3);
      }

      .player-minimize-btn:hover {
        background: linear-gradient(135deg, rgba(255, 182, 193, 0.5), rgba(255, 150, 180, 0.5));
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(255, 182, 193, 0.5);
      }

      /* Minimized state - collapses to small floating icon */
      .music-player.minimized {
        width: 60px !important;
        height: 60px !important;
        min-width: 60px !important;
        padding: 0 !important;
        border-radius: 50%;
        overflow: hidden;
      }

      .music-player.minimized .player-mini,
      .music-player.minimized .player-progress-container,
      .music-player.minimized .player-visualizer,
      .music-player.minimized .player-expanded,
      .music-player.minimized .player-expand-btn {
        display: none !important;
      }

      .music-player.minimized .player-minimize-btn {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        border-radius: 50%;
        font-size: 24px;
      }

      .music-player.minimized::before {
        content: '🎵';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 28px;
        pointer-events: none;
        z-index: 1;
      }

      /* Mobile Responsive */
      @media (max-width: 768px) {
        .music-player {
          min-width: 320px;
          max-width: 340px;
          bottom: 15px;
          right: 15px;
          padding: 14px 16px;
        }

        .player-title {
          font-size: 0.9rem;
        }

        .player-artist {
          font-size: 0.8rem;
        }

        .player-btn {
          width: 32px;
          height: 32px;
        }

        .player-visualizer {
          height: 50px;
        }
      }

      /* High DPI screens */
      @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
        .music-player {
          border-width: 0.5px;
        }
      }
    </style>`;
  }

  async initializeVisualizer() {
    this.canvas = this.element.querySelector('.player-visualizer');
    if (!this.canvas) return;

    this.canvasCtx = this.canvas.getContext('2d');

    // Set up audio context and analyser
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      // CRITICAL FIX: Resume AudioContext if suspended (required on mobile)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Connect to audio source if available
      if (this.music.currentTrack && !this.source) {
        this.source = this.audioContext.createMediaElementSource(this.music.currentTrack);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 128; // Lower for smoother bars
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
      }

      this.drawVisualizer();
    } catch (error) {
      console.warn('Audio visualizer not available:', error);
      // Hide canvas if visualizer can't be initialized (graceful degradation)
      if (this.canvas) {
        this.canvas.style.display = 'none';
      }
      // IMPORTANT: Don't let visualizer failure stop music playback
    }
  }

  drawVisualizer() {
    if (!this.canvasCtx || !this.analyser) return;

    this.animationId = requestAnimationFrame(() => this.drawVisualizer());

    this.analyser.getByteFrequencyData(this.dataArray);

    const width = this.canvas.width;
    const height = this.canvas.height;
    const barCount = this.dataArray.length;
    const barWidth = (width / barCount) * 2.5;
    let barHeight;
    let x = 0;

    // Clear canvas with fade effect
    this.canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.canvasCtx.fillRect(0, 0, width, height);

    // Draw frequency bars
    for (let i = 0; i < barCount; i++) {
      barHeight = (this.dataArray[i] / 255) * height * 0.8;

      // Create gradient for each bar
      const gradient = this.canvasCtx.createLinearGradient(0, height - barHeight, 0, height);
      gradient.addColorStop(0, `rgba(255, 182, 193, ${0.8 + (this.dataArray[i] / 255) * 0.2})`);
      gradient.addColorStop(0.5, `rgba(255, 150, 180, ${0.6 + (this.dataArray[i] / 255) * 0.4})`);
      gradient.addColorStop(1, `rgba(255, 120, 160, ${0.4 + (this.dataArray[i] / 255) * 0.6})`);

      this.canvasCtx.fillStyle = gradient;

      // Draw bar with rounded top
      this.canvasCtx.beginPath();
      this.canvasCtx.roundRect(x, height - barHeight, barWidth - 2, barHeight, [3, 3, 0, 0]);
      this.canvasCtx.fill();

      // Add glow effect
      this.canvasCtx.shadowBlur = 10;
      this.canvasCtx.shadowColor = `rgba(255, 182, 193, ${0.5 + (this.dataArray[i] / 255) * 0.5})`;

      x += barWidth + 1;
    }

    this.canvasCtx.shadowBlur = 0;
  }

  addEventListeners() {
    // Play/Pause
    const playPauseBtn = this.element.querySelector('.player-play-pause');
    playPauseBtn.addEventListener('click', () => this.togglePlayPause());

    // Next
    const nextBtn = this.element.querySelector('.player-next');
    nextBtn.addEventListener('click', () => {
      this.music.skipNext();
      // Reinitialize visualizer for new track
      setTimeout(() => this.reinitializeVisualizer(), 100);
    });

    // Previous
    const prevBtn = this.element.querySelector('.player-prev');
    prevBtn.addEventListener('click', () => {
      this.music.skipPrevious();
      setTimeout(() => this.reinitializeVisualizer(), 100);
    });

    // Visual Experience button
    const visualBtn = this.element.querySelector('.player-visual');
    visualBtn.addEventListener('click', () => {
      if (this.onVisualToggle) {
        this.onVisualToggle();
      }

      // Add tactile feedback
      gsap.to(visualBtn, {
        scale: 0.9,
        rotation: 360,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: 'back.out(2)'
      });
    });

    // Shuffle
    const shuffleBtn = this.element.querySelector('.player-shuffle');
    shuffleBtn.addEventListener('click', () => {
      this.music.toggleShuffle();
      shuffleBtn.classList.toggle('active');

      // Add tactile feedback
      gsap.to(shuffleBtn, {
        scale: 0.9,
        duration: 0.1,
        yoyo: true,
        repeat: 1
      });
    });

    // Volume button
    const volumeBtn = this.element.querySelector('.player-volume');
    const volumeSlider = this.element.querySelector('.player-volume-slider');
    volumeBtn.addEventListener('click', () => {
      const isVisible = volumeSlider.style.display === 'block';
      volumeSlider.style.display = isVisible ? 'none' : 'block';
    });

    // Volume slider
    const volumeRange = this.element.querySelector('.volume-range');
    const volumePercentage = this.element.querySelector('.volume-percentage');
    volumeRange.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value) / 100;
      this.music.setVolume(value);
      this.saveVolume(value);
      volumePercentage.textContent = `${Math.round(value * 100)}%`;
    });

    // Progress bar seeking
    const progressBar = this.element.querySelector('.player-progress-bar');
    const progressHandle = this.element.querySelector('.player-progress-handle');

    progressBar.addEventListener('click', (e) => this.seekToPosition(e));

    // Handle dragging
    progressHandle.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      progressHandle.classList.add('dragging');
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.seekToPosition(e);
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        progressHandle.classList.remove('dragging');
      }
    });

    // Expand/Collapse
    const expandBtn = this.element.querySelector('.player-expand-btn');
    expandBtn.addEventListener('click', () => this.toggleExpand());

    // Minimize
    const minimizeBtn = this.element.querySelector('.player-minimize-btn');
    minimizeBtn.addEventListener('click', () => this.toggleMinimize());
  }

  seekToPosition(e) {
    const progressBar = this.element.querySelector('.player-progress-bar');
    const rect = progressBar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    if (this.music.currentTrack && this.music.currentTrack.duration) {
      const newTime = percent * this.music.currentTrack.duration;
      this.music.currentTrack.currentTime = newTime;
      this.updateProgress();
    }
  }

  reinitializeVisualizer() {
    // Stop current animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Reset source
    this.source = null;

    // Reinitialize
    this.initializeVisualizer();
  }

  startProgressTracking() {
    this.progressInterval = setInterval(() => {
      if (this.music.currentTrack && !this.isDragging) {
        this.updateProgress();
      }
    }, 100); // Update every 100ms for smooth progress
  }

  updateProgress() {
    if (!this.music.currentTrack) return;

    const current = this.music.currentTrack.currentTime || 0;
    const duration = this.music.currentTrack.duration || 0;
    const percent = duration > 0 ? (current / duration) * 100 : 0;

    const progressFill = this.element.querySelector('.player-progress-fill');
    const progressHandle = this.element.querySelector('.player-progress-handle');
    const currentTimeEl = this.element.querySelector('.player-time-current');
    const totalTimeEl = this.element.querySelector('.player-time-total');

    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }

    if (progressHandle) {
      progressHandle.style.left = `${percent}%`;
    }

    if (currentTimeEl) {
      currentTimeEl.textContent = this.formatTime(current);
    }

    if (totalTimeEl && duration > 0) {
      totalTimeEl.textContent = this.formatTime(duration);
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async togglePlayPause() {
    const btn = this.element.querySelector('.player-play-pause');

    if (this.music.isPlaying) {
      this.music.pause();
      btn.textContent = '▶️';

      // Pause visualizer
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    } else {
      // MOBILE FIX: Resume audio context on user interaction
      if (this.audioContext && this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume();
        } catch (error) {
          console.warn('Failed to resume audio context:', error);
        }
      }

      this.music.resume();
      btn.textContent = '⏸';

      // Resume visualizer
      this.drawVisualizer();
    }

    // Tactile feedback
    gsap.to(btn, {
      scale: 0.85,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
    this.element.classList.toggle('expanded');

    // Animate expand with spring
    gsap.to(this.element, {
      scale: 0.98,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });
  }

  toggleMinimize() {
    const isMinimized = this.element.classList.toggle('minimized');

    if (isMinimized) {
      // Animate to icon
      gsap.to(this.element, {
        scale: 0.8,
        duration: 0.3,
        ease: 'back.in(1.7)'
      });
    } else {
      // Animate back to full
      gsap.to(this.element, {
        scale: 1,
        duration: 0.3,
        ease: 'back.out(1.7)'
      });
    }
  }

  updateTrackDisplay() {
    const track = this.music.getCurrentTrack();
    if (!track) return;

    const titleEl = this.element.querySelector('.player-title');
    const artistEl = this.element.querySelector('.player-artist');

    // Animate text change
    gsap.to([titleEl, artistEl], {
      opacity: 0,
      y: -10,
      duration: 0.3,
      onComplete: () => {
        titleEl.textContent = track.title;
        artistEl.textContent = track.artist;

        gsap.to([titleEl, artistEl], {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.1
        });
      }
    });
  }

  hide() {
    // Stop intervals and animations
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    gsap.to(this.element, {
      y: 150,
      opacity: 0,
      scale: 0.9,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        this.element.remove();
      }
    });
  }
}
