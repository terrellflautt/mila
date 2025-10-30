/**
 * Ambient Audio - Subtle, hypnotic, romantic atmosphere
 * Creates a warm, sensual soundscape that breathes throughout the experience
 */

export class AmbientAudio {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.pads = [];
    this.isPlaying = false;
  }

  /**
   * Initialize audio context (must be triggered by user interaction)
   */
  init() {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Master gain for overall volume control (keep it VERY subtle)
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.15; // Quiet, atmospheric
      this.masterGain.connect(this.audioContext.destination);

      // Create subtle reverb for space
      this.createReverb();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  /**
   * Create subtle reverb effect for atmospheric space
   */
  createReverb() {
    const convolver = this.audioContext.createConvolver();

    // Generate impulse response for subtle, intimate reverb
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * 2; // 2 second decay
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay for natural reverb tail
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
      }
    }

    convolver.buffer = impulse;

    // Subtle reverb mix
    const reverbGain = this.audioContext.createGain();
    reverbGain.gain.value = 0.25;

    convolver.connect(reverbGain);
    reverbGain.connect(this.masterGain);

    this.reverb = convolver;
    this.reverbGain = reverbGain;
  }

  /**
   * Start ambient atmosphere - warm, breathing, hypnotic
   */
  start() {
    if (this.isPlaying || !this.audioContext) return;
    this.isPlaying = true;

    // Deep, warm bass pad (foundation)
    this.createPad({
      frequency: 55,        // Low A
      detune: 0,
      filterFreq: 400,
      type: 'sine',
      volume: 0.3
    });

    // Mid-range harmonic layer (warmth)
    this.createPad({
      frequency: 110,       // A2
      detune: 7,            // Slight detune for richness
      filterFreq: 800,
      type: 'sine',
      volume: 0.2
    });

    // Subtle high pad (air/space)
    this.createPad({
      frequency: 220,       // A3
      detune: -5,
      filterFreq: 1200,
      type: 'triangle',
      volume: 0.15
    });

    // Very subtle texture layer (movement)
    this.createTexture();

    // Fade in slowly
    this.fadeIn();
  }

  /**
   * Create a single pad layer
   */
  createPad({ frequency, detune, filterFreq, type, volume }) {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Oscillator
    const osc = this.audioContext.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    osc.detune.setValueAtTime(detune, now);

    // Add subtle vibrato (very slow LFO)
    const lfo = this.audioContext.createOscillator();
    lfo.frequency.setValueAtTime(0.2, now); // Very slow
    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.setValueAtTime(3, now); // Subtle depth
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start(now);

    // Low-pass filter for warmth
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, now);
    filter.Q.setValueAtTime(1, now);

    // Gain for volume
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, now); // Start silent

    // Connect: osc → filter → gain → (master + reverb)
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    gain.connect(this.reverb);

    osc.start(now);

    this.pads.push({ osc, filter, gain, lfo, volume });
  }

  /**
   * Create subtle texture/noise layer for movement
   */
  createTexture() {
    if (!this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate filtered noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Heavy low-pass for just texture, not harshness
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
    filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.reverb);

    noise.start();

    this.pads.push({ osc: noise, filter, gain, volume: 0.08 });
  }

  /**
   * Fade in atmosphere slowly
   */
  fadeIn(duration = 8) {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    this.pads.forEach(pad => {
      pad.gain.gain.cancelScheduledValues(now);
      pad.gain.gain.setValueAtTime(pad.gain.gain.value, now);
      pad.gain.gain.linearRampToValueAtTime(pad.volume, now + duration);
    });
  }

  /**
   * Fade out atmosphere
   */
  fadeOut(duration = 4) {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    this.pads.forEach(pad => {
      pad.gain.gain.cancelScheduledValues(now);
      pad.gain.gain.setValueAtTime(pad.gain.gain.value, now);
      pad.gain.gain.linearRampToValueAtTime(0, now + duration);
    });

    // Stop after fade
    setTimeout(() => {
      this.stop();
    }, duration * 1000);
  }

  /**
   * Stop all ambient sounds
   */
  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    this.pads.forEach(pad => {
      if (pad.osc && pad.osc.stop) {
        pad.osc.stop();
      }
      if (pad.lfo && pad.lfo.stop) {
        pad.lfo.stop();
      }
    });

    this.pads = [];
  }

  /**
   * Adjust overall volume
   */
  setVolume(value) {
    if (!this.masterGain) return;

    const now = this.audioContext.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(value, now + 0.5);
  }

  /**
   * Create subtle one-shot chime/bell tone
   */
  playChime(frequency = 880, duration = 2) {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    // Bell-like sound with overtones
    const fundamental = this.audioContext.createOscillator();
    fundamental.frequency.setValueAtTime(frequency, now);
    fundamental.type = 'sine';

    const overtone1 = this.audioContext.createOscillator();
    overtone1.frequency.setValueAtTime(frequency * 2.76, now); // Minor third
    overtone1.type = 'sine';

    const overtone2 = this.audioContext.createOscillator();
    overtone2.frequency.setValueAtTime(frequency * 5.4, now);
    overtone2.type = 'sine';

    // Mix oscillators
    const mixer = this.audioContext.createGain();
    mixer.gain.setValueAtTime(0.3, now);

    // Envelope for bell decay
    const envelope = this.audioContext.createGain();
    envelope.gain.setValueAtTime(0.4, now);
    envelope.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Connect
    fundamental.connect(mixer);
    overtone1.connect(mixer);
    overtone2.connect(mixer);
    mixer.connect(envelope);
    envelope.connect(this.reverb);

    // Play
    fundamental.start(now);
    overtone1.start(now);
    overtone2.start(now);

    fundamental.stop(now + duration);
    overtone1.stop(now + duration);
    overtone2.stop(now + duration);
  }
}
