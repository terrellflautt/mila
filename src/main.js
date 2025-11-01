/**
 * Mila's World - Main Entry Point
 * A love-powered interactive experience
 */

import { SecurityGate } from './components/SecurityGate.js';
import { DateRequestForm } from './components/DateRequestForm.js';
import { MusicalInstrument } from './components/MusicalInstrument.js';
import { MessageReveal } from './components/MessageReveal.js';
import { Stage } from './animations/Stage.js';
import { getCurrentPalette, applyPalette } from './config/colors.js';
import { getOrCreateVisitorId, generateDailySeed } from './utils/seed.js';
import { getDailyMessage } from './utils/dailyMessages.js';
import { hasAccess, recordVisit, getProgress, isPuzzleCompleted, markPuzzleCompleted, getPointsProgress, clearAllData, isFinalExperienceUnlocked, getStorageKey } from './utils/storage.js';
import { EchoChamber } from './puzzles/EchoChamber.js';
import { ReflectionsOfYou } from './puzzles/ReflectionsOfYou.js';
import { Choreographer } from './puzzles/Choreographer.js';
import { GalleryOfUs } from './puzzles/GalleryOfUs.js';
import { TheDialogue } from './puzzles/TheDialogue.js';
import { ConstellationYou } from './puzzles/ConstellationYou.js';
import { MirrorOfMoments } from './puzzles/MirrorOfMoments.js';
import { EternalGarden } from './puzzles/EternalGarden.js';
import { Grace } from './puzzles/Grace.js';
import { StageLight } from './puzzles/StageLight.js';
import { MonumentsOfLove } from './puzzles/MonumentsOfLove.js';
import { BackgroundMusic } from './utils/backgroundMusic.js';
import { MusicPlayer } from './components/MusicPlayer.js';
import { AudioVisualizer } from './components/AudioVisualizer.js';
import { PoemReward } from './components/PoemReward.js';
import { getPoemForExperience, markPoemAsSeen } from './data/lovePoems.js';
import { MagicCursor, add3DTilt, addMagicHover, createSparkles, createRipple, playSuccessChime, createThemedDiscoveryElement } from './utils/magicEffects.js';
import './styles/magicEffects.css';
import gsap from 'gsap';
import confetti from 'canvas-confetti';

class MilasWorld {
  constructor() {
    this.stage = null;
    this.visitorId = null;
    this.seed = null;
    this.palette = null;
    this.progress = null;
    this.musicalInstrument = null;
    this.messageReveal = null;
    this.currentActivePuzzle = null;
    this.backgroundMusic = new BackgroundMusic();
    this.musicPlayer = null;
    this.audioVisualizer = null;
    this.magicCursor = null;

    // All available experiences - ALL hidden until discovered one by one
    this.experiences = {
      // All experiences start hidden and must be discovered
      'Echo Chamber': {
        class: EchoChamber,
        icon: '🎵',
        description: 'Some rhythms sync without trying',
        hidden: true,
        discoveryHint: 'Not everything worth finding announces itself...',
        discoveryElement: 'whisper',   // Sound wave
        discoveryColor: '#B19CD9'      // Lavender
      },
      'Eternal Garden': {
        class: EternalGarden,
        icon: '🌸',
        description: 'What grows between us',
        hidden: true,
        discoveryHint: 'There is more than meets the eye...',
        discoveryElement: 'paint',     // Flower petal
        discoveryColor: '#FFB6C1'      // Pink
      },
      // More hidden experiences to discover
      'Reflections': {
        class: ReflectionsOfYou,
        icon: '🪞',
        description: "What you see depends on how you look",
        hidden: true,
        discoveryHint: 'Some things only appear when you stop looking...',
        discoveryElement: 'shimmer',  // Shimmering mirror fragment
        discoveryColor: '#88DDFF'     // Cyan/light blue
      },
      'Choreographer': {
        class: Choreographer,
        icon: '💫',
        description: 'Movement speaks louder than words',
        hidden: true,
        discoveryHint: 'Stillness reveals what motion conceals...',
        discoveryElement: 'trail',     // Dancing light trail
        discoveryColor: '#FFD700'      // Gold
      },
      'Gallery of Us': {
        class: GalleryOfUs,
        icon: '🎨',
        description: 'Some art only exists between two people',
        hidden: true,
        discoveryHint: 'What you seek is already seeking you...',
        discoveryElement: 'paint',     // Paint droplet
        discoveryColor: '#FF6B9D'      // Pink/magenta
      },
      'The Dialogue': {
        class: TheDialogue,
        icon: '💭',
        description: 'The best conversations happen in silence',
        hidden: true,
        discoveryHint: 'The quietest voices speak the loudest...',
        discoveryElement: 'whisper',   // Thought bubble
        discoveryColor: '#E8D5C4'      // Cream/beige
      },
      'Constellation You': {
        class: ConstellationYou,
        icon: '⭐',
        description: 'Separate points that form something whole',
        hidden: true,
        discoveryHint: 'The stars know your story...',
        discoveryElement: 'star',      // Yellow star (different from pink)
        discoveryColor: '#FFF44F'      // Bright yellow
      },
      'Mirror of Moments': {
        class: MirrorOfMoments,
        icon: '💎',
        description: 'Fragments that remember being one',
        hidden: true,
        discoveryHint: 'Broken things still hold light...',
        discoveryElement: 'crystal',   // Crystal shard/prism
        discoveryColor: '#C9A0DC'      // Purple/lavender
      },
      'Grace': {
        class: Grace,
        icon: '🎸',
        description: 'Her favorite artist, her favorite album',
        hidden: true,
        discoveryHint: 'beautiful melodies linger in sacred spaces...',
        discoveryElement: 'shimmer',   // Musical shimmer
        discoveryColor: '#E8D5C4'      // Cream/gold (Grace album aesthetic)
      },
      'Stage Light': {
        class: StageLight,
        icon: '🎭',
        description: 'A name written in light and verse',
        hidden: true,
        discoveryHint: 'The stage is set, the curtain waits...',
        discoveryElement: 'shimmer',   // Theatrical shimmer
        discoveryColor: '#FFD700'      // Gold spotlight
      },
      'Monuments of Love': {
        class: MonumentsOfLove,
        icon: '🏛️',
        description: 'A letter written in stone',
        hidden: true,  // Discovered sequentially after Grace
        discoveryHint: 'Love leaves monuments...',
        discoveryElement: 'shimmer',
        discoveryColor: '#FFD700'  // Gold
      }
    };

    // Define the sequential order of experiences (Acts)
    this.experienceOrder = [
      'Echo Chamber',        // Act 1 - First experience, unlocks instrument
      'Eternal Garden',      // Act 1 - Second experience, unlocks garden button
      'Reflections',         // Act 2
      'Choreographer',       // Act 2
      'Gallery of Us',       // Act 2
      'The Dialogue',        // Act 2
      'Constellation You',   // Act 2
      'Mirror of Moments',   // Act 3
      'Grace',               // Act 3
      'Monuments of Love',   // Act 3 - Grand finale
      // 'Stage Light' - Bonus epilogue triggered by piano after Monuments
    ];

    this.discoveredExperiences = this.loadDiscoveredExperiences();
  }

  /**
   * Load discovered experiences from localStorage
   */
  loadDiscoveredExperiences() {
    const stored = localStorage.getItem(getStorageKey('world-discovered'));
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Get the next experience that should be discoverable
   * Returns null if all are discovered or if previous not completed
   */
  getNextDiscoverableExperience() {
    // Find the first experience in order that hasn't been discovered yet
    for (const expName of this.experienceOrder) {
      const exp = this.experiences[expName];
      if (!exp || exp.disabled || exp.testOnly) continue;

      if (!this.discoveredExperiences.includes(expName)) {
        // This is the next one to discover
        // But check if the previous one is completed (except for the first one)
        const indexInOrder = this.experienceOrder.indexOf(expName);
        if (indexInOrder === 0) {
          // First experience - always available
          return expName;
        } else {
          // Check if previous experience is completed
          const previousExpName = this.experienceOrder[indexInOrder - 1];
          if (isPuzzleCompleted(previousExpName)) {
            return expName;
          } else {
            // Previous not completed yet - can't discover this one
            return null;
          }
        }
      }
    }

    // All experiences discovered
    return null;
  }

  /**
   * Mark an experience as discovered
   */
  markExperienceDiscovered(name) {
    if (!this.discoveredExperiences.includes(name)) {
      this.discoveredExperiences.push(name);
      localStorage.setItem(getStorageKey('world-discovered'), JSON.stringify(this.discoveredExperiences));
      this.showDiscoveryAnimation(name);

      // Unlock garden button in music player when Eternal Garden is discovered
      if (name === 'Eternal Garden' && this.musicPlayer) {
        this.musicPlayer.unlockGarden();
      }
    }
  }

  /**
   * Check if experience is visible (only if discovered)
   */
  isExperienceVisible(name) {
    return this.discoveredExperiences.includes(name);
  }

  async init() {
    // Remove loading screen after a moment
    await this.showLoading();

    // Check for test mode
    const urlParams = new URLSearchParams(window.location.search);
    const testExperience = urlParams.get('test');

    if (testExperience) {
      // Test mode: skip security gate, unlock all, start experience directly
      this.runTestMode(testExperience);
      return;
    }

    // Check if user has access
    if (!hasAccess()) {
      this.showSecurityGate();
    } else {
      this.startExperience();
    }
  }

  /**
   * Run in test mode - skip gate, auto-start experience
   */
  async runTestMode(experienceName) {
    console.log('🧪 TEST MODE:', experienceName);

    // Grant access and unlock all experiences for testing
    localStorage.setItem(getStorageKey('world-access'), 'granted');
    const allExperiences = Object.keys(this.experiences);
    localStorage.setItem(getStorageKey('world-discovered'), JSON.stringify(allExperiences));

    // Initialize minimal setup (no animations)
    this.visitorId = getOrCreateVisitorId();
    this.seed = generateDailySeed(this.visitorId);
    this.progress = recordVisit();

    // Start the requested experience immediately
    if (this.experiences[experienceName]) {
      this.startIndividualExperience(experienceName);
    } else {
      alert(`Experience "${experienceName}" not found`);
      window.location.href = '/test.html';
    }
  }

  /**
   * Play a random voice snippet during loading
   */
  playRandomVoiceSnippet() {
    const voiceSnippets = [
      '/voice/arms.m4a',
      '/voice/i-wish-you-were-here-baby.m4a',
      '/voice/id-build-you-monuments.m4a',
      '/voice/if-i-needed-ai-to-seduce-you.m4a',
      '/voice/love-at-first-sight.m4a',
      '/voice/you-are-beautiful.m4a'
    ];

    // Pick a random voice snippet
    const randomSnippet = voiceSnippets[Math.floor(Math.random() * voiceSnippets.length)];

    // Create and play audio
    const audio = new Audio(randomSnippet);
    audio.volume = 0.7; // Set volume to 70%

    // Play the audio (with error handling for autoplay restrictions)
    audio.play().catch(error => {
      console.log('❤️ Voice snippet autoplay blocked (user needs to interact first):', error);
      // If autoplay is blocked, try playing on first user interaction
      const playOnInteraction = () => {
        audio.play().catch(e => console.log('Voice playback failed:', e));
        document.removeEventListener('click', playOnInteraction);
        document.removeEventListener('touchstart', playOnInteraction);
      };
      document.addEventListener('click', playOnInteraction, { once: true });
      document.addEventListener('touchstart', playOnInteraction, { once: true });
    });

    console.log('❤️ Playing voice snippet:', randomSnippet);
  }

  /**
   * Show loading animation
   */
  showLoading() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const loading = document.querySelector('.loading');
        if (loading) {
          gsap.to(loading, {
            opacity: 0,
            duration: 1,
            ease: 'power2.inOut',
            onComplete: () => {
              loading.remove();
              resolve();
            }
          });
        } else {
          resolve();
        }
      }, 2000);
    });
  }

  /**
   * Show security gate
   */
  showSecurityGate() {
    const gate = new SecurityGate(() => {
      this.onGateSuccess();
    });

    gate.show();
  }

  /**
   * Handle successful gate entry
   */
  async onGateSuccess() {
    // Play random voice snippet when she successfully authenticates
    this.playRandomVoiceSnippet();

    // DON'T start music yet - wait until first puzzle is completed
    // This prevents music from playing over Echo Chamber audio

    // Initialize magic cursor for the entire experience
    this.magicCursor = new MagicCursor();

    // Beautiful confetti celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFB6C1', '#FFE4E1', '#E8D5C4']
    });

    // Wait a moment, then start experience
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.startExperience();
  }

  /**
   * Start the main experience
   */
  async startExperience() {
    // Initialize seed system
    this.visitorId = getOrCreateVisitorId();
    this.seed = generateDailySeed(this.visitorId);

    // Record visit
    this.progress = recordVisit();

    // Get current palette
    this.palette = getCurrentPalette(this.progress.currentAct, this.seed);
    applyPalette(this.palette);

    // Initialize stage
    const container = document.getElementById('app');
    this.stage = new Stage(container, this.palette, this.seed);

    // Show welcome message
    await this.showWelcomeMessage();

    // Open curtains with dramatic timing
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.stage.openCurtains();

    // Wait for curtains to open
    await new Promise(resolve => setTimeout(resolve, 2500));

    // First visit: Mystery mode - only show poetic hint
    if (this.progress.visitCount === 1 && this.discoveredExperiences.length === 0) {
      this.showMysteryMode();
    } else {
      this.showGallery();
    }
  }

  /**
   * Show welcome message
   */
  async showWelcomeMessage() {
    const welcomeEl = document.createElement('div');
    welcomeEl.className = 'welcome-message';

    if (this.progress.visitCount === 1) {
      welcomeEl.innerHTML = `
        <div class="welcome-title">Mila.</div>
        <div class="welcome-subtitle">Some things are built in the quiet.</div>
      `;
    } else {
      welcomeEl.innerHTML = `
        <div class="welcome-title">You're back.</div>
        <div class="welcome-subtitle">Good.</div>
      `;
    }

    document.body.appendChild(welcomeEl);

    // Animate in
    gsap.fromTo(welcomeEl,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: 'power2.out'
      }
    );

    // Hold, then fade out
    await new Promise(resolve => setTimeout(resolve, 3000));

    gsap.to(welcomeEl, {
      opacity: 0,
      y: -20,
      duration: 1,
      ease: 'power2.in',
      onComplete: () => {
        welcomeEl.remove();
      }
    });
  }

  /**
   * Show mystery mode for first-time visitors - minimal UI, everything to discover
   */
  showMysteryMode() {
    const mysteryUI = document.createElement('div');
    mysteryUI.className = 'mystery-mode-ui';
    mysteryUI.innerHTML = `
      <div class="mystery-message">
        <div class="mystery-whisper-main">Not everything worth finding announces itself.</div>
      </div>

      <div class="mystery-hints">
        <!-- Hidden breadcrumbs will appear here -->
      </div>
    `;

    document.body.appendChild(mysteryUI);

    // Fade in the message
    gsap.fromTo(mysteryUI,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 3,
        ease: 'power2.out'
      }
    );

    // Show discovery stars after message appears
    setTimeout(() => {
      this.createDiscoveryElements();
    }, 4000);

    // Add hidden interactive elements
    this.addMysteryElements();
  }

  /**
   * Add subtle mystery elements throughout the stage
   */
  addMysteryElements() {
    // Hidden phrases that appear on hover in unexpected places - sophisticated, confident
    const hiddenPhrases = [
      { text: "Some things are worth the search.", x: '15%', y: '25%' },
      { text: "The best discoveries happen slowly.", x: '75%', y: '60%' },
      { text: "Patience reveals what rushing conceals.", x: '40%', y: '80%' }
    ];

    hiddenPhrases.forEach((phrase, index) => {
      const el = document.createElement('div');
      el.className = 'hidden-whisper';
      el.textContent = phrase.text;
      el.style.position = 'fixed';
      el.style.left = phrase.x;
      el.style.top = phrase.y;
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      el.style.fontFamily = "'Cormorant Garamond', serif";
      el.style.fontSize = '0.9rem';
      el.style.fontStyle = 'italic';
      el.style.color = 'rgba(255, 228, 225, 0.8)';
      el.style.maxWidth = '250px';
      el.style.textAlign = 'center';
      el.style.textShadow = '0 2px 10px rgba(0, 0, 0, 0.8)';
      el.style.transition = 'opacity 0.8s ease';
      el.style.zIndex = '5';

      document.body.appendChild(el);

      // Create invisible hover area
      const hoverArea = document.createElement('div');
      hoverArea.style.position = 'fixed';
      hoverArea.style.left = phrase.x;
      hoverArea.style.top = phrase.y;
      hoverArea.style.width = '80px';
      hoverArea.style.height = '80px';
      hoverArea.style.transform = 'translate(-50%, -50%)';
      hoverArea.style.cursor = 'default';
      hoverArea.style.zIndex = '4';

      hoverArea.addEventListener('mouseenter', () => {
        gsap.to(el, {
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out'
        });
      });

      hoverArea.addEventListener('mouseleave', () => {
        gsap.to(el, {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.in'
        });
      });

      document.body.appendChild(hoverArea);
    });
  }

  /**
   * Transition from mystery mode to full gallery (triggered on first discovery)
   */
  unlockGallery() {
    const mysteryUI = document.querySelector('.mystery-mode-ui');

    if (mysteryUI) {
      // Fade out mystery message
      gsap.to(mysteryUI, {
        opacity: 0,
        y: -30,
        duration: 1,
        ease: 'power2.in',
        onComplete: () => {
          mysteryUI.remove();

          // Show the gallery
          this.showGallery();

          // Show a gentle revelation message
          this.showRevelationMessage();
        }
      });
    } else {
      // Already unlocked, just show gallery
      this.showGallery();
    }
  }

  /**
   * Show revelation message when gallery unlocks
   */
  showRevelationMessage() {
    const revelationEl = document.createElement('div');
    revelationEl.className = 'revelation-message';
    revelationEl.innerHTML = `
      <div class="revelation-text">There's more here than meets the eye.</div>
    `;

    document.body.appendChild(revelationEl);

    gsap.fromTo(revelationEl,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: 'power2.out'
      }
    );

    // Fade out after a moment
    setTimeout(() => {
      gsap.to(revelationEl, {
        opacity: 0,
        y: -20,
        duration: 1,
        ease: 'power2.in',
        onComplete: () => revelationEl.remove()
      });
    }, 3000);
  }

  /**
   * Show the gallery of experiences
   */
  showGallery() {
    const ui = this.createGalleryUI();
    document.body.appendChild(ui);

    gsap.fromTo(ui,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1,
        ease: 'power2.out'
      }
    );

    // Show musical instrument if Echo Chamber completed BUT not yet played
    // (Piano should only appear once, not on every page load)
    const hasPlayedPiano = localStorage.getItem(getStorageKey('piano-played')) === 'true';
    if (isPuzzleCompleted('Echo Chamber') && !hasPlayedPiano) {
      this.showMusicalInstrument();
    }

    // Show music player if user has already completed at least one puzzle
    const progress = getProgress();
    if (progress.completedPuzzles.length > 0 && !this.musicPlayer) {
      setTimeout(async () => {
        await this.backgroundMusic.start();
        this.musicPlayer = new MusicPlayer(this.backgroundMusic);
        this.musicPlayer.onVisualToggle = () => this.toggleVisualExperience();
        this.musicPlayer.onGardenToggle = () => this.toggleGardenExperience();

        // Unlock garden button if Eternal Garden is already discovered
        // IMPORTANT: Set this BEFORE show() so HTML is generated correctly
        if (this.discoveredExperiences.includes('Eternal Garden')) {
          this.musicPlayer.gardenUnlocked = true;
        }

        this.musicPlayer.show();
      }, 1000);
    }

    // Initialize message reveal
    this.messageReveal = new MessageReveal();

    // Continue showing discovery elements if there are more to find
    if (this.discoveredExperiences.length < Object.keys(this.experiences).filter(k => this.experiences[k].hidden).length) {
      this.createDiscoveryElements();
    }
  }

  /**
   * Show the musical instrument (unlocked after Echo Chamber)
   * Starts in collapsed state (icon only) for discovery
   */
  showMusicalInstrument() {
    if (this.musicalInstrument) return;

    this.musicalInstrument = new MusicalInstrument(() => this.onInstrumentPlayed());
    this.musicalInstrument.show(); // Will show as collapsed icon by default
  }

  /**
   * Create gallery UI
   */
  createGalleryUI() {
    const dailyMessage = getDailyMessage(this.visitorId);
    const pointsProgress = getPointsProgress();

    const ui = document.createElement('div');
    ui.className = 'main-ui';

    // Check if all experiences are complete
    const allComplete = this.experienceOrder.every(expName => isPuzzleCompleted(expName)) &&
                       isPuzzleCompleted('Stage Light');

    // If all complete: show ALL discovered experiences (for replaying)
    // If not complete: only show incomplete discovered experiences (one at a time)
    const experienceCards = Object.entries(this.experiences)
      .filter(([name]) => {
        if (!this.isExperienceVisible(name)) return false;

        if (allComplete) {
          // Show all discovered experiences for replaying
          return true;
        } else {
          // Only show incomplete experiences (current one to work on)
          return !isPuzzleCompleted(name);
        }
      })
      .map(([name, exp]) => {
        const isFinal = exp.isFinal ? 'final-experience' : '';
        return `
          <div class="experience-card ${isFinal}" data-experience="${name}">
            <div class="card-icon">${exp.icon}</div>
            <div class="card-title">${name}</div>
            <div class="card-description">${exp.description}</div>
            ${exp.isFinal ? '<div class="card-badge final-badge">★</div>' : ''}
          </div>
        `;
      }).join('');

    ui.innerHTML = `
      <div class="ui-container">
        <div class="daily-message">
          <div class="message-label">Today</div>
          <div class="message-text">${dailyMessage}</div>
        </div>

        <button class="date-request-btn">
          <span class="date-request-icon">💕</span>
          <span class="date-request-text">Request-a-Date</span>
        </button>

        <button class="reset-progress-btn" title="Reset Progress">
          <span class="reset-icon">↻</span>
        </button>

        <div class="points-progress-container">
          <div class="points-header">
            <span class="points-label">Your Progress</span>
            <span class="points-value">${pointsProgress.earned} / ${pointsProgress.total}</span>
          </div>
          <div class="points-bar">
            <div class="points-fill" style="width: ${pointsProgress.percentage}%"></div>
          </div>
          <div class="points-percentage">${pointsProgress.percentage}%</div>
        </div>

        <div class="gallery-title">Take Your Time</div>
        <div class="gallery-subtitle">Everything here is intentional.</div>

        <div class="experiences-container">
          <div class="experiences-grid">
            ${experienceCards}
          </div>
          <div class="carousel-dots"></div>
        </div>
      </div>
    `;

    // Add event listeners
    const dateRequestBtn = ui.querySelector('.date-request-btn');
    dateRequestBtn.addEventListener('click', () => {
      const form = new DateRequestForm();
      form.show();
    });

    // Reset button
    const resetBtn = ui.querySelector('.reset-progress-btn');
    resetBtn.addEventListener('click', () => {
      this.showResetConfirmation();
    });

    // Experience card clicks and 3D tilt effects
    const cards = ui.querySelectorAll('.experience-card');
    console.log('🎴 Setting up', cards.length, 'experience cards with click handlers');
    cards.forEach(card => {
      const experienceName = card.dataset.experience;
      console.log('  - Card:', experienceName);

      // Add 3D tilt effect
      add3DTilt(card, {
        maxTilt: 10,
        perspective: 1000,
        scale: 1.05
      });

      // Click handler
      card.addEventListener('click', (event) => {
        console.log('🖱️ Card clicked:', experienceName);
        console.log('🖱️ Event details:', {
          type: event.type,
          target: event.target.className,
          isTrusted: event.isTrusted,
          currentTarget: event.currentTarget.className
        });
        this.startIndividualExperience(experienceName);
      });
    });

    // Setup carousel dots and scroll tracking for mobile
    const isMobile = window.innerWidth <= 768;
    if (isMobile && cards.length > 1) {
      const dotsContainer = ui.querySelector('.carousel-dots');
      const grid = ui.querySelector('.experiences-grid');

      // Create dots
      cards.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'carousel-dot' + (index === 0 ? ' active' : '');
        dot.addEventListener('click', () => {
          const cardWidth = cards[0].offsetWidth;
          const gap = 16; // 1rem gap
          grid.scrollTo({
            left: index * (cardWidth + gap),
            behavior: 'smooth'
          });
        });
        dotsContainer.appendChild(dot);
      });

      // Track scroll position and update active dot
      let scrollTimeout;
      grid.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const scrollLeft = grid.scrollLeft;
          const cardWidth = cards[0].offsetWidth;
          const gap = 16;
          const activeIndex = Math.round(scrollLeft / (cardWidth + gap));

          dotsContainer.querySelectorAll('.carousel-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === activeIndex);
          });
        }, 50);
      });
    }

    return ui;
  }

  /**
   * Show reset confirmation popup
   */
  showResetConfirmation() {
    const popup = document.createElement('div');
    popup.className = 'reset-confirmation-overlay';
    popup.innerHTML = `
      <div class="reset-confirmation-modal">
        <div class="reset-modal-icon">⚠️</div>
        <div class="reset-modal-title">Start over?</div>
        <div class="reset-modal-message">
          This will erase all your progress, completed experiences, and discovered secrets.
          <br><br>
          Are you absolutely sure you want to start over?
        </div>
        <div class="reset-modal-buttons">
          <button class="reset-cancel-btn">Cancel</button>
          <button class="reset-confirm-btn">Yes, Reset Everything</button>
        </div>
      </div>
    `;

    document.body.appendChild(popup);

    // Animate in
    gsap.fromTo(popup,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );

    gsap.fromTo(popup.querySelector('.reset-confirmation-modal'),
      { scale: 0.9, y: 50 },
      { scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.4)' }
    );

    // Event listeners
    const cancelBtn = popup.querySelector('.reset-cancel-btn');
    const confirmBtn = popup.querySelector('.reset-confirm-btn');

    const close = () => {
      gsap.to(popup, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => popup.remove()
      });
    };

    cancelBtn.addEventListener('click', close);

    confirmBtn.addEventListener('click', () => {
      // Clear all data
      clearAllData();

      // Show confirmation message
      const message = document.createElement('div');
      message.className = 'reset-success-message';
      message.textContent = 'Progress reset. Refreshing...';
      document.body.appendChild(message);

      gsap.fromTo(message,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5 }
      );

      // Reload after brief delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    });

    // Close on overlay click
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        close();
      }
    });
  }

  /**
   * Start an individual experience (puzzle)
   */
  startIndividualExperience(name) {
    console.log('🎯 startIndividualExperience called for:', name);
    console.log('📍 Call stack:', new Error().stack);

    if (this.currentActivePuzzle) {
      console.log('⚠️ Already in an experience, ignoring click');
      return; // Already in an experience
    }

    const experience = this.experiences[name];
    if (!experience) {
      console.log('❌ Experience not found:', name);
      return;
    }

    // Check if already completed
    const isCompleted = isPuzzleCompleted(name);
    console.log('✅ Opening experience:', name, '| Already completed:', isCompleted);

    // Duck background music to 5% so experience audio can be heard clearly
    this.backgroundMusic.duck(0.05, 1000);

    const puzzle = new experience.class(() => {
      console.log('🎉 Puzzle callback triggered for:', name);
      this.onExperienceComplete(name);
    });

    this.currentActivePuzzle = puzzle;
    console.log('🎮 Setting currentActivePuzzle to:', name);
    puzzle.show();
  }

  /**
   * Handle experience completion
   */
  onExperienceComplete(name) {
    console.log('🎉 onExperienceComplete called for:', name);
    console.log('🎮 Clearing currentActivePuzzle (was:', this.currentActivePuzzle ? 'active' : 'null', ')');
    this.currentActivePuzzle = null;

    // Restore background music volume
    this.backgroundMusic.unduck(1500);

    // Mark as completed
    markPuzzleCompleted(name);
    console.log('✅ Puzzle marked as completed');

    // Check if we're in test mode
    const urlParams = new URLSearchParams(window.location.search);
    const isTestMode = urlParams.has('test');
    console.log('🧪 Test mode:', isTestMode);

    // STEP 1: Brief confetti celebration
    console.log('🎊 Showing confetti...');
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#FFB6C1', '#FFE4E1', '#E8D5C4']
    });

    // STEP 2: Wait for confetti, then update UI and show poem
    setTimeout(() => {
      // Update gallery card to show completion (skip in test mode)
      if (!isTestMode) {
        const card = document.querySelector(`[data-experience="${name}"]`);
        if (card && !card.classList.contains('completed')) {
        card.classList.add('completed');
        const badge = document.createElement('div');
        badge.className = 'card-badge';
        badge.textContent = '✓';
        card.appendChild(badge);

          gsap.fromTo(badge,
            { scale: 0, rotation: -180 },
            { scale: 1, rotation: 0, duration: 0.6, ease: 'back.out(2)' }
          );
        }

        // Update points display
        const pointsProgress = getPointsProgress();
        const pointsValue = document.querySelector('.points-value');
        const pointsFill = document.querySelector('.points-fill');
        const pointsPercentage = document.querySelector('.points-percentage');

        if (pointsValue) {
          pointsValue.textContent = `${pointsProgress.earned} / ${pointsProgress.total}`;
        }
        if (pointsFill) {
          gsap.to(pointsFill, {
            width: `${pointsProgress.percentage}%`,
            duration: 0.8,
            ease: 'power2.out'
          });
        }
        if (pointsPercentage) {
          pointsPercentage.textContent = `${pointsProgress.percentage}%`;
        }
      }

      // STEP 3: Wait a moment, then show poem reward
      setTimeout(() => {
        console.log('📖 Getting poem for:', name);
        // Get poem for this experience
        const poemData = getPoemForExperience(name);
        console.log('📖 Poem data:', poemData ? 'Found' : 'NOT FOUND');

        if (poemData) {
          const { poem, index } = poemData;
          console.log('📖 Showing poem:', poem.title);

          // Show poem reward
          const poemReward = new PoemReward(poem, () => {
            console.log('📖 Poem closed by user');
            console.log('🎮 currentActivePuzzle status:', this.currentActivePuzzle ? 'STILL ACTIVE (BUG!)' : 'null (correct)');

            // Mark poem as seen
            markPoemAsSeen(name, index);

            // If in test mode, redirect back after poem closes
            if (isTestMode) {
              setTimeout(() => {
                console.log('✅ Test complete (with poem), returning to test page');
                window.location.href = '/test.html?test-complete=' + encodeURIComponent(name);
              }, 500);
              return;
            }

            // Check if this is the first experience completed - if so, start music!
            const progress = getProgress();
            const isFirstCompletion = progress.completedPuzzles.length === 1;

            if (isFirstCompletion && !this.musicPlayer) {
              // Start background music after first puzzle with beautiful fade-in
              setTimeout(async () => {
                await this.backgroundMusic.start();

                // Create and show music player
                setTimeout(() => {
                  this.musicPlayer = new MusicPlayer(this.backgroundMusic);
                  // Wire up visual experience toggle
                  this.musicPlayer.onVisualToggle = () => this.toggleVisualExperience();
                  this.musicPlayer.onGardenToggle = () => this.toggleGardenExperience();

                  // Unlock garden button if Eternal Garden is already discovered
                  // IMPORTANT: Set this BEFORE show() so HTML is generated correctly
                  if (this.discoveredExperiences.includes('Eternal Garden')) {
                    this.musicPlayer.gardenUnlocked = true;
                  }

                  // Show the player so she can control the music
                  this.musicPlayer.show();
                }, 1500);
              }, 1000);
            }

            // Special unlock for Echo Chamber
            if (name === 'Echo Chamber' && !this.musicalInstrument) {
              setTimeout(() => {
                this.showMusicalInstrument();
              }, 1000);
            }

            // Check if there's a next sequential experience to discover
            setTimeout(() => {
              const nextExpName = this.getNextDiscoverableExperience();

              console.log('🔍 Checking for next sequential experience after', name, 'completion');
              console.log('🔍 Next experience:', nextExpName || 'NONE');

              if (nextExpName) {
                console.log('🌟 Next sequential experience available:', nextExpName);

                // Create discovery element for the next experience
                if (this.discoveryContainer) {
                  this.currentDiscoveryWanderingStopped = false;
                  this.createWanderingDiscoveryElement();
                } else {
                  // Container doesn't exist, create it fresh
                  this.createDiscoveryElements();
                }
              } else {
                console.log('✅ No more sequential experiences available');

                // Check if this was Monuments of Love completing
                // If so, show piano for Stage Light bonus epilogue
                if (name === 'Monuments of Love' && !this.musicalInstrument) {
                  console.log('🎹 Monuments complete! Showing piano for Stage Light bonus...');
                  setTimeout(() => {
                    this.showMusicalInstrument();
                  }, 2000);
                }
              }
            }, 2000);
          });

          poemReward.show();
        }
      }, 600);
    }, 1200);
  }

  /**
   * Handle when the musical instrument is played
   * First time: After Echo Chamber → reveals Eternal Garden
   * Second time: After Monuments → reveals Stage Light (bonus epilogue)
   */
  onInstrumentPlayed() {
    console.log('🎹 Piano played!');
    console.log('🎹 Completed puzzles:', getProgress().completedPuzzles);
    console.log('🎹 Discovered experiences:', this.discoveredExperiences);

    // Check if this is the second piano (after Monuments)
    const monumentsComplete = isPuzzleCompleted('Monuments of Love');
    const stageLightDiscovered = this.discoveredExperiences.includes('Stage Light');

    console.log('🎹 Monuments complete:', monumentsComplete);
    console.log('🎹 Stage Light discovered:', stageLightDiscovered);

    if (monumentsComplete && !stageLightDiscovered) {
      // Second piano: Reveal Stage Light as bonus epilogue
      console.log('🎹 Piano played after Monuments! Revealing Stage Light bonus...');

      this.markExperienceDiscovered('Stage Light');

      // Refresh gallery to show Stage Light card
      setTimeout(() => {
        const ui = document.querySelector('.main-ui');
        if (ui) {
          const newUI = this.createGalleryUI();
          ui.replaceWith(newUI);

          gsap.fromTo(newUI,
            { opacity: 0 },
            { opacity: 1, duration: 1, ease: 'power2.out' }
          );
        }
      }, 1500);

      // Hide piano
      setTimeout(() => {
        if (this.musicalInstrument) {
          this.musicalInstrument.hide();
          this.musicalInstrument = null;
        }
      }, 2000);

      return;
    }

    // First piano: Normal sequential discovery flow
    // Mark piano as played so it doesn't show again on page reload
    localStorage.setItem(getStorageKey('piano-played'), 'true');

    // Get the next sequential experience to discover
    const experienceName = this.getNextDiscoverableExperience();

    if (experienceName) {
      // Reveal the next sequential experience
      this.markExperienceDiscovered(experienceName);

      // Refresh the gallery UI to show the new card
      setTimeout(() => {
        const ui = document.querySelector('.main-ui');
        if (ui) {
          const newUI = this.createGalleryUI();
          ui.replaceWith(newUI);

          // Animate in the new card
          gsap.fromTo(newUI,
            { opacity: 0 },
            { opacity: 1, duration: 1, ease: 'power2.out' }
          );
        }

        // Don't create next discovery element yet
        // Wait for them to COMPLETE the current puzzle first
        // (Next element will be created in onExperienceComplete)
        console.log('⏳ Waiting for puzzle completion before showing next discovery element');
      }, 1500);
    }

    // HIDE the piano after playing (not just minimize)
    setTimeout(() => {
      if (this.musicalInstrument) {
        this.musicalInstrument.hide();
        this.musicalInstrument = null;
      }
    }, 2000);
  }

  /**
   * Toggle visual experience - Show audio-reactive visual art
   */
  toggleVisualExperience() {
    if (this.audioVisualizer) {
      // Hide existing visualizer
      this.audioVisualizer.hide();
      this.audioVisualizer = null;
    } else {
      // Create and show audio visualizer
      this.audioVisualizer = new AudioVisualizer(this.backgroundMusic);
      this.audioVisualizer.show();
    }
  }

  /**
   * Toggle the Eternal Garden experience from music player
   */
  toggleGardenExperience() {
    console.log('🌸 Garden button clicked!');
    console.log('🌸 Garden experience exists:', !!this.experiences['Eternal Garden']);
    console.log('🌸 Garden discovered:', this.discoveredExperiences.includes('Eternal Garden'));
    console.log('🌸 Current active puzzle:', this.currentActivePuzzle ? 'YES' : 'NO');

    const gardenExperience = this.experiences['Eternal Garden'];
    if (gardenExperience && this.discoveredExperiences.includes('Eternal Garden')) {
      console.log('✅ Opening Eternal Garden...');
      this.startIndividualExperience('Eternal Garden');
    } else {
      console.log('❌ Cannot open garden - not discovered or doesn\'t exist');
    }
  }

  /**
   * Create peaceful discovery elements throughout the stage
   */
  createDiscoveryElements() {
    const hiddenExperiences = Object.entries(this.experiences)
      .filter(([name, exp]) => exp.hidden && !exp.disabled && !exp.testOnly && !this.discoveredExperiences.includes(name));

    if (hiddenExperiences.length === 0) return; // All discovered

    // Create subtle, clickable discovery elements
    const discoveryContainer = document.createElement('div');
    discoveryContainer.className = 'discovery-elements';
    document.body.appendChild(discoveryContainer);

    // Store available experiences for random selection
    this.hiddenExperiences = hiddenExperiences;
    this.discoveryContainer = discoveryContainer;

    // Start first wandering star after a delay
    setTimeout(() => {
      this.createWanderingDiscoveryElement();
    }, 3000);
  }

  /**
   * Get a safe random position that avoids existing UI elements
   */
  getSafeRandomPosition() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const isMobile = viewportWidth <= 768;
    const isVerySmall = viewportWidth <= 480;

    // Responsive padding based on screen size
    const padding = isVerySmall ? 40 : isMobile ? 50 : 60;

    // Define safe zones (avoid these areas) - responsive to viewport size
    const avoidZones = [];

    // Date request button (top right) - responsive positioning
    if (isVerySmall) {
      avoidZones.push({ x: viewportWidth - 70, y: 0, width: 70, height: 60 });
    } else if (isMobile) {
      avoidZones.push({ x: viewportWidth - 120, y: 0, width: 120, height: 70 });
    } else {
      avoidZones.push({ x: viewportWidth - 200, y: 0, width: 200, height: 80 });
    }

    // Daily message (top center) - use actual max-width
    const messageWidth = Math.min(600, viewportWidth - 40);
    const messageX = (viewportWidth - messageWidth) / 2;
    avoidZones.push({
      x: Math.max(0, messageX - 20),
      y: 0,
      width: messageWidth + 40,
      height: isMobile ? 120 : 150
    });

    // Gallery cards (bottom area) - full width on mobile
    if (isVerySmall) {
      avoidZones.push({
        x: 0,
        y: viewportHeight - 300,
        width: viewportWidth,
        height: 300
      });
    } else if (isMobile) {
      avoidZones.push({
        x: 0,
        y: viewportHeight - 350,
        width: viewportWidth,
        height: 350
      });
    } else {
      const galleryWidth = Math.min(1200, viewportWidth - 80);
      avoidZones.push({
        x: (viewportWidth - galleryWidth) / 2,
        y: viewportHeight - 400,
        width: galleryWidth,
        height: 400
      });
    }

    // Gallery title area (middle) - responsive width
    const titleWidth = Math.min(800, viewportWidth - 80);
    avoidZones.push({
      x: (viewportWidth - titleWidth) / 2,
      y: viewportHeight / 2 - 100,
      width: titleWidth,
      height: isMobile ? 150 : 200
    });

    let attempts = 0;
    let maxAttempts = 50;
    let safePosition = null;

    while (attempts < maxAttempts && !safePosition) {
      const x = padding + Math.random() * (viewportWidth - padding * 2);
      const y = padding + Math.random() * (viewportHeight - padding * 2);

      // Check if this position overlaps with any avoid zone
      const isOverlapping = avoidZones.some(zone =>
        x > zone.x && x < zone.x + zone.width &&
        y > zone.y && y < zone.y + zone.height
      );

      if (!isOverlapping) {
        safePosition = { x, y };
      }

      attempts++;
    }

    // Fallback to corner if no safe position found
    if (!safePosition) {
      safePosition = { x: padding, y: padding };
    }

    return safePosition;
  }

  /**
   * Create a wandering discovery element that fades in/out and moves
   */
  createWanderingDiscoveryElement() {
    // FIXED: Only allow ONE discovery element at a time (star OR piano OR curtain)
    if (this.currentDiscoveryElement && this.currentDiscoveryElement.parentNode) {
      console.log('🌟 Discovery element already active, not creating another');
      return;
    }

    // Also check if piano is showing
    if (this.musicalInstrument) {
      console.log('🎹 Piano already active, not creating discovery element');
      return;
    }

    // Get the next sequential experience that should be discoverable
    const nextExpName = this.getNextDiscoverableExperience();

    if (!nextExpName) {
      console.log('🌟 No discoverable experience available (waiting for completion of previous)');
      return;
    }

    // Randomly choose what to show: 90% discovery star, 10% curtain poem
    const random = Math.random();

    if (random < 0.10 && this.messageReveal && this.discoveredExperiences.length > 1) {
      // Show curtain poem reveal instead (10% chance, after discovering 2+ experiences)
      console.log('🎭 Showing curtain poem instead of discovery star');
      this.messageReveal.reveal(this.visitorId);
      return;
    }

    // Otherwise show regular discovery star (90% chance)
    const name = nextExpName;
    const exp = this.experiences[nextExpName];

    if (!exp) {
      console.log('🌟 Experience not found:', nextExpName);
      return;
    }

    // Use themed discovery element
    const element = createThemedDiscoveryElement(
      exp.discoveryElement,
      exp.discoveryColor
    );

    // Update tooltip text
    const tooltip = element.querySelector('.hint-tooltip');
    if (tooltip) {
      tooltip.textContent = exp.discoveryHint;
    }

    element.style.position = 'fixed';
    element.style.opacity = '0';

    // FIXED: Store reference to current discovery element
    this.currentDiscoveryElement = element;

    this.discoveryContainer.appendChild(element);

    // Hover to reveal tooltip
    element.addEventListener('mouseenter', () => {
      const tooltip = element.querySelector('.hint-tooltip');
      gsap.to(tooltip, {
        opacity: 1,
        y: -10,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    element.addEventListener('mouseleave', () => {
      const tooltip = element.querySelector('.hint-tooltip');
      gsap.to(tooltip, {
        opacity: 0,
        y: 0,
        duration: 0.3,
        ease: 'power2.in'
      });
    });

    // Click to discover
    element.addEventListener('click', () => {
      this.onDiscoveryClick(name, element);
      this.currentDiscoveryWanderingStopped = true; // Stop wandering when clicked
    });

    // Start the wandering cycle
    this.wanderDiscoveryStar(element);
  }

  /**
   * Make a discovery star wander: fade in → stay → fade out → move → repeat
   * ONLY if the previous puzzle is completed
   */
  wanderDiscoveryStar(element) {
    if (this.currentDiscoveryWanderingStopped) return;

    const cycle = () => {
      if (this.currentDiscoveryWanderingStopped || !element.parentNode) return;

      // Get new safe position
      const pos = this.getSafeRandomPosition();
      element.style.left = pos.x + 'px';
      element.style.top = pos.y + 'px';

      // Phase 1: Fade in (2s)
      gsap.to(element, {
        opacity: 0.5,
        scale: 1,
        duration: 2,
        ease: 'power2.out',
        onComplete: () => {
          if (this.currentDiscoveryWanderingStopped || !element.parentNode) return;

          // Phase 2: Gentle pulsing while visible (4s)
          gsap.to(element, {
            opacity: 0.7,
            duration: 1.5,
            yoyo: true,
            repeat: 1,
            ease: 'sine.inOut',
            onComplete: () => {
              if (this.currentDiscoveryWanderingStopped || !element.parentNode) return;

              // Phase 3: Fade out (2s)
              gsap.to(element, {
                opacity: 0,
                scale: 0.8,
                duration: 2,
                ease: 'power2.in',
                onComplete: () => {
                  // Wait a moment, then start cycle again
                  setTimeout(cycle, 1000);
                }
              });
            }
          });
        }
      });
    };

    cycle();
  }

  /**
   * Handle discovery element click
   */
  onDiscoveryClick(name, element) {
    // Stop current wandering
    this.currentDiscoveryWanderingStopped = true;

    // Mark as discovered
    this.markExperienceDiscovered(name);

    // Remove the hint element gently
    gsap.to(element, {
      opacity: 0,
      scale: 1.5,
      duration: 1,
      ease: 'power2.out',
      onComplete: () => {
        element.remove();
        // FIXED: Clear reference so new star can spawn
        this.currentDiscoveryElement = null;
      }
    });

    // If this is the FIRST discovery ever, unlock the gallery
    const isFirstDiscovery = this.discoveredExperiences.length === 1 && this.progress.visitCount === 1;

    if (isFirstDiscovery) {
      // First discovery unlocks the whole system
      setTimeout(() => {
        this.unlockGallery();
      }, 1500);
      return;
    }

    // Otherwise, refresh gallery to show new experience
    setTimeout(() => {
      const ui = document.querySelector('.main-ui');
      if (ui) {
        const newUI = this.createGalleryUI();
        ui.replaceWith(newUI);

        // Animate in the new card
        gsap.fromTo(newUI,
          { opacity: 0 },
          { opacity: 1, duration: 1, ease: 'power2.out' }
        );
      }

      // Don't create next discovery element yet
      // Wait for them to COMPLETE the current puzzle first
      // (Next element will be created in onExperienceComplete)
      console.log('⏳ Waiting for puzzle completion before showing next discovery element');
    }, 1500);
  }

  /**
   * Show gentle discovery animation
   */
  showDiscoveryAnimation(name) {
    const exp = this.experiences[name];

    // Gentle confetti
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#FFB6C1', '#FFE4E1', '#E8D5C4'],
      startVelocity: 20,
      gravity: 0.6
    });

    // Show discovery message
    const message = document.createElement('div');
    message.className = 'discovery-message';
    message.innerHTML = `
      <div class="discovery-icon">${exp.icon}</div>
      <div class="discovery-text">You found:</div>
      <div class="discovery-name">${name}</div>
    `;
    document.body.appendChild(message);

    gsap.fromTo(message,
      { opacity: 0, scale: 0.9, y: 30 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.8,
        ease: 'back.out(1.7)'
      }
    );

    // Hold, then fade out
    setTimeout(() => {
      gsap.to(message, {
        opacity: 0,
        y: -20,
        duration: 0.8,
        ease: 'power2.in',
        onComplete: () => message.remove()
      });
    }, 2500);
  }
}

// Styles
const styles = `
.welcome-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 1000;
  pointer-events: none;
}

.welcome-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 1rem;
}

.welcome-subtitle {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 300;
  font-style: italic;
  color: var(--color-secondary, #FFE4E1);
}

.main-ui {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.ui-container {
  width: 100%;
  height: 100%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end; /* Push content to bottom */
  align-items: center;
}

.daily-message {
  display: none; /* Hide to reduce clutter */
}

.message-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--color-highlight, #FFB6C1);
  margin-bottom: 0.5rem;
}

.message-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 400;
  font-style: italic;
  color: var(--color-primary, #FFF8F0);
  line-height: 1.4;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.gallery-title {
  display: none; /* Hide to reduce clutter */
}

.gallery-subtitle {
  display: none; /* Hide to reduce clutter */
}

.experiences-container {
  position: relative;
  width: 100%;
}

.carousel-dots {
  display: none;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 1rem 0;
  pointer-events: auto;
}

.carousel-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.carousel-dot.active {
  background: var(--color-highlight, #FFB6C1);
  width: 24px;
  border-radius: 4px;
  box-shadow: 0 0 12px rgba(255, 182, 193, 0.6);
}

.carousel-dot:hover {
  background: rgba(255, 255, 255, 0.6);
  transform: scale(1.2);
}

@media (max-width: 768px) {
  .carousel-dots {
    display: flex;
  }
}

.experiences-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  padding: 0 0.5rem 0.75rem;
  max-width: 900px;
  margin: 0 auto;
  pointer-events: auto;
}

/* Mobile: Horizontal scroll carousel with snap */
@media (max-width: 768px) {
  .experiences-grid {
    display: flex;
    grid-template-columns: none;
    flex-direction: row;
    gap: 0.5rem;
    padding: 0 0.5rem 0.5rem;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }

  .experiences-grid::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  .experience-card {
    flex: 0 0 70vw;
    max-width: 240px;
    scroll-snap-align: center;
    scroll-snap-stop: always;
  }
}

.experience-card {
  position: relative;
  padding: 1rem 0.75rem;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1.5px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.experience-card:hover {
  transform: translateY(-8px);
  border-color: var(--color-highlight, #FFB6C1);
  box-shadow: 0 12px 40px rgba(255, 182, 193, 0.3);
  background: rgba(0, 0, 0, 0.6);
}

.experience-card.completed {
  border-color: rgba(136, 238, 136, 0.3);
}

.experience-card.completed:hover {
  border-color: rgba(136, 238, 136, 0.6);
  box-shadow: 0 12px 40px rgba(136, 238, 136, 0.2);
}

.card-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.card-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.1rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 0.4rem;
}

.card-description {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  font-weight: 300;
  line-height: 1.4;
  color: rgba(255, 235, 240, 0.95);
}

.card-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 32px;
  height: 32px;
  background: rgba(136, 238, 136, 0.2);
  border: 2px solid rgba(136, 238, 136, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #88ee88;
}

/* Final Experience Special Styling */
.experience-card.final-experience {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 182, 193, 0.1) 100%);
  border-color: rgba(255, 215, 0, 0.4);
  box-shadow: 0 8px 32px rgba(255, 215, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.experience-card.final-experience::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 215, 0, 0.1) 50%,
    transparent 70%
  );
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.experience-card.final-experience:hover {
  border-color: rgba(255, 215, 0, 0.8);
  box-shadow: 0 12px 48px rgba(255, 215, 0, 0.4);
  transform: translateY(-12px) scale(1.02);
}

.experience-card.final-experience .card-icon {
  font-size: 3.5rem;
  filter: drop-shadow(0 4px 12px rgba(255, 215, 0, 0.6));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.experience-card.final-experience .card-title {
  color: #FFD700;
  text-shadow: 0 2px 12px rgba(255, 215, 0, 0.4);
  font-size: 1.3rem;
}

.card-badge.final-badge {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 182, 193, 0.3));
  border-color: rgba(255, 215, 0, 0.8);
  color: #FFD700;
  font-size: 1.5rem;
  animation: pulse-gold 2s ease-in-out infinite;
}

@keyframes pulse-gold {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 0 10px rgba(255, 215, 0, 0);
  }
}

.act-indicator {
  pointer-events: auto;
  position: absolute;
  top: 2rem;
  left: 2rem;
  text-align: left;
}

.act-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--color-highlight, #FFB6C1);
  margin-bottom: 0.25rem;
}

.act-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
}

.date-request-btn {
  position: absolute;
  top: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--color-highlight, #FFB6C1) 0%, rgba(255, 182, 193, 0.8) 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1a1a;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 182, 193, 0.3);
  animation: gentle-pulse-btn 3s ease-in-out infinite;
}

.date-request-btn:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 25px rgba(255, 182, 193, 0.5);
  background: linear-gradient(135deg, var(--color-secondary, #FFE4E1) 0%, var(--color-highlight, #FFB6C1) 100%);
}

.date-request-btn:active {
  transform: translateY(-1px) scale(1.02);
}

.date-request-icon {
  font-size: 1.25rem;
  animation: pulse-heart-icon 1.5s ease-in-out infinite;
}

.date-request-text {
  white-space: nowrap;
}

@keyframes gentle-pulse-btn {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

@keyframes pulse-heart-icon {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.reset-progress-btn {
  position: absolute;
  top: 2rem;
  left: 2rem;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 107, 107, 0.15);
  border: 2px solid rgba(255, 107, 107, 0.4);
  border-radius: 50%;
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.2);
}

.reset-progress-btn:hover {
  background: rgba(255, 107, 107, 0.3);
  border-color: rgba(255, 107, 107, 0.6);
  transform: scale(1.1) rotate(180deg);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.reset-icon {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
  transition: transform 0.3s ease;
}

.points-progress-container {
  max-width: 500px;
  margin: 0 auto 2rem;
  padding: 1.25rem 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(15px);
  border-radius: 16px;
  border: 1px solid rgba(255, 182, 193, 0.2);
  pointer-events: auto;
}

.points-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.points-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--color-secondary, #FFE4E1);
}

.points-value {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-highlight, #FFB6C1);
}

.points-bar {
  width: 100%;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.points-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-highlight, #FFB6C1), var(--color-secondary, #FFE4E1));
  border-radius: 6px;
  transition: width 0.6s ease;
  box-shadow: 0 0 10px rgba(255, 182, 193, 0.5);
}

.points-percentage {
  text-align: center;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.75rem;
  color: rgba(255, 235, 240, 0.9);
}

.reset-confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.reset-confirmation-modal {
  background: linear-gradient(135deg, rgba(26, 10, 26, 0.95) 0%, rgba(10, 10, 21, 0.95) 100%);
  border: 2px solid rgba(255, 107, 107, 0.4);
  border-radius: 24px;
  padding: 3rem 2.5rem;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
}

.reset-modal-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 20px rgba(255, 107, 107, 0.8));
}

.reset-modal-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2rem;
  font-weight: 500;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 1rem;
}

.reset-modal-message {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 235, 240, 0.95);
  margin-bottom: 2rem;
}

.reset-modal-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.reset-cancel-btn,
.reset-confirm-btn {
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid;
}

.reset-cancel-btn {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
}

.reset-cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.reset-confirm-btn {
  background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
  border-color: rgba(255, 107, 107, 0.6);
  color: white;
}

.reset-confirm-btn:hover {
  background: linear-gradient(135deg, #ee5a6f, #ff6b6b);
  border-color: rgba(255, 107, 107, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 107, 107, 0.4);
}

.reset-success-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 2rem 3rem;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 10, 20, 0.95));
  border: 2px solid var(--color-highlight, #FFB6C1);
  border-radius: 16px;
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  color: var(--color-primary, #FFF8F0);
  z-index: 10001;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.9);
}

.progress-hint {
  pointer-events: auto;
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  animation: gentle-pulse 3s ease-in-out infinite;
}

.hint-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  color: var(--color-secondary, #FFE4E1);
  margin-bottom: 0.5rem;
}

.hint-subtext {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 300;
  font-style: italic;
  color: rgba(255, 255, 255, 0.6);
}

@keyframes gentle-pulse {
  0%, 100% { opacity: 0.6; transform: translateX(-50%) translateY(0); }
  50% { opacity: 1; transform: translateX(-50%) translateY(-5px); }
}

.puzzle-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.puzzle-placeholder {
  text-align: center;
  padding: 3rem;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: gentle-rotate 4s ease-in-out infinite;
}

@keyframes gentle-rotate {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

.placeholder-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 0.5rem;
}

.placeholder-subtext {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 300;
  font-style: italic;
  color: rgba(255, 255, 255, 0.6);
}

@media (max-width: 768px) {
  .welcome-title {
    font-size: 2rem;
  }

  .welcome-subtitle {
    font-size: 1rem;
  }

  .ui-container {
    padding: 1rem;
  }

  .daily-message {
    padding: 1rem;
    margin-bottom: 1rem;
    margin-top: 1rem;
  }

  .message-text {
    font-size: 1.25rem;
  }

  .gallery-title {
    font-size: 2rem;
  }

  .gallery-subtitle {
    font-size: 0.9rem;
  }

  .experiences-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    padding: 0 1rem 1rem;
  }

  .date-request-btn {
    position: fixed;
    top: 0.75rem;
    right: 0.75rem;
    padding: 0.5rem 1rem;
    font-size: 0.7rem;
    z-index: 1000;
  }

  .date-request-icon {
    font-size: 0.9rem;
  }

  .date-request-text {
    display: none;
  }
}

@media (max-width: 480px) {
  .ui-container {
    padding: 0.75rem;
  }

  .date-request-btn {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.5rem;
    gap: 0;
  }

  .date-request-icon {
    font-size: 1.2rem;
  }

  .daily-message {
    margin-top: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.75rem;
    width: 100%;
  }

  .message-label {
    font-size: 0.65rem;
  }

  .message-text {
    font-size: 1.1rem;
  }

  .gallery-title {
    font-size: 1.75rem;
    word-wrap: break-word;
    padding: 0 0.5rem;
  }

  .gallery-subtitle {
    word-wrap: break-word;
    padding: 0 0.5rem;
  }

  .experiences-grid {
    grid-template-columns: 1fr;
    padding: 0 0.75rem 1rem;
    gap: 0.75rem;
  }

  .discovery-message {
    padding: 1.5rem 1.25rem;
    border-radius: 16px;
  }

  .discovery-icon {
    font-size: 2.5rem;
  }

  .discovery-text {
    font-size: 0.75rem;
    letter-spacing: 2px;
  }

  .discovery-name {
    font-size: 1.5rem;
    word-break: break-word;
  }
}

.act-complete-message {
  text-align: center;
  padding: 3rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  border: 2px solid rgba(255, 182, 193, 0.3);
}

.complete-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 1rem;
}

.complete-subtitle {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 300;
  font-style: italic;
  color: var(--color-secondary, #FFE4E1);
}

.act-transition {
  text-align: center;
  padding: 4rem 2rem;
}

.transition-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3.5rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 1rem;
  text-shadow: 0 2px 20px rgba(255, 182, 193, 0.5);
}

.transition-subtitle {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.5rem;
  font-weight: 300;
  font-style: italic;
  color: var(--color-highlight, #FFB6C1);
}

@media (max-width: 768px) {
  .transition-title {
    font-size: 2.5rem;
  }

  .transition-subtitle {
    font-size: 1.25rem;
  }
}

/* Discovery Elements - Subtle Hidden Secrets */
.discovery-elements {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 150; /* Above main-ui (100) so discovery elements are clickable */
}

.discovery-hint {
  position: absolute;
  cursor: pointer;
  pointer-events: auto;
  width: 24px;
  height: 24px;
}

.hint-sparkle {
  width: 24px;
  height: 24px;
  background: radial-gradient(circle, rgba(255, 182, 193, 0.8) 0%, rgba(255, 182, 193, 0.3) 50%, transparent 100%);
  border-radius: 50%;
  position: relative;
  box-shadow: 0 0 8px rgba(255, 182, 193, 0.6), 0 0 16px rgba(255, 182, 193, 0.3);
}

.hint-sparkle::before,
.hint-sparkle::after {
  content: '';
  position: absolute;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1px;
}

.hint-sparkle::before {
  width: 2px;
  height: 12px;
  top: 6px;
  left: 11px;
}

.hint-sparkle::after {
  width: 12px;
  height: 2px;
  top: 11px;
  left: 6px;
}

.discovery-hint:hover .hint-sparkle {
  transform: scale(1.3);
  box-shadow: 0 0 15px rgba(255, 182, 193, 0.9), 0 0 25px rgba(255, 182, 193, 0.5);
  transition: all 0.3s ease;
}

.hint-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 10px;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 182, 193, 0.4);
  border-radius: 8px;
  font-family: 'Cormorant Garamond', serif;
  font-size: 0.85rem;
  font-weight: 300;
  font-style: italic;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  z-index: 10;
}

/* Discovery Message */
.discovery-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 3rem 4rem;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 10, 20, 0.9) 100%);
  backdrop-filter: blur(30px);
  border-radius: 24px;
  border: 2px solid rgba(255, 182, 193, 0.4);
  text-align: center;
  z-index: 3000;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: 90vw;
  box-sizing: border-box;
}

.discovery-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 20px rgba(255, 182, 193, 0.8));
}

.discovery-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--color-secondary, #FFE4E1);
  margin-bottom: 0.75rem;
}

.discovery-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.25rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  text-shadow: 0 2px 20px rgba(255, 182, 193, 0.5);
}

@media (max-width: 768px) {
  .discovery-hint {
    padding: 1rem;
    max-width: 150px;
  }

  .hint-icon {
    font-size: 2rem;
  }

  .hint-whisper {
    font-size: 0.85rem;
  }

  .discovery-message {
    padding: 2rem 2.5rem;
  }

  .discovery-icon {
    font-size: 3rem;
  }

  .discovery-name {
    font-size: 1.75rem;
  }
}

/* Mystery Mode - First Visit */
.mystery-mode-ui {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 100;
}

.mystery-message {
  text-align: center;
  max-width: 600px;
  padding: 2rem;
}

.mystery-whisper {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 300;
  font-style: italic;
  color: rgba(255, 228, 225, 0.7);
  line-height: 1.8;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.8);
}

.mystery-whisper-main {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.5rem;
  font-weight: 400;
  font-style: italic;
  color: var(--color-primary, #FFF8F0);
  text-shadow: 0 2px 30px rgba(255, 182, 193, 0.6);
  margin-top: 1rem;
  animation: gentle-glow 4s ease-in-out infinite;
}

@keyframes gentle-glow {
  0%, 100% { opacity: 0.8; text-shadow: 0 2px 20px rgba(255, 182, 193, 0.4); }
  50% { opacity: 1; text-shadow: 0 2px 40px rgba(255, 182, 193, 0.8); }
}

.revelation-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3000;
  pointer-events: none;
}

.revelation-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.75rem;
  font-weight: 400;
  font-style: italic;
  color: var(--color-primary, #FFF8F0);
  text-align: center;
  padding: 2rem 3rem;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 10, 20, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 2px solid rgba(255, 182, 193, 0.4);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  text-shadow: 0 2px 20px rgba(255, 182, 193, 0.5);
}

@media (max-width: 768px) {
  .mystery-whisper {
    font-size: 1.25rem;
  }

  .mystery-whisper-main {
    font-size: 2rem;
  }

  .revelation-text {
    font-size: 1.4rem;
    padding: 1.5rem 2rem;
  }
}

@media (max-width: 480px) {
  .mystery-whisper {
    font-size: 1.1rem;
  }

  .mystery-whisper-main {
    font-size: 1.75rem;
  }

  .revelation-text {
    font-size: 1.25rem;
    padding: 1.25rem 1.5rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Initialize application
const app = new MilasWorld();
app.init();
