/**
 * High-Precision Web Audio Metronome & Synthesizer Engine
 * Uses the Web Audio API lookahead scheduler pattern to ensure 0ms jitter.
 */

export class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.bpm = 60;
    this.notesPerBeat = 2; // e.g. 2 for 8th notes, 4 for 16th notes
    this.currentPattern = []; // Array of notes for the current exercise
    
    // Scheduling parameters
    this.lookahead = 25.0; // milliseconds
    this.scheduleAheadTime = 0.1; // seconds
    this.nextNoteTime = 0.0;
    this.currentNoteIndex = 0;
    this.timerWorker = null;
    this.timerId = null;

    // Sound settings
    this.soundType = 'woodblock'; // 'woodblock', 'click', 'padTap', 'cowbell'
    this.volume = 0.8;
    this.isMuted = false;
    this.accentBeatOne = true;

    // Callback when a note is rendered visually
    this.onNoteTrigger = null; 
    this.onBeatOne = null;

    // iOS AudioContext unlock and visibility resume handlers
    this.setupIOSAudioLifecycle();
  }

  setupIOSAudioLifecycle() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.audioCtx && this.isPlaying) {
        this.audioCtx.resume();
      }
    });

    const unlock = () => {
      this.ensureAudioContext();
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('touchend', unlock);
      window.removeEventListener('pointerdown', unlock);
    };
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('touchend', unlock, { passive: true });
    window.addEventListener('pointerdown', unlock, { passive: true });
  }

  /**
   * Initializes or resumes the AudioContext (must happen on user gesture)
   */
  async ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  setPattern(pattern, notesPerBeat = 2) {
    this.currentPattern = pattern;
    this.notesPerBeat = notesPerBeat;
    this.currentNoteIndex = 0;
  }

  setBpm(newBpm) {
    this.bpm = Math.max(30, Math.min(130, Math.round(newBpm)));
  }

  setSoundType(type) {
    this.soundType = type;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Helper to create or reuse a cached noise buffer for percussive transients
   */
  getNoiseBuffer(seconds = 0.05) {
    if (!this.audioCtx) return null;
    if (this._cachedNoiseBuffer) return this._cachedNoiseBuffer;
    const bufferSize = Math.floor(this.audioCtx.sampleRate * seconds);
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this._cachedNoiseBuffer = buffer;
    return buffer;
  }

  /**
   * Synthesize 10 distinct click sounds using pure Web Audio oscillator and filter curves
   */
  playClick(time, isBeatOne = false, isAccent = false) {
    if (this.isMuted || !this.audioCtx) return;

    const baseGain = this.volume;
    const gainNode = this.audioCtx.createGain();
    gainNode.connect(this.audioCtx.destination);

    switch (this.soundType) {
      case 'woodblock': {
        // 1. Warm, resonant orchestral woodblock
        const osc = this.audioCtx.createOscillator();
        osc.type = 'sine';
        const freq = isBeatOne ? 1200 : (isAccent ? 950 : 750);
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, time + 0.035);

        const hitGain = isBeatOne ? baseGain * 1.0 : (isAccent ? baseGain * 0.85 : baseGain * 0.5);
        gainNode.gain.setValueAtTime(hitGain, time);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

        osc.connect(gainNode);
        osc.start(time);
        osc.stop(time + 0.045);
        break;
      }

      case 'padTap': {
        // 2. Snappy, percussive practice pad acoustic tap
        const osc = this.audioCtx.createOscillator();
        osc.type = 'triangle';
        const freq = isBeatOne ? 440 : (isAccent ? 380 : 300);
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(80, time + 0.03);

        const noiseBuffer = this.getNoiseBuffer(0.03);
        const whiteNoise = this.audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isBeatOne ? 2500 : 1800, time);
        filter.Q.setValueAtTime(3.0, time);

        const noiseGain = this.audioCtx.createGain();
        const nGain = isBeatOne ? baseGain * 0.7 : (isAccent ? baseGain * 0.55 : baseGain * 0.3);
        noiseGain.gain.setValueAtTime(nGain, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(gainNode);

        const hitGain = isBeatOne ? baseGain * 0.9 : (isAccent ? baseGain * 0.7 : baseGain * 0.4);
        gainNode.gain.setValueAtTime(hitGain, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

        osc.connect(gainNode);
        osc.start(time);
        whiteNoise.start(time);
        osc.stop(time + 0.04);
        whiteNoise.stop(time + 0.03);
        break;
      }

      case 'cowbell': {
        // 4. Two-oscillator metallic Latin cowbell
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        osc1.type = 'square';
        osc2.type = 'square';

        const pitchMult = isBeatOne ? 1.25 : (isAccent ? 1.1 : 1.0);
        osc1.frequency.setValueAtTime(800 * pitchMult, time);
        osc2.frequency.setValueAtTime(540 * pitchMult, time);

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, time);
        filter.Q.setValueAtTime(2.5, time);

        const hitGain = isBeatOne ? baseGain * 0.8 : (isAccent ? baseGain * 0.65 : baseGain * 0.4);
        gainNode.gain.setValueAtTime(hitGain, time);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.07);
        osc2.stop(time + 0.07);
        break;
      }

      case 'rimshot': {
        // 5. Acoustic Snare Rimshot / Cross-Stick
        const osc = this.audioCtx.createOscillator();
        osc.type = 'sine';
        const startFreq = isBeatOne ? 2000 : (isAccent ? 1600 : 1300);
        osc.frequency.setValueAtTime(startFreq, time);
        osc.frequency.exponentialRampToValueAtTime(450, time + 0.025);

        const noiseBuffer = this.getNoiseBuffer(0.025);
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(3200, time);

        const noiseGain = this.audioCtx.createGain();
        noiseGain.gain.setValueAtTime(baseGain * 0.65, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(gainNode);

        gainNode.gain.setValueAtTime(baseGain * 0.95, time);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

        osc.connect(gainNode);
        osc.start(time);
        noise.start(time);
        osc.stop(time + 0.04);
        noise.stop(time + 0.025);
        break;
      }

      case 'clave808': {
        // 6. Iconic Roland TR-808 Electronic Analog Clave
        const osc = this.audioCtx.createOscillator();
        osc.type = 'sine';
        const freq = isBeatOne ? 2300 : (isAccent ? 1900 : 1600);
        osc.frequency.setValueAtTime(freq, time);

        gainNode.gain.setValueAtTime(baseGain * 0.9, time);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.018);

        osc.connect(gainNode);
        osc.start(time);
        osc.stop(time + 0.022);
        break;
      }

      case 'hihat': {
        // 7. Acoustic Pedal Hi-Hat Chick
        const noiseBuffer = this.getNoiseBuffer(0.04);
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;

        const hp = this.audioCtx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(isBeatOne ? 7000 : 8500, time);

        const bp = this.audioCtx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(isBeatOne ? 10000 : 11500, time);
        bp.Q.setValueAtTime(2.0, time);

        noise.connect(hp);
        hp.connect(bp);
        bp.connect(gainNode);

        const hitGain = isBeatOne ? baseGain * 0.95 : (isAccent ? baseGain * 0.75 : baseGain * 0.45);
        gainNode.gain.setValueAtTime(hitGain, time);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);

        noise.start(time);
        noise.stop(time + 0.04);
        break;
      }

      case 'mechanical': {
        // 8. Vintage Mechanical Pendulum Metronome Tick
        const lowOsc = this.audioCtx.createOscillator();
        lowOsc.type = 'triangle';
        lowOsc.frequency.setValueAtTime(isBeatOne ? 220 : 160, time);

        const highOsc = this.audioCtx.createOscillator();
        highOsc.type = 'sine';
        highOsc.frequency.setValueAtTime(isBeatOne ? 1350 : 1100, time);

        gainNode.gain.setValueAtTime(baseGain * 0.9, time);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.022);

        lowOsc.connect(gainNode);
        highOsc.connect(gainNode);

        lowOsc.start(time);
        highOsc.start(time);
        lowOsc.stop(time + 0.025);
        highOsc.stop(time + 0.025);
        break;
      }

      case 'castanet': {
        // 9. Castanet / Snappy Finger Snap
        const osc = this.audioCtx.createOscillator();
        osc.type = 'sine';
        const freq = isBeatOne ? 3200 : (isAccent ? 2700 : 2200);
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(800, time + 0.012);

        gainNode.gain.setValueAtTime(baseGain * 0.85, time);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.015);

        osc.connect(gainNode);
        osc.start(time);
        osc.stop(time + 0.018);
        break;
      }

      case 'cyberPing': {
        // 10. 808 Synth Bell / Cyber Ping (Cuts through headphones)
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        osc1.type = 'square';
        osc2.type = 'sawtooth';

        const pitchMult = isBeatOne ? 1.3 : (isAccent ? 1.15 : 1.0);
        osc1.frequency.setValueAtTime(845 * pitchMult, time);
        osc2.frequency.setValueAtTime(585 * pitchMult, time);

        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2200, time);
        filter.Q.setValueAtTime(4.0, time);

        gainNode.gain.setValueAtTime(baseGain * 0.75, time);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);

        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + 0.09);
        osc2.stop(time + 0.09);
        break;
      }

      case 'vocal': {
        // 11. Human Vocal Plosive & Formants ("Tah!" / Vocal Beatbox)
        // A) Consonant burst ("T" onset transient)
        const noiseBuffer = this.getNoiseBuffer(0.018);
        const tNoise = this.audioCtx.createBufferSource();
        tNoise.buffer = noiseBuffer;

        const tFilter = this.audioCtx.createBiquadFilter();
        tFilter.type = 'highpass';
        tFilter.frequency.setValueAtTime(3600, time);

        const tGain = this.audioCtx.createGain();
        const noiseLvl = isBeatOne ? baseGain * 0.7 : (isAccent ? baseGain * 0.55 : baseGain * 0.35);
        tGain.gain.setValueAtTime(noiseLvl, time);
        tGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.015);

        tNoise.connect(tFilter);
        tFilter.connect(tGain);
        tGain.connect(gainNode);

        // B) Vocal Tract Glottal Source with F1 & F2 Formant Filtering ("Ah" vowel body)
        const glottalOsc = this.audioCtx.createOscillator();
        glottalOsc.type = 'sawtooth';

        const pitch = isBeatOne ? 270 : (isAccent ? 220 : 175);
        glottalOsc.frequency.setValueAtTime(pitch, time);
        glottalOsc.frequency.exponentialRampToValueAtTime(pitch * 0.72, time + 0.045);

        // Formant Filter F1 (750 Hz - Open pharynx / oral cavity resonance)
        const f1Filter = this.audioCtx.createBiquadFilter();
        f1Filter.type = 'bandpass';
        f1Filter.frequency.setValueAtTime(isBeatOne ? 820 : 720, time);
        f1Filter.Q.setValueAtTime(4.5, time);

        // Formant Filter F2 (1350 Hz - Lingual vowel resonance)
        const f2Filter = this.audioCtx.createBiquadFilter();
        f2Filter.type = 'bandpass';
        f2Filter.frequency.setValueAtTime(isBeatOne ? 1450 : 1300, time);
        f2Filter.Q.setValueAtTime(4.0, time);

        const vocalGain = this.audioCtx.createGain();
        const voiceLvl = isBeatOne ? baseGain * 0.95 : (isAccent ? baseGain * 0.8 : baseGain * 0.5);
        vocalGain.gain.setValueAtTime(voiceLvl, time);
        vocalGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.048);

        glottalOsc.connect(f1Filter);
        glottalOsc.connect(f2Filter);
        f1Filter.connect(vocalGain);
        f2Filter.connect(vocalGain);
        vocalGain.connect(gainNode);

        tNoise.start(time);
        glottalOsc.start(time);
        tNoise.stop(time + 0.02);
        glottalOsc.stop(time + 0.05);
        break;
      }

      case 'laugh': {
        // 12. Chuckle / Cartoon Giggle ("Ha-HA!")
        // Two rapid staccato pitch-inflected giggles with breathy aspiration
        const pulses = [
          { offset: 0.0,    pitchMult: 1.0,  gainMult: 0.8,  dur: 0.032 },
          { offset: 0.034,  pitchMult: 1.25, gainMult: 1.0,  dur: 0.042 }
        ];

        const basePitch = isBeatOne ? 460 : (isAccent ? 390 : 330);

        pulses.forEach(p => {
          const pTime = time + p.offset;

          // Vocal chuckle oscillator
          const osc = this.audioCtx.createOscillator();
          osc.type = 'triangle';

          // Up-then-down giggle inflection
          const pStart = basePitch * p.pitchMult;
          osc.frequency.setValueAtTime(pStart, pTime);
          osc.frequency.linearRampToValueAtTime(pStart * 1.35, pTime + p.dur * 0.4);
          osc.frequency.exponentialRampToValueAtTime(pStart * 0.9, pTime + p.dur);

          // "Smiling mouth" vowel formant filter (F2 resonance around 1600 Hz)
          const filter = this.audioCtx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1600 * (p.pitchMult > 1.0 ? 1.15 : 1.0), pTime);
          filter.Q.setValueAtTime(3.8, pTime);

          // Breathy laughter noise burst ("H" aspiration)
          const noiseBuffer = this.getNoiseBuffer(p.dur);
          const noise = this.audioCtx.createBufferSource();
          noise.buffer = noiseBuffer;

          const noiseFilter = this.audioCtx.createBiquadFilter();
          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.setValueAtTime(2200, pTime);
          noiseFilter.Q.setValueAtTime(2.0, pTime);

          const pGain = this.audioCtx.createGain();
          const amp = (isBeatOne ? baseGain * 0.9 : (isAccent ? baseGain * 0.75 : baseGain * 0.45)) * p.gainMult;
          pGain.gain.setValueAtTime(0.0001, pTime);
          pGain.gain.linearRampToValueAtTime(amp, pTime + 0.005);
          pGain.gain.exponentialRampToValueAtTime(0.0001, pTime + p.dur);

          osc.connect(filter);
          filter.connect(pGain);

          noise.connect(noiseFilter);
          noiseFilter.connect(pGain);

          pGain.connect(gainNode);

          osc.start(pTime);
          noise.start(pTime);
          osc.stop(pTime + p.dur + 0.005);
          noise.stop(pTime + p.dur + 0.005);
        });
        break;
      }

      case 'click':
      default: {
        // 3. Digital Studio Beep (Pro DAW Click)
        const osc = this.audioCtx.createOscillator();
        osc.type = 'sine';
        const freq = isBeatOne ? 1400 : (isAccent ? 1000 : 700);
        osc.frequency.setValueAtTime(freq, time);

        const hitGain = isBeatOne ? baseGain * 0.9 : (isAccent ? baseGain * 0.75 : baseGain * 0.45);
        gainNode.gain.setValueAtTime(hitGain, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.025);

        osc.connect(gainNode);
        osc.start(time);
        osc.stop(time + 0.03);
        break;
      }
    }
  }

  /**
   * Practice session completion victory fanfare
   */
  playCelebrationChime() {
    if (!this.audioCtx || this.isMuted) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const startTime = this.audioCtx.currentTime + 0.05;

    notes.forEach((freq, idx) => {
      const time = startTime + idx * 0.12;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(this.volume * 0.6, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.45);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(time);
      osc.stop(time + 0.5);
    });
  }

  /**
   * Schedule note and queue up visual animation
   */
  scheduleNote(noteIndex, time) {
    if (!this.currentPattern || this.currentPattern.length === 0) return;

    const note = this.currentPattern[noteIndex];
    const isBeatOne = note.beat === '1' && this.accentBeatOne;
    const isAccent = note.accent;

    // 1. Audio click
    this.playClick(time, isBeatOne, isAccent);

    // 2. Synchronized visual trigger
    if (this.onNoteTrigger) {
      const delayMs = Math.max(0, (time - this.audioCtx.currentTime) * 1000);
      setTimeout(() => {
        if (this.isPlaying && this.onNoteTrigger) {
          this.onNoteTrigger({
            noteIndex,
            note,
            isBeatOne
          });
        }
      }, delayMs);
    }
  }

  nextNote() {
    // Advance time by subdivision length
    // 1 beat = 60 / BPM seconds
    // Each note in the subdivision = (60 / BPM) / notesPerBeat
    const secondsPerSubdivision = (60.0 / this.bpm) / this.notesPerBeat;
    this.nextNoteTime += secondsPerSubdivision;

    this.currentNoteIndex++;
    if (this.currentNoteIndex >= this.currentPattern.length) {
      this.currentNoteIndex = 0; // Loop pattern
      if (this.onLoopCompleted) {
        this.onLoopCompleted();
      }
    }
  }

  scheduler() {
    // While there are notes that will need to play before the next interval
    while (this.nextNoteTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentNoteIndex, this.nextNoteTime);
      this.nextNote();
    }
  }

  async start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    await this.ensureAudioContext();
    if (!this.isPlaying) return; // In case stop was called in the meantime

    this.currentNoteIndex = 0;
    this.nextNoteTime = this.audioCtx.currentTime + 0.05; // tiny lead-in

    if (this.timerId) {
      clearInterval(this.timerId);
    }
    this.timerId = setInterval(() => this.scheduler(), this.lookahead);
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  async toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      await this.start();
      return this.isPlaying;
    }
  }
}
