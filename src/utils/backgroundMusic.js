/**
 * Background Music Player
 * Plays actual music files with smooth crossfading and volume control
 *
 * SETUP INSTRUCTIONS:
 * 1. Add your music files to /public/music/ directory
 * 2. Supported formats: MP3, OGG, WAV
 * 3. Recommended: Use ambient/romantic instrumental music
 * 4. File names should match the tracks array below
 */

export class BackgroundMusic {
  constructor() {
    this.currentTrack = null;
    this.nextTrack = null;
    this.isPlaying = false;
    this.volume = 0.3; // Default volume (30%)
    this.crossfadeDuration = 3000; // 3 second crossfade
    this.useGenerativeMusic = false;
    this.audioContext = null;
    this.generativeNodes = [];
    this.masterGain = null;

    // Music tracks
    this.tracks = [
      {
        url: '/music/G-Eazy_-_Marilyn_Christoph_Andersson_Remix_(mp3.pm).mp3',
        title: 'Marilyn (Christoph Andersson Remix)',
        artist: 'G-Eazy'
      },
      {
        url: '/music/g-Eazy - Last Night (Christoph Andersson Remix) (320 KBps).mp3',
        title: 'Last Night (Christoph Andersson Remix)',
        artist: 'G-Eazy'
      },
      {
        url: '/music/G-Eazy - Mad ft Devon Baldwin (Christoph Andersson Remix) (320 KBps).mp3',
        title: 'Mad ft. Devon Baldwin (Christoph Andersson Remix)',
        artist: 'G-Eazy'
      },
      {
        url: '/music/G-Eazy - Sleepless ft NYLO (Christoph Andersson Remix) (320 KBps).mp3',
        title: 'Sleepless ft. NYLO (Christoph Andersson Remix)',
        artist: 'G-Eazy'
      },
      {
        url: '/music/G-Eazy - Tumblr Girls (Christoph Andersson Remix) (320 KBps).mp3',
        title: 'Tumblr Girls (Christoph Andersson Remix)',
        artist: 'G-Eazy'
      },
      {
        url: '/music/Childish Gambino - Feels Like Summer (Official Video) (320 KBps).mp3',
        title: 'Feels Like Summer',
        artist: 'Childish Gambino'
      },
      {
        url: '/music/childish Gambino - Heartbeat (320 KBps).mp3',
        title: 'Heartbeat',
        artist: 'Childish Gambino'
      },
      {
        url: '/music/Childish Gambino Redbone Official Audio (320 KBps).mp3',
        title: 'Redbone',
        artist: 'Childish Gambino'
      },
      {
        url: '/music/Kid Cudi - Erase Me ft. Kanye West (320 KBps).mp3',
        title: 'Erase Me ft. Kanye West',
        artist: 'Kid Cudi'
      },
      {
        url: '/music/21 Savage, Doja Cat - n.h.i.e. (Official Audio) (320 KBps).mp3',
        title: 'n.h.i.e.',
        artist: '21 Savage, Doja Cat'
      },
      {
        url: '/music/Chance The Rapper - Interlude (That s Love) (320 KBps).mp3',
        title: 'Interlude (That\'s Love)',
        artist: 'Chance The Rapper'
      },
      {
        url: '/music/Chance the Rapper - Everybody s Something (Official Video) (320 KBps).mp3',
        title: 'Everybody\'s Something',
        artist: 'Chance the Rapper'
      },
      {
        url: '/music/jeff Buckley - Hallelujah (Very Rare Version) (320 KBps).mp3',
        title: 'Hallelujah (Very Rare Version)',
        artist: 'Jeff Buckley'
      },
      {
        url: '/music/jeff Buckley - Lover, You Should ve Come Over (Official Audio) (320 KBps).mp3',
        title: 'Lover, You Should\'ve Come Over',
        artist: 'Jeff Buckley'
      },
      {
        url: '/music/Paramore - All I Wanted (Official Audio) (320 KBps).mp3',
        title: 'All I Wanted',
        artist: 'Paramore'
      }
    ];

    this.currentTrackIndex = 0;
    this.shuffle = true; // Enable random playback by default
    this.playedIndices = [];

    // Romantic ambient chord progression (in MIDI note numbers)
    // Fmaj7 - Cmaj7 - Am7 - G7
    this.chordProgression = [
      [65, 69, 72, 76], // Fmaj7 (F A C E)
      [60, 64, 67, 71], // Cmaj7 (C E G B)
      [57, 60, 64, 67], // Am7  (A C E G)
      [55, 59, 62, 65]  // G7   (G B D F)
    ];
  }

  /**
   * Initialize and start playing music
   * Must be called after user interaction
   */
  async start() {
    if (this.isPlaying) return;

    try {
      // Load first track
      const track = this.tracks[this.currentTrackIndex];
      this.currentTrack = this.createAudioElement(track.url);

      // Fade in
      this.currentTrack.volume = 0;

      // MOBILE FIX: Try to play, handle autoplay policy errors gracefully
      try {
        await this.currentTrack.play();
        this.fadeIn(this.currentTrack);
        this.isPlaying = true;
      } catch (playError) {
        // Mobile browsers may block autoplay - user will need to click play button
        console.warn('Autoplay blocked (likely mobile):', playError);
        // Keep isPlaying false so play button shows correctly
        this.isPlaying = false;
      }

      // Set up auto-advance to next track
      this.currentTrack.addEventListener('ended', () => this.playNextTrack());

      // Notify UI of current track
      this.onTrackChange();

    } catch (error) {
      console.error('Failed to start music:', error);
    }
  }

  /**
   * Callback when track changes (override this to update UI)
   */
  onTrackChange() {
    // Will be overridden by UI
  }

  /**
   * Get current track info
   */
  getCurrentTrack() {
    return this.tracks[this.currentTrackIndex];
  }

  /**
   * Toggle shuffle
   */
  toggleShuffle() {
    this.shuffle = !this.shuffle;
    if (this.shuffle) {
      this.playedIndices = [this.currentTrackIndex];
    }
    return this.shuffle;
  }

  /**
   * Get next track index (respecting shuffle)
   */
  getNextIndex() {
    if (this.shuffle) {
      // Get unplayed indices
      const unplayed = this.tracks
        .map((_, i) => i)
        .filter(i => !this.playedIndices.includes(i));

      if (unplayed.length === 0) {
        // All played, reset
        this.playedIndices = [];
        const randomIndex = Math.floor(Math.random() * this.tracks.length);
        this.playedIndices.push(randomIndex);
        return randomIndex;
      }

      const randomIndex = unplayed[Math.floor(Math.random() * unplayed.length)];
      this.playedIndices.push(randomIndex);
      return randomIndex;
    } else {
      // Sequential
      return (this.currentTrackIndex + 1) % this.tracks.length;
    }
  }

  /**
   * Create audio element with settings
   */
  createAudioElement(src) {
    const audio = new Audio(src);
    audio.loop = false; // We'll handle looping with crossfade
    audio.preload = 'auto';
    return audio;
  }

  /**
   * Fade in audio element
   */
  fadeIn(audioElement, duration = this.crossfadeDuration) {
    const steps = 50;
    const stepDuration = duration / steps;
    const volumeStep = this.volume / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        audioElement.volume = this.volume;
        return;
      }

      audioElement.volume = Math.min(volumeStep * currentStep, this.volume);
      currentStep++;
    }, stepDuration);
  }

  /**
   * Fade out audio element
   */
  fadeOut(audioElement, duration = this.crossfadeDuration) {
    const steps = 50;
    const stepDuration = duration / steps;
    const startVolume = audioElement.volume;
    const volumeStep = startVolume / steps;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        audioElement.pause();
        audioElement.volume = 0;
        return;
      }

      audioElement.volume = Math.max(startVolume - (volumeStep * currentStep), 0);
      currentStep++;
    }, stepDuration);
  }

  /**
   * Play next track with crossfade
   */
  async playNextTrack() {
    // Get next index
    this.currentTrackIndex = this.getNextIndex();

    // Create next track
    const track = this.tracks[this.currentTrackIndex];
    this.nextTrack = this.createAudioElement(track.url);
    this.nextTrack.volume = 0;

    try {
      // Start next track
      await this.nextTrack.play();

      // Crossfade
      this.fadeIn(this.nextTrack);
      this.fadeOut(this.currentTrack);

      // Set up event listener for next track
      this.nextTrack.addEventListener('ended', () => this.playNextTrack());

      // Swap references after crossfade completes
      setTimeout(() => {
        this.currentTrack = this.nextTrack;
        this.nextTrack = null;
        this.onTrackChange();
      }, this.crossfadeDuration);

    } catch (error) {
      console.warn('Failed to play next track:', error);
    }
  }

  /**
   * Skip to next track (manual)
   */
  async skipNext() {
    if (!this.isPlaying) return;
    await this.playNextTrack();
  }

  /**
   * Go to previous track
   */
  async skipPrevious() {
    if (!this.isPlaying) return;

    // Simple implementation: go back one
    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;

    const track = this.tracks[this.currentTrackIndex];
    const newTrack = this.createAudioElement(track.url);
    newTrack.volume = 0;

    try {
      await newTrack.play();
      this.fadeIn(newTrack);
      this.fadeOut(this.currentTrack);

      setTimeout(() => {
        this.currentTrack = newTrack;
        newTrack.addEventListener('ended', () => this.playNextTrack());
        this.onTrackChange();
      }, this.crossfadeDuration);

    } catch (error) {
      console.warn('Failed to play previous track:', error);
    }
  }

  /**
   * Stop music with fade out
   */
  stop() {
    if (!this.isPlaying) return;

    if (this.currentTrack) {
      this.fadeOut(this.currentTrack);
    }

    this.isPlaying = false;
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));

    if (this.currentTrack) {
      this.currentTrack.volume = this.volume;
    }
  }

  /**
   * Mute/unmute
   */
  toggleMute() {
    if (this.currentTrack) {
      this.currentTrack.muted = !this.currentTrack.muted;
    }
  }

  /**
   * Pause music
   */
  pause() {
    if (this.currentTrack) {
      this.currentTrack.pause();
      this.isPlaying = false;
    }
  }

  /**
   * Resume music
   */
  async resume() {
    if (this.currentTrack && !this.isPlaying) {
      try {
        await this.currentTrack.play();
        this.isPlaying = true;
        // Ensure volume is at correct level
        if (this.currentTrack.volume === 0) {
          this.fadeIn(this.currentTrack);
        }
      } catch (error) {
        console.warn('Failed to resume playback:', error);
      }
    }
  }

  /**
   * Start generative ambient music
   */
  startGenerativeMusic() {
    if (this.isPlaying) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Master gain for overall volume
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);

      // Create reverb for atmosphere
      this.createReverb();

      // Start the generative music loop
      this.isPlaying = true;
      this.playGenerativeChord(0);

    } catch (error) {
      console.warn('Web Audio not supported:', error);
    }
  }

  /**
   * Create reverb effect
   */
  createReverb() {
    const convolver = this.audioContext.createConvolver();
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * 3;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    convolver.buffer = impulse;

    const reverbGain = this.audioContext.createGain();
    reverbGain.gain.value = 0.3;

    convolver.connect(reverbGain);
    reverbGain.connect(this.masterGain);

    this.reverb = convolver;
  }

  /**
   * Play a single chord from the progression
   */
  playGenerativeChord(chordIndex) {
    if (!this.isPlaying || !this.audioContext) return;

    const now = this.audioContext.currentTime;
    const chord = this.chordProgression[chordIndex];
    const duration = 6; // Each chord lasts 6 seconds

    // Play each note in the chord
    chord.forEach((midiNote, i) => {
      const frequency = this.midiToFreq(midiNote);

      // Create bell-like tone
      const osc = this.audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, now);

      // Add subtle vibrato
      const lfo = this.audioContext.createOscillator();
      lfo.frequency.setValueAtTime(4, now);
      const lfoGain = this.audioContext.createGain();
      lfoGain.gain.setValueAtTime(2, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + duration);

      // Envelope
      const envelope = this.audioContext.createGain();
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(0.08, now + 0.5);
      envelope.gain.exponentialRampToValueAtTime(0.02, now + duration);

      // Filter for warmth
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now);
      filter.Q.setValueAtTime(1, now);

      // Connect
      osc.connect(filter);
      filter.connect(envelope);
      envelope.connect(this.masterGain);
      envelope.connect(this.reverb);

      // Play
      osc.start(now + i * 0.05); // Slight stagger
      osc.stop(now + duration);
    });

    // Schedule next chord
    const nextIndex = (chordIndex + 1) % this.chordProgression.length;
    setTimeout(() => {
      this.playGenerativeChord(nextIndex);
    }, duration * 1000);
  }

  /**
   * Convert MIDI note to frequency
   */
  midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Stop generative music
   */
  stopGenerativeMusic() {
    if (!this.useGenerativeMusic) return;

    if (this.masterGain) {
      this.masterGain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 2
      );
    }

    this.isPlaying = false;
  }

  /**
   * Duck (lower volume) for when experiences need audio focus
   * Call this when starting an experience that has its own audio
   */
  duck(targetVolume = 0.05, duration = 1000) {
    if (this.useGenerativeMusic && this.masterGain) {
      // Duck generative music
      const now = this.audioContext.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(targetVolume, now + duration / 1000);
    } else if (this.currentTrack) {
      // Duck audio file
      const steps = 30;
      const stepDuration = duration / steps;
      const startVolume = this.currentTrack.volume;
      const volumeStep = (startVolume - targetVolume) / steps;
      let currentStep = 0;

      const duckInterval = setInterval(() => {
        if (currentStep >= steps) {
          clearInterval(duckInterval);
          this.currentTrack.volume = targetVolume;
          return;
        }

        this.currentTrack.volume = Math.max(startVolume - (volumeStep * currentStep), targetVolume);
        currentStep++;
      }, stepDuration);
    }
  }

  /**
   * Unduck (restore volume) when experience audio is done
   */
  unduck(duration = 1000) {
    if (this.useGenerativeMusic && this.masterGain) {
      // Unduck generative music
      const now = this.audioContext.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, now + duration / 1000);
    } else if (this.currentTrack) {
      // Unduck audio file
      const steps = 30;
      const stepDuration = duration / steps;
      const startVolume = this.currentTrack.volume;
      const volumeStep = (this.volume - startVolume) / steps;
      let currentStep = 0;

      const unduckInterval = setInterval(() => {
        if (currentStep >= steps) {
          clearInterval(unduckInterval);
          this.currentTrack.volume = this.volume;
          return;
        }

        this.currentTrack.volume = Math.min(startVolume + (volumeStep * currentStep), this.volume);
        currentStep++;
      }, stepDuration);
    }
  }
}
