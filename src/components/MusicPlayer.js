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
    this.onGardenToggle = null; // Callback for garden toggle
    this.gardenUnlocked = false; // Will be set to true when Eternal Garden is completed

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

      <div class="player-expanded">
        <div class="player-controls-full">
          <button class="player-btn-full player-visual" title="Visual Experience">✨</button>
          <button class="player-btn-full player-garden" title="Eternal Garden" ${this.gardenUnlocked ? '' : 'style="display:none;"'}>🌸</button>
          <button class="player-btn-full player-tracklist" title="Track List">📜</button>
          <button class="player-btn-full player-request" title="Request a Song">🎤</button>
          <button class="player-btn-full player-shuffle ${this.music.shuffle ? 'active' : ''}" title="Shuffle">🔀</button>
          <button class="player-btn-full player-volume" title="Volume">🔊</button>
        </div>

        <div class="player-volume-slider" style="display: none;">
          <input type="range" class="volume-range" min="0" max="100" value="${this.music.volume * 100}" step="1">
          <div class="volume-percentage">${Math.round(this.music.volume * 100)}%</div>
        </div>
      </div>

      <!-- Track List Modal -->
      <div class="player-tracklist-modal" style="display: none;">
        <div class="tracklist-header">
          <h3>🎵 Your Playlist</h3>
          <button class="tracklist-close">✕</button>
        </div>
        <div class="tracklist-content">
          ${this.music.tracks.map((track, index) => `
            <div class="track-item" data-track-index="${index}">
              <div class="track-number">${index + 1}</div>
              <div class="track-info">
                <div class="track-name">${track.title}</div>
                <div class="track-artist">${track.artist}</div>
              </div>
              <button class="track-play-btn">▶️</button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Song Request Modal -->
      <div class="player-request-modal" style="display: none;">
        <div class="request-header">
          <h3>🎤 Request a Song</h3>
          <button class="request-close">✕</button>
        </div>
        <div class="request-content">
          <form class="song-request-form">
            <div class="form-group">
              <label>Song Name</label>
              <input type="text" name="songName" placeholder="Enter song title..." required>
            </div>
            <div class="form-group">
              <label>Artist</label>
              <input type="text" name="artist" placeholder="Enter artist name..." required>
            </div>
            <div class="form-group">
              <label>Why do you love this song? (Optional)</label>
              <textarea name="message" placeholder="Tell me why you want to hear this song..." rows="3"></textarea>
            </div>
            <button type="submit" class="request-submit-btn">Submit Request 💕</button>
          </form>
          <div class="request-success" style="display: none;">
            <div class="success-icon">✓</div>
            <p>Your song request has been sent!</p>
            <p class="success-subtitle">I'll add it to the playlist soon 💕</p>
          </div>
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

      /* Track List Modal */
      .player-tracklist-modal, .player-request-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(15, 10, 20, 0.98), rgba(35, 20, 35, 0.98));
        backdrop-filter: blur(30px);
        border: 1.5px solid rgba(255, 182, 193, 0.4);
        border-radius: 20px;
        padding: 0;
        max-width: 500px;
        width: 90%;
        max-height: 70vh;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 182, 193, 0.3);
        z-index: 10000;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .tracklist-header, .request-header {
        padding: 20px;
        border-bottom: 1px solid rgba(255, 182, 193, 0.25);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 182, 193, 0.05);
      }

      .tracklist-header h3, .request-header h3 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      .tracklist-close, .request-close {
        background: rgba(255, 182, 193, 0.2);
        border: 1px solid rgba(255, 182, 193, 0.4);
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 18px;
        color: rgba(255, 255, 255, 0.9);
        transition: all 0.2s ease;
      }

      .tracklist-close:hover, .request-close:hover {
        background: rgba(255, 182, 193, 0.4);
        transform: rotate(90deg) scale(1.1);
      }

      .tracklist-content {
        padding: 10px;
        overflow-y: auto;
        max-height: calc(70vh - 80px);
      }

      .track-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        background: rgba(255, 182, 193, 0.05);
        border: 1px solid rgba(255, 182, 193, 0.15);
        border-radius: 12px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .track-item:hover {
        background: rgba(255, 182, 193, 0.12);
        border-color: rgba(255, 182, 193, 0.3);
        transform: translateX(5px);
      }

      .track-number {
        font-size: 1.2rem;
        font-weight: 700;
        color: rgba(255, 182, 193, 0.8);
        min-width: 30px;
      }

      .track-info {
        flex: 1;
        min-width: 0;
      }

      .track-name {
        font-size: 1rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.95);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .track-artist {
        font-size: 0.85rem;
        color: rgba(255, 182, 193, 0.7);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .track-play-btn {
        background: rgba(255, 182, 193, 0.2);
        border: 1px solid rgba(255, 182, 193, 0.4);
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
      }

      .track-play-btn:hover {
        background: rgba(255, 182, 193, 0.4);
        transform: scale(1.1);
      }

      /* Song Request Form */
      .request-content {
        padding: 20px;
        overflow-y: auto;
        flex: 1;
        min-height: 0;
      }

      .song-request-form {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .form-group label {
        font-size: 0.9rem;
        font-weight: 600;
        color: rgba(255, 182, 193, 0.9);
      }

      .form-group input, .form-group textarea {
        background: rgba(255, 255, 255, 0.05);
        border: 1.5px solid rgba(255, 182, 193, 0.3);
        border-radius: 10px;
        padding: 12px 15px;
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.95);
        font-family: 'Montserrat', sans-serif;
        transition: all 0.2s ease;
      }

      .form-group input:focus, .form-group textarea:focus {
        outline: none;
        border-color: rgba(255, 182, 193, 0.6);
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 15px rgba(255, 182, 193, 0.2);
      }

      .form-group textarea {
        resize: vertical;
        min-height: 80px;
      }

      .request-submit-btn {
        background: linear-gradient(135deg, rgba(255, 182, 193, 0.8), rgba(255, 150, 180, 0.8));
        border: none;
        border-radius: 12px;
        padding: 14px 24px;
        font-size: 1.1rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.98);
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(255, 182, 193, 0.4);
        margin-top: 10px;
      }

      .request-submit-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(255, 182, 193, 0.6);
      }

      .request-submit-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .request-success {
        text-align: center;
        padding: 40px 20px;
      }

      .success-icon {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        background: linear-gradient(135deg, rgba(255, 182, 193, 0.8), rgba(255, 150, 180, 0.8));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
        color: white;
        animation: success-pop 0.5s ease;
      }

      @keyframes success-pop {
        0% { transform: scale(0); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }

      .request-success p {
        font-size: 1.2rem;
        color: rgba(255, 255, 255, 0.95);
        margin: 10px 0;
      }

      .success-subtitle {
        font-size: 1rem !important;
        color: rgba(255, 182, 193, 0.8) !important;
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

        .player-tracklist-modal, .player-request-modal {
          width: 95%;
          max-height: 60vh;
          top: 40%;
        }

        .request-content {
          padding: 16px;
          max-height: calc(60vh - 80px);
        }

        .player-btn-full {
          padding: 8px 16px;
          font-size: 16px;
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

    // Garden button
    const gardenBtn = this.element.querySelector('.player-garden');
    if (gardenBtn) {
      gardenBtn.addEventListener('click', () => {
        if (this.onGardenToggle) {
          this.onGardenToggle();
        }

        // Add tactile feedback
        gsap.to(gardenBtn, {
          scale: 0.9,
          rotation: 360,
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: 'back.out(2)'
        });
      });
    }

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

    // Track List button
    const tracklistBtn = this.element.querySelector('.player-tracklist');
    const tracklistModal = this.element.querySelector('.player-tracklist-modal');
    const tracklistClose = this.element.querySelector('.tracklist-close');

    tracklistBtn.addEventListener('click', () => {
      tracklistModal.style.display = 'block';
      gsap.fromTo(tracklistModal,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
      );
    });

    tracklistClose.addEventListener('click', () => this.closeModal(tracklistModal));

    // Track item clicks
    const trackItems = this.element.querySelectorAll('.track-item');
    trackItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const index = parseInt(item.dataset.trackIndex);
        this.music.playTrackByIndex(index);
        this.closeModal(tracklistModal);
        setTimeout(() => this.reinitializeVisualizer(), 100);
      });
    });

    // Song Request button
    const requestBtn = this.element.querySelector('.player-request');
    const requestModal = this.element.querySelector('.player-request-modal');
    const requestClose = this.element.querySelector('.request-close');

    requestBtn.addEventListener('click', () => {
      requestModal.style.display = 'block';
      gsap.fromTo(requestModal,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
      );
    });

    requestClose.addEventListener('click', () => this.closeModal(requestModal));

    // Song Request Form submission
    const requestForm = this.element.querySelector('.song-request-form');
    requestForm.addEventListener('submit', (e) => this.handleSongRequest(e));
  }

  closeModal(modal) {
    gsap.to(modal, {
      scale: 0.9,
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        modal.style.display = 'none';
      }
    });
  }

  async handleSongRequest(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('.request-submit-btn');
    const formData = new FormData(form);

    const songName = formData.get('songName');
    const artist = formData.get('artist');
    const message = formData.get('message');

    // Disable button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const web3FormsData = {
        access_key: 'eafc242f-6c42-4d16-9253-28c7b6969aa7',
        subject: '🎤 SONG REQUEST FROM MILA! 🎵',
        from_name: "Mila's World - Music Player",
        to: 'terrell.flautt@gmail.com',
        message: `
╔══════════════════════════════════════╗
║   🎤 SONG REQUEST FROM MILA! 🎵      ║
╚══════════════════════════════════════╝

SONG: ${songName}
ARTIST: ${artist}

${message ? `MILA'S MESSAGE:\n${message}` : '(No message)'}

══════════════════════════════════════

📅 Submitted: ${new Date().toLocaleString()}

══════════════════════════════════════

Time to add this to the playlist! 🎶
        `
      };

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(web3FormsData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to send song request');
      }

      // Show success
      form.style.display = 'none';
      const successDiv = this.element.querySelector('.request-success');
      successDiv.style.display = 'block';

      gsap.fromTo(successDiv,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );

      // Auto-close after 3 seconds
      setTimeout(() => {
        const modal = this.element.querySelector('.player-request-modal');
        this.closeModal(modal);
        // Reset form
        setTimeout(() => {
          form.reset();
          form.style.display = 'flex';
          successDiv.style.display = 'none';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Request 💕';
        }, 300);
      }, 3000);

    } catch (error) {
      console.error('Failed to submit song request:', error);
      alert('Oops! Something went wrong. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Request 💕';
    }
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

  /**
   * Unlock the garden button after Eternal Garden is discovered
   */
  unlockGarden() {
    this.gardenUnlocked = true;
    const gardenBtn = this.element?.querySelector('.player-garden');
    if (gardenBtn) {
      gardenBtn.style.display = '';
      // Animate the button appearing
      gsap.fromTo(gardenBtn,
        { scale: 0, opacity: 0, rotation: -180 },
        {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 0.8,
          ease: 'back.out(2)'
        }
      );
    }
  }
}
