import { EXERCISES, COMBO_PRESETS } from './exercises.js';
import { AudioEngine } from './audio.js';
import { PracticeTimer } from './timer.js';

class DrumPadApp {
  constructor() {
    this.audio = new AudioEngine();
    this.timer = new PracticeTimer();
    this.currentExerciseIndex = 0;
    this.tapTimes = [];
    this.wakeLock = null;

    // Combo Mode State
    this.isComboMode = false;
    this.activeCombo = null;
    this.comboStep = 0;
    this.comboBarsPlayed = 0;
    this.customComboSelection = [1, 6, 11];

    // DOM Elements
    this.dom = {
      // Header
      streakCount: document.getElementById('streakCount'),
      todayMinutes: document.getElementById('todayMinutes'),
      comboBtn: document.getElementById('comboBtn'),
      wakeLockBtn: document.getElementById('wakeLockBtn'),
      guideBtn: document.getElementById('guideBtn'),
      
      // Exercise Selector
      exerciseSelect: document.getElementById('exerciseSelect'),
      prevExBtn: document.getElementById('prevExBtn'),
      nextExBtn: document.getElementById('nextExBtn'),
      openComboModalBtn: document.getElementById('openComboModalBtn'),
      exerciseSubdivision: document.getElementById('exerciseSubdivision'),
      exerciseCategory: document.getElementById('exerciseCategory'),
      targetBpmTag: document.getElementById('targetBpmTag'),
      techniqueTipText: document.getElementById('techniqueTipText'),

      // Combo Banner
      comboStatusBanner: document.getElementById('comboStatusBanner'),
      comboRoutineTitle: document.getElementById('comboRoutineTitle'),
      comboStepPill: document.getElementById('comboStepPill'),
      comboNextStepBtn: document.getElementById('comboNextStepBtn'),
      comboExitBtn: document.getElementById('comboExitBtn'),

      // Stage / Pattern
      stageCard: document.getElementById('stageCard'),
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
      timerResetBtn2: document.getElementById('timerResetBtn2'),
      timerStartBtn: document.getElementById('timerStartBtn'),
      timerPauseBtn: document.getElementById('timerPauseBtn'),
      timerStopBtn: document.getElementById('timerStopBtn'),
      timerPresets: document.getElementById('timerPresets'),

      // Action Bar
      playPauseBtn: document.getElementById('playPauseBtn'),
      playIcon: document.getElementById('playIcon'),
      playText: document.getElementById('playText'),
      beatEngineHint: document.getElementById('beatEngineHint'),

      // Modals & Install
      guideModal: document.getElementById('guideModal'),
      closeGuideBtn: document.getElementById('closeGuideBtn'),
      curriculumList: document.getElementById('curriculumList'),
      installBtn: document.getElementById('installBtn'),
      installModal: document.getElementById('installModal'),
      closeInstallBtn: document.getElementById('closeInstallBtn'),
      triggerNativeInstallBtn: document.getElementById('triggerNativeInstallBtn'),

      // Combo Modal
      comboModal: document.getElementById('comboModal'),
      closeComboBtn: document.getElementById('closeComboBtn'),
      tabCuratedCombos: document.getElementById('tabCuratedCombos'),
      tabCustomCombo: document.getElementById('tabCustomCombo'),
      curatedCombosPanel: document.getElementById('curatedCombosPanel'),
      customComboPanel: document.getElementById('customComboPanel'),
      customComboBarsSelect: document.getElementById('customComboBarsSelect'),
      customComboExerciseGrid: document.getElementById('customComboExerciseGrid'),
      customComboSelectedPills: document.getElementById('customComboSelectedPills'),
      startCustomComboBtn: document.getElementById('startCustomComboBtn')
    };

    this.init();
  }

  init() {
    this.populateExerciseSelect();
    this.renderCurriculumModal();
    this.renderCuratedCombos();
    this.renderCustomComboBuilder();
    this.loadExercise(0);
    this.updateStatsUI();
    this.bindEvents();

    // Setup audio callback for synchronized visual triggers
    this.audio.onNoteTrigger = ({ noteIndex, note, isBeatOne }) => {
      this.highlightNote(noteIndex, isBeatOne);
    };

    // Setup audio loop callback for seamless combo progression
    this.audio.onLoopCompleted = () => {
      this.handleLoopCompleted();
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

  loadExercise(index, isAutoTransition = false) {
    if (index < 0) index = EXERCISES.length - 1;
    if (index >= EXERCISES.length) index = 0;

    this.currentExerciseIndex = index;
    const ex = EXERCISES[index];

    this.dom.exerciseSelect.value = index;
    this.dom.exerciseCategory.textContent = ex.category;
    this.dom.exerciseSubdivision.textContent = `${ex.notesPerBeat === 4 ? '16th' : (ex.notesPerBeat === 3 ? 'Triplet' : '8th')} Notes`;
    this.dom.targetBpmTag.textContent = `Goal: ${ex.targetBpm} BPM`;
    this.dom.techniqueTipText.textContent = ex.techniqueTip;

    // Set BPM to exercise default if metronome is stopped and not an auto combo step
    if (!this.audio.isPlaying && !isAutoTransition) {
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

      // Auto-scroll patternContainer horizontally ONLY if it overflows horizontally
      // CRUCIAL FIX: Never use window scrollIntoView which steals mobile viewport scroll!
      if (this.dom.patternContainer.scrollWidth > this.dom.patternContainer.clientWidth) {
        const containerRect = this.dom.patternContainer.getBoundingClientRect();
        const cardRect = currentCard.getBoundingClientRect();

        if (cardRect.right > containerRect.right - 16) {
          this.dom.patternContainer.scrollLeft += (cardRect.right - containerRect.right + 36);
        } else if (cardRect.left < containerRect.left + 16) {
          this.dom.patternContainer.scrollLeft -= (containerRect.left - cardRect.left + 36);
        }
      }
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
      this.scrollToBeatEngine();
      await this.audio.start();
    }
  }

  scrollToBeatEngine() {
    if (!this.dom.stageCard) return;
    setTimeout(() => {
      try {
        const rect = this.dom.stageCard.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const targetTop = Math.max(0, rect.top + scrollTop - 16);
        window.scrollTo({
          top: targetTop,
          behavior: 'smooth'
        });
      } catch (e) {
        this.dom.stageCard.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);
  }

  updatePlayState(isPlaying) {
    if (isPlaying) {
      this.dom.playPauseBtn.classList.add('is-playing');
      this.dom.playIcon.textContent = '⏸';
      this.dom.playText.textContent = 'PAUSE PRACTICE (SPACE)';
      if (this.dom.beatEngineHint) {
        this.dom.beatEngineHint.textContent = '(tap to pause)';
        this.dom.beatEngineHint.classList.add('is-playing');
      }
      if (this.dom.stageCard) {
        this.dom.stageCard.setAttribute('title', 'Tap anywhere on beats stage to Pause');
      }
      if (this.dom.timerStartBtn) this.dom.timerStartBtn.classList.add('active');
      if (this.dom.timerPauseBtn) this.dom.timerPauseBtn.classList.remove('active');
    } else {
      this.dom.playPauseBtn.classList.remove('is-playing');
      this.dom.playIcon.textContent = '▶';
      this.dom.playText.textContent = 'START PRACTICE (SPACE)';
      if (this.dom.beatEngineHint) {
        this.dom.beatEngineHint.textContent = '(tap to start)';
        this.dom.beatEngineHint.classList.remove('is-playing');
      }
      if (this.dom.stageCard) {
        this.dom.stageCard.setAttribute('title', 'Tap anywhere on beats stage to Start');
      }
      if (this.dom.timerStartBtn) this.dom.timerStartBtn.classList.remove('active');
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

  // --- Workout Combo & Routine Engine ---

  handleLoopCompleted() {
    if (!this.isComboMode || !this.activeCombo) return;

    this.comboBarsPlayed++;
    if (this.comboBarsPlayed >= this.activeCombo.barsPerExercise) {
      this.comboBarsPlayed = 0;
      this.comboStep = (this.comboStep + 1) % this.activeCombo.exerciseIds.length;
      const nextId = this.activeCombo.exerciseIds[this.comboStep];
      const nextIndex = EXERCISES.findIndex(e => e.id === nextId);
      if (nextIndex !== -1) {
        this.loadExercise(nextIndex, true);
      }
    }
    this.updateComboBanner();
  }

  updateComboBanner() {
    if (!this.isComboMode || !this.activeCombo) {
      this.dom.comboStatusBanner.style.display = 'none';
      return;
    }

    this.dom.comboStatusBanner.style.display = 'flex';
    this.dom.comboRoutineTitle.textContent = this.activeCombo.name;

    const totalSteps = this.activeCombo.exerciseIds.length;
    const currentStepNum = this.comboStep + 1;
    const currentBarNum = this.comboBarsPlayed + 1;
    const totalBars = this.activeCombo.barsPerExercise;

    this.dom.comboStepPill.textContent = `Ex ${currentStepNum}/${totalSteps} • Bar ${currentBarNum}/${totalBars}`;
  }

  startCombo(combo) {
    this.isComboMode = true;
    this.activeCombo = combo;
    this.comboStep = 0;
    this.comboBarsPlayed = 0;

    const firstId = combo.exerciseIds[0];
    const firstIndex = EXERCISES.findIndex(e => e.id === firstId);
    if (firstIndex !== -1) {
      this.loadExercise(firstIndex);
    }
    this.updateComboBanner();
    this.closeComboModal();
  }

  exitComboMode() {
    this.isComboMode = false;
    this.activeCombo = null;
    this.dom.comboStatusBanner.style.display = 'none';
  }

  skipComboStep() {
    if (!this.isComboMode || !this.activeCombo) return;
    this.comboBarsPlayed = 0;
    this.comboStep = (this.comboStep + 1) % this.activeCombo.exerciseIds.length;
    const nextId = this.activeCombo.exerciseIds[this.comboStep];
    const nextIndex = EXERCISES.findIndex(e => e.id === nextId);
    if (nextIndex !== -1) {
      this.loadExercise(nextIndex, true);
    }
    this.updateComboBanner();
  }

  renderCuratedCombos() {
    this.dom.curatedCombosPanel.innerHTML = '';
    COMBO_PRESETS.forEach(combo => {
      const card = document.createElement('div');
      card.className = 'curated-combo-card';

      const exercisesListHtml = combo.exerciseIds.map(id => {
        const ex = EXERCISES.find(e => e.id === id);
        return `<span class="combo-pill">#${id} ${ex ? ex.name : ''}</span>`;
      }).join('');

      card.innerHTML = `
        <div style="flex: 1;">
          <div class="curated-combo-title">⚡ ${combo.name}</div>
          <div class="curated-combo-desc">${combo.description} • <strong>${combo.barsPerExercise} Bars each</strong></div>
          <div class="curated-combo-pills">${exercisesListHtml}</div>
        </div>
        <button class="bpm-btn" style="background: linear-gradient(135deg, #059669, #10b981); color: #fff; border: none; padding: 0.6rem 1rem; border-radius: var(--radius-sm); font-weight: 800; cursor: pointer; white-space: nowrap;">
          Start Routine ▶
        </button>
      `;

      card.querySelector('button').addEventListener('click', () => {
        this.startCombo(combo);
      });

      this.dom.curatedCombosPanel.appendChild(card);
    });
  }

  renderCustomComboBuilder() {
    this.dom.customComboExerciseGrid.innerHTML = '';
    EXERCISES.forEach(ex => {
      const item = document.createElement('div');
      item.className = `custom-combo-item ${this.customComboSelection.includes(ex.id) ? 'selected' : ''}`;
      item.dataset.id = ex.id;

      const orderIdx = this.customComboSelection.indexOf(ex.id);
      const badgeHtml = orderIdx !== -1 
        ? `<span class="custom-combo-order-badge">${orderIdx + 1}</span>` 
        : `<span style="font-size: 0.75rem; color: var(--text-subtle);">${String(ex.id).padStart(2, '0')}</span>`;

      item.innerHTML = `
        ${badgeHtml}
        <span style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ex.name}</span>
      `;

      item.addEventListener('click', () => {
        const idx = this.customComboSelection.indexOf(ex.id);
        if (idx !== -1) {
          this.customComboSelection.splice(idx, 1);
        } else {
          if (this.customComboSelection.length >= 8) {
            alert('You can select up to 8 exercises in a custom combo!');
            return;
          }
          this.customComboSelection.push(ex.id);
        }
        this.renderCustomComboBuilder();
      });

      this.dom.customComboExerciseGrid.appendChild(item);
    });

    this.updateCustomComboPills();
  }

  updateCustomComboPills() {
    if (this.customComboSelection.length === 0) {
      this.dom.customComboSelectedPills.innerHTML = '<span style="color: var(--text-subtle);">None selected yet. Click exercises above to chain them.</span>';
      return;
    }

    this.dom.customComboSelectedPills.innerHTML = this.customComboSelection.map((id, index) => {
      const ex = EXERCISES.find(e => e.id === id);
      return `
        <span style="background: rgba(14, 165, 233, 0.2); border: 1px solid var(--right-hand); color: #fff; padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.35rem;">
          <strong>${index + 1}.</strong> ${ex ? ex.name : `Ex #${id}`}
        </span>
      `;
    }).join(' <span style="color: var(--accent-gold); font-weight: 900;">→</span> ');
  }

  renderCurriculumModal() {
    this.dom.curriculumList.innerHTML = '';
    let currentCategory = null;

    EXERCISES.forEach((ex, idx) => {
      if (ex.category !== currentCategory) {
        currentCategory = ex.category;
        const catHeader = document.createElement('div');
        catHeader.style.cssText = 'font-weight: 800; font-size: 0.85rem; color: var(--accent-gold); text-transform: uppercase; letter-spacing: 0.05em; padding: 0.5rem 0.2rem 0.2rem 0.2rem; border-bottom: 1px solid rgba(251, 191, 36, 0.2); margin-top: 0.5rem;';
        catHeader.textContent = currentCategory;
        this.dom.curriculumList.appendChild(catHeader);
      }

      const item = document.createElement('div');
      item.className = 'curriculum-list-item';
      item.innerHTML = `
        <div>
          <div style="font-weight: 800; font-size: 1rem; color: #f8fafc;">
            ${String(ex.id).padStart(2, '0')}. ${ex.name}
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
            ${ex.description}
          </div>
        </div>
        <div style="text-align: right; min-width: 90px;">
          <span class="tag tag-highlight">${ex.targetBpm} BPM</span>
        </div>
      `;
      item.addEventListener('click', () => {
        this.exitComboMode();
        this.loadExercise(idx);
        this.closeModal();
      });
      this.dom.curriculumList.appendChild(item);
    });
  }

  openComboModal() {
    this.dom.comboModal.classList.add('open');
  }

  closeComboModal() {
    this.dom.comboModal.classList.remove('open');
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

    // Play/Pause Action from Main Button
    this.dom.playPauseBtn.addEventListener('click', () => this.togglePlay());

    // Tap/Click on Interactive Beats Stage to Play/Pause
    if (this.dom.stageCard) {
      let touchStartX = 0;
      let touchStartY = 0;
      let isTouchDrag = false;
      let lastTapTime = 0;

      this.dom.stageCard.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          isTouchDrag = false;
        }
      }, { passive: true });

      this.dom.stageCard.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
          const dx = Math.abs(e.touches[0].clientX - touchStartX);
          const dy = Math.abs(e.touches[0].clientY - touchStartY);
          if (dx > 12 || dy > 12) {
            isTouchDrag = true;
          }
        }
      }, { passive: true });

      this.dom.stageCard.addEventListener('touchend', (e) => {
        if (!isTouchDrag) {
          lastTapTime = Date.now();
          this.togglePlay();
        }
      });

      this.dom.stageCard.addEventListener('click', (e) => {
        // Prevent duplicate execution from synthetic click following touchend
        if (Date.now() - lastTapTime < 450) return;
        this.togglePlay();
      });

      this.dom.stageCard.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.togglePlay();
        }
      });
    }

    // Exercise Navigation
    this.dom.exerciseSelect.addEventListener('change', (e) => {
      this.exitComboMode();
      this.loadExercise(parseInt(e.target.value, 10));
    });
    this.dom.prevExBtn.addEventListener('click', () => {
      this.exitComboMode();
      this.loadExercise(this.currentExerciseIndex - 1);
    });
    this.dom.nextExBtn.addEventListener('click', () => {
      this.exitComboMode();
      this.loadExercise(this.currentExerciseIndex + 1);
    });

    // Metronome Controls
    this.dom.bpmMinus5.addEventListener('click', () => this.setBpm(this.audio.bpm - 5));
    this.dom.bpmMinus1.addEventListener('click', () => this.setBpm(this.audio.bpm - 1));
    this.dom.bpmPlus1.addEventListener('click', () => this.setBpm(this.audio.bpm + 1));
    this.dom.bpmPlus5.addEventListener('click', () => this.setBpm(this.audio.bpm + 5));
    this.dom.bpmSlider.addEventListener('input', (e) => this.setBpm(parseInt(e.target.value, 10)));
    this.dom.tapTempoBtn.addEventListener('click', () => this.handleTapTempo());

    this.dom.soundSelect.addEventListener('change', async (e) => {
      this.audio.setSoundType(e.target.value);
      if (!this.audio.isPlaying) {
        await this.audio.ensureAudioContext();
        this.audio.playClick(this.audio.audioCtx.currentTime + 0.02, true, true);
      }
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

    // Classic Timer Transport Controls (▶ Arrow, ⏸ Two Poles, ⏹ Square, ↺ Reset)
    if (this.dom.timerStartBtn) {
      this.dom.timerStartBtn.addEventListener('click', async () => {
        this.timer.start();
        this.updatePlayState(true);
        this.requestWakeLock();
        this.scrollToBeatEngine();
        await this.audio.start();
      });
    }

    if (this.dom.timerPauseBtn) {
      this.dom.timerPauseBtn.addEventListener('click', () => {
        this.timer.pause();
        this.audio.stop();
        this.updatePlayState(false);
      });
    }

    if (this.dom.timerStopBtn) {
      this.dom.timerStopBtn.addEventListener('click', () => {
        this.timer.stop();
        this.audio.stop();
        this.updatePlayState(false);
      });
    }

    if (this.dom.timerResetBtn2) {
      this.dom.timerResetBtn2.addEventListener('click', () => {
        this.timer.reset();
      });
    }

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

    // Combo & Routine Modal Events
    if (this.dom.comboBtn) {
      this.dom.comboBtn.addEventListener('click', () => this.openComboModal());
    }
    if (this.dom.openComboModalBtn) {
      this.dom.openComboModalBtn.addEventListener('click', () => this.openComboModal());
    }
    if (this.dom.closeComboBtn) {
      this.dom.closeComboBtn.addEventListener('click', () => this.closeComboModal());
    }
    if (this.dom.comboModal) {
      this.dom.comboModal.addEventListener('click', (e) => {
        if (e.target === this.dom.comboModal) this.closeComboModal();
      });
    }

    // Combo Tab Switching
    if (this.dom.tabCuratedCombos && this.dom.tabCustomCombo) {
      this.dom.tabCuratedCombos.addEventListener('click', () => {
        this.dom.tabCuratedCombos.classList.add('active');
        this.dom.tabCustomCombo.classList.remove('active');
        this.dom.curatedCombosPanel.style.display = 'flex';
        this.dom.customComboPanel.style.display = 'none';
      });

      this.dom.tabCustomCombo.addEventListener('click', () => {
        this.dom.tabCustomCombo.classList.add('active');
        this.dom.tabCuratedCombos.classList.remove('active');
        this.dom.customComboPanel.style.display = 'flex';
        this.dom.curatedCombosPanel.style.display = 'none';
      });
    }

    // Start Custom Combo Button
    if (this.dom.startCustomComboBtn) {
      this.dom.startCustomComboBtn.addEventListener('click', () => {
        if (this.customComboSelection.length < 2) {
          alert('Please select at least 2 exercises to build a combo routine!');
          return;
        }
        const barsPerExercise = parseInt(this.dom.customComboBarsSelect.value, 10) || 4;
        const customRoutine = {
          id: 'custom-routine',
          name: `Custom Routine (${this.customComboSelection.length} Rudiments)`,
          description: 'User-created custom practice combination',
          barsPerExercise,
          exerciseIds: [...this.customComboSelection]
        };
        this.startCombo(customRoutine);
      });
    }

    // Combo Active Banner Buttons
    if (this.dom.comboNextStepBtn) {
      this.dom.comboNextStepBtn.addEventListener('click', () => this.skipComboStep());
    }
    if (this.dom.comboExitBtn) {
      this.dom.comboExitBtn.addEventListener('click', () => this.exitComboMode());
    }

    // PWA Offline Installation (Chrome & Mobile)
    let deferredInstallPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (this.dom.triggerNativeInstallBtn) {
        this.dom.triggerNativeInstallBtn.style.display = 'flex';
      }
    });

    if (this.dom.installBtn) {
      this.dom.installBtn.addEventListener('click', () => {
        this.dom.installModal.classList.add('open');
      });
    }

    if (this.dom.closeInstallBtn) {
      this.dom.closeInstallBtn.addEventListener('click', () => {
        this.dom.installModal.classList.remove('open');
      });
    }

    if (this.dom.installModal) {
      this.dom.installModal.addEventListener('click', (e) => {
        if (e.target === this.dom.installModal) {
          this.dom.installModal.classList.remove('open');
        }
      });
    }

    if (this.dom.triggerNativeInstallBtn) {
      this.dom.triggerNativeInstallBtn.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          const { outcome } = await deferredInstallPrompt.userChoice;
          if (outcome === 'accepted') {
            this.dom.installModal.classList.remove('open');
            this.dom.installBtn.style.display = 'none';
          }
          deferredInstallPrompt = null;
        }
      });
    }

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
        case 'KeyC':
          e.preventDefault();
          this.openComboModal();
          break;
        case 'KeyR':
          e.preventDefault();
          this.dom.timerResetBtn.click();
          break;
        case 'Escape':
          this.closeModal();
          this.closeComboModal();
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
