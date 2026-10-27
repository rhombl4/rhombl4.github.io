import { EXERCISES } from './exercises.js';
import { AudioEngine } from './audio.js';
import { PracticeTimer } from './timer.js';

class DrumPadApp {
  constructor() {
    this.audio = new AudioEngine();
    this.timer = new PracticeTimer();
    this.currentExerciseIndex = 0;
    this.tapTimes = [];
    this.wakeLock = null;

    // DOM Elements
    this.dom = {
      // Header
      streakCount: document.getElementById('streakCount'),
      todayMinutes: document.getElementById('todayMinutes'),
      wakeLockBtn: document.getElementById('wakeLockBtn'),
      guideBtn: document.getElementById('guideBtn'),
      
      // Exercise Selector
      exerciseSelect: document.getElementById('exerciseSelect'),
      prevExBtn: document.getElementById('prevExBtn'),
      nextExBtn: document.getElementById('nextExBtn'),
      exerciseSubdivision: document.getElementById('exerciseSubdivision'),
      exerciseCategory: document.getElementById('exerciseCategory'),
      targetBpmTag: document.getElementById('targetBpmTag'),
      techniqueTipText: document.getElementById('techniqueTipText'),

      // Stage / Pattern
      patternContainer: document.getElementById('patternContainer'),
      pulseDot: document.getElementById('pulseDot'),

      // Metronome Controls
      bpmValue: document.getElementById('bpmValue'),
      bpmSlider: document.getElementById('bpmSlider'),
      bpmMinus5: document.getElementById('bpmMinus5'),
      bpmMinus1: document.getElementById('bpmMinus1'),
      bpmPlus1: document.getElementById('bpmPlus1'),
      bpmPlus5: document.getElementById('bpmPlus5'),
      tapTempoBtn: document.getElementById('tapTempoBtn'),
      soundSelect: document.getElementById('soundSelect'),
      muteBtn: document.getElementById('muteBtn'),

      // Timer Controls
      timerDisplay: document.getElementById('timerDisplay'),
      timerProgress: document.getElementById('timerProgress'),
      timerModeBtn: document.getElementById('timerModeBtn'),
      timerResetBtn: document.getElementById('timerResetBtn'),
      timerPresets: document.getElementById('timerPresets'),

      // Action Bar
      playPauseBtn: document.getElementById('playPauseBtn'),
      playIcon: document.getElementById('playIcon'),
      playText: document.getElementById('playText'),

      // Modal
      guideModal: document.getElementById('guideModal'),
      closeGuideBtn: document.getElementById('closeGuideBtn'),
      curriculumList: document.getElementById('curriculumList')
    };

    this.init();
  }

  init() {
    this.populateExerciseSelect();
    this.renderCurriculumModal();
    this.loadExercise(0);
    this.updateStatsUI();
    this.bindEvents();

    // Setup audio callback for synchronized visual triggers
    this.audio.onNoteTrigger = ({ noteIndex, note, isBeatOne }) => {
      this.highlightNote(noteIndex, isBeatOne);
    };

    // Setup timer callbacks
    this.timer.onTick = (state) => {
      this.dom.timerDisplay.textContent = state.displayTime;
      this.dom.timerProgress.style.width = `${state.progressPercent}%`;
    };
    this.timer.triggerTick();

    this.timer.onComplete = () => {
      this.audio.stop();
      this.updatePlayState(false);
      this.audio.playCelebrationChime();
      this.updateStatsUI();
      // Record completed exercise best BPM
      const currentEx = EXERCISES[this.currentExerciseIndex];
      this.timer.recordExerciseBpm(currentEx.id, this.audio.bpm);
    };
  }

  populateExerciseSelect() {
    this.dom.exerciseSelect.innerHTML = '';
    EXERCISES.forEach((ex, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${String(ex.id).padStart(2, '0')}. ${ex.name}`;
      this.dom.exerciseSelect.appendChild(option);
    });
  }

  loadExercise(index) {
    if (index < 0) index = EXERCISES.length - 1;
    if (index >= EXERCISES.length) index = 0;

    this.currentExerciseIndex = index;
    const ex = EXERCISES[index];

    this.dom.exerciseSelect.value = index;
    this.dom.exerciseCategory.textContent = ex.category;
    this.dom.exerciseSubdivision.textContent = `${ex.notesPerBeat === 4 ? '16th' : (ex.notesPerBeat === 3 ? 'Triplet' : '8th')} Notes`;
    this.dom.targetBpmTag.textContent = `Goal: ${ex.targetBpm} BPM`;
    this.dom.techniqueTipText.textContent = ex.techniqueTip;

    // Set BPM to exercise default if metronome is stopped
    if (!this.audio.isPlaying) {
      this.setBpm(ex.defaultBpm);
    }

    // Configure Audio Engine with exercise pattern & subdivision
    this.audio.setPattern(ex.pattern, ex.notesPerBeat);

    // Render Pattern Cards
    this.renderPattern(ex);
  }

  renderPattern(ex) {
    this.dom.patternContainer.innerHTML = '';

    const notesPerBeat = ex.notesPerBeat;
    const totalNotes = ex.pattern.length;
    
    // Group notes into beats (measure layout)
    let currentBeatGroup = null;
    let measureRow = document.createElement('div');
    measureRow.className = 'measure-row';

    ex.pattern.forEach((note, idx) => {
      if (idx % notesPerBeat === 0) {
        currentBeatGroup = document.createElement('div');
        currentBeatGroup.className = 'beat-group';
        measureRow.appendChild(currentBeatGroup);
      }

      const card = document.createElement('div');
      card.className = `note-card note-hand-${note.hand.toLowerCase()} ${note.accent ? 'has-accent' : ''}`;
      card.id = `note-${idx}`;

      const subLabel = note.beat || note.sub || '•';

      card.innerHTML = `
        <span class="note-sub-label">${subLabel}</span>
        <span class="note-hand-letter">${note.hand}</span>
        <span class="note-accent-badge">&gt;</span>
      `;

      currentBeatGroup.appendChild(card);
    });

    this.dom.patternContainer.appendChild(measureRow);
  }

  highlightNote(noteIndex, isBeatOne) {
    // Un-highlight previous
    const prevActive = this.dom.patternContainer.querySelector('.note-card.is-active');
    if (prevActive) {
      prevActive.classList.remove('is-active');
    }

    // Highlight current note
    const currentCard = document.getElementById(`note-${noteIndex}`);
    if (currentCard) {
      currentCard.classList.add('is-active');
      // Ensure active card is visible if scrollable
      currentCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }

    // Pulse Top Indicator
    this.dom.pulseDot.className = 'pulse-dot';
    void this.dom.pulseDot.offsetWidth; // Trigger reflow for animation restart
    if (isBeatOne) {
      this.dom.pulseDot.classList.add('pulse-downbeat');
    } else {
      this.dom.pulseDot.classList.add('pulse-sub');
    }
  }

  setBpm(newBpm) {
    this.audio.setBpm(newBpm);
    this.dom.bpmValue.textContent = this.audio.bpm;
    this.dom.bpmSlider.value = this.audio.bpm;
  }

  handleTapTempo() {
    const now = Date.now();
    // Discard taps older than 2.5 seconds
    if (this.tapTimes.length > 0 && now - this.tapTimes[this.tapTimes.length - 1] > 2500) {
      this.tapTimes = [];
    }

    this.tapTimes.push(now);
    if (this.tapTimes.length > 5) {
      this.tapTimes.shift();
    }

    if (this.tapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < this.tapTimes.length; i++) {
        intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      this.setBpm(calculatedBpm);
    }
  }

  async togglePlay() {
    if (this.audio.isPlaying) {
      this.audio.stop();
      this.timer.pause();
      this.releaseWakeLock();
      this.updatePlayState(false);
    } else {
      this.updatePlayState(true);
      this.timer.start();
      this.requestWakeLock();
      await this.audio.start();
    }
  }

  updatePlayState(isPlaying) {
    if (isPlaying) {
      this.dom.playPauseBtn.classList.add('is-playing');
      this.dom.playIcon.textContent = '⏸';
      this.dom.playText.textContent = 'PAUSE PRACTICE (SPACE)';
    } else {
      this.dom.playPauseBtn.classList.remove('is-playing');
      this.dom.playIcon.textContent = '▶';
      this.dom.playText.textContent = 'START PRACTICE (SPACE)';
      // Clear visual active highlight
      const activeCard = this.dom.patternContainer.querySelector('.note-card.is-active');
      if (activeCard) activeCard.classList.remove('is-active');
      this.dom.pulseDot.className = 'pulse-dot';
    }
  }

  updateStatsUI() {
    const stats = this.timer.getStats();
    this.dom.streakCount.textContent = stats.streakDays || 1;
    this.dom.todayMinutes.textContent = stats.todayMinutes || 0;
  }

  renderCurriculumModal() {
    this.dom.curriculumList.innerHTML = '';
    EXERCISES.forEach((ex, idx) => {
      const item = document.createElement('div');
      item.className = 'curriculum-list-item';
      item.innerHTML = `
        <div>
          <div style="font-weight: 800; font-size: 1rem; color: #f8fafc;">
            ${String(ex.id).padStart(2, '0')}. ${ex.name}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
            ${ex.category} • ${ex.description}
          </div>
        </div>
        <div style="text-align: right; min-width: 90px;">
          <span class="tag tag-highlight">${ex.targetBpm} BPM</span>
        </div>
      `;
      item.addEventListener('click', () => {
        this.loadExercise(idx);
        this.closeModal();
      });
      this.dom.curriculumList.appendChild(item);
    });
  }

  openModal() {
    this.dom.guideModal.classList.add('open');
  }

  closeModal() {
    this.dom.guideModal.classList.remove('open');
  }

  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.dom.wakeLockBtn.classList.add('active');
        this.wakeLock.addEventListener('release', () => {
          if (!this.audio.isPlaying) {
            this.dom.wakeLockBtn.classList.remove('active');
          }
        });
      } catch (err) {
        console.warn('Wake Lock request error:', err);
      }
    }
  }

  releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
      this.dom.wakeLockBtn.classList.remove('active');
    }
  }

  bindEvents() {
    // Re-acquire WakeLock on iOS when app becomes visible again while practicing
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.audio.isPlaying) {
        this.requestWakeLock();
      }
    });

    // Play/Pause Action
    this.dom.playPauseBtn.addEventListener('click', () => this.togglePlay());

    // Exercise Navigation
    this.dom.exerciseSelect.addEventListener('change', (e) => {
      this.loadExercise(parseInt(e.target.value, 10));
    });
    this.dom.prevExBtn.addEventListener('click', () => {
      this.loadExercise(this.currentExerciseIndex - 1);
    });
    this.dom.nextExBtn.addEventListener('click', () => {
      this.loadExercise(this.currentExerciseIndex + 1);
    });

    // Metronome Controls
    this.dom.bpmMinus5.addEventListener('click', () => this.setBpm(this.audio.bpm - 5));
    this.dom.bpmMinus1.addEventListener('click', () => this.setBpm(this.audio.bpm - 1));
    this.dom.bpmPlus1.addEventListener('click', () => this.setBpm(this.audio.bpm + 1));
    this.dom.bpmPlus5.addEventListener('click', () => this.setBpm(this.audio.bpm + 5));
    this.dom.bpmSlider.addEventListener('input', (e) => this.setBpm(parseInt(e.target.value, 10)));
    this.dom.tapTempoBtn.addEventListener('click', () => this.handleTapTempo());

    this.dom.soundSelect.addEventListener('change', (e) => {
      this.audio.setSoundType(e.target.value);
    });

    this.dom.muteBtn.addEventListener('click', () => {
      const isMuted = this.audio.toggleMute();
      this.dom.muteBtn.textContent = isMuted ? '🔇' : '🔊';
      this.dom.muteBtn.classList.toggle('active', isMuted);
    });

    // Timer Presets
    const presetBtns = this.dom.timerPresets.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const minutes = parseFloat(btn.dataset.min);
        this.timer.setDuration(minutes);
      });
    });

    this.dom.timerResetBtn.addEventListener('click', () => {
      this.timer.reset();
    });

    this.dom.timerModeBtn.addEventListener('click', () => {
      const newMode = this.timer.mode === 'countdown' ? 'stopwatch' : 'countdown';
      this.timer.setMode(newMode);
      this.dom.timerModeBtn.textContent = newMode === 'countdown' ? '⏳' : '⏱️';
      this.dom.timerModeBtn.title = `Current Mode: ${newMode.toUpperCase()}`;
    });

    // Wake Lock Toggle Button
    this.dom.wakeLockBtn.addEventListener('click', () => {
      if (this.wakeLock) {
        this.releaseWakeLock();
      } else {
        this.requestWakeLock();
      }
    });

    // Curriculum Modal
    this.dom.guideBtn.addEventListener('click', () => this.openModal());
    this.dom.closeGuideBtn.addEventListener('click', () => this.closeModal());
    this.dom.guideModal.addEventListener('click', (e) => {
      if (e.target === this.dom.guideModal) this.closeModal();
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Don't intercept if user is inside a select or input
      if (['INPUT', 'SELECT'].includes(document.activeElement.tagName)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.togglePlay();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.setBpm(this.audio.bpm + 5);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.setBpm(this.audio.bpm - 5);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.setBpm(this.audio.bpm - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.setBpm(this.audio.bpm + 1);
          break;
        case 'KeyT':
          e.preventDefault();
          this.handleTapTempo();
          break;
        case 'BracketLeft': // [
          e.preventDefault();
          this.loadExercise(this.currentExerciseIndex - 1);
          break;
        case 'BracketRight': // ]
          e.preventDefault();
          this.loadExercise(this.currentExerciseIndex + 1);
          break;
        case 'KeyM':
          e.preventDefault();
          this.dom.muteBtn.click();
          break;
        case 'KeyR':
          e.preventDefault();
          this.dom.timerResetBtn.click();
          break;
        case 'Escape':
          this.closeModal();
          break;
      }
    });
  }
}

// Start application once DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new DrumPadApp();

  // Register PWA Service Worker for offline iOS/iPad caching
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('Service Worker registration skipped:', err);
    });
  }
});
