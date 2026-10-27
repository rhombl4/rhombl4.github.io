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
    this.bpm = Math.max(30, Math.min(260, Math.round(newBpm)));
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
   * Synthesize click sounds using pure Web Audio oscillator and filter curves
   */
  playClick(time, isBeatOne = false, isAccent = false) {
    if (this.isMuted || !this.audioCtx) return;

    const baseGain = this.volume;
    const gainNode = this.audioCtx.createGain();
    gainNode.connect(this.audioCtx.destination);

    if (this.soundType === 'woodblock') {
      // Warm, resonant woodblock
      const osc = this.audioCtx.createOscillator();
      osc.type = 'sine';
      
      let freq = isBeatOne ? 1200 : (isAccent ? 950 : 750);
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, time + 0.035);

      const hitGain = isBeatOne ? baseGain * 1.0 : (isAccent ? baseGain * 0.85 : baseGain * 0.5);
      gainNode.gain.setValueAtTime(hitGain, time);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);

      osc.connect(gainNode);
      osc.start(time);
      osc.stop(time + 0.045);

    } else if (this.soundType === 'padTap') {
      // Snappy, percussive practice pad acoustic tap
      const osc = this.audioCtx.createOscillator();
      osc.type = 'triangle';
      const freq = isBeatOne ? 440 : (isAccent ? 380 : 300);
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.03);

      // Noise burst for stick snap
      const bufferSize = this.audioCtx.sampleRate * 0.02;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
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

    } else if (this.soundType === 'cowbell') {
      // Two-oscillator metallic cowbell
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

    } else {
      // Standard Digital Click
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
