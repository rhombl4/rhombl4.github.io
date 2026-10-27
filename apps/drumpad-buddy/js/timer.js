/**
 * Practice Timer & Progress Tracker Module
 * Handles countdown/stopwatch modes, audio notifications, and LocalStorage persistence.
 */

export class PracticeTimer {
  constructor() {
    this.mode = 'countdown'; // 'countdown' | 'stopwatch'
    this.targetSeconds = 120; // Default 2 minutes
    this.remainingSeconds = 120;
    this.elapsedSeconds = 0;
    this.isRunning = false;
    this.intervalId = null;
    this.startTime = null;
    this.initialRemaining = 120;
    this.initialElapsed = 0;

    // Callbacks
    this.onTick = null;
    this.onComplete = null;

    // Load persisted user stats
    this.loadStats();
  }

  setMode(mode) {
    this.mode = mode;
    this.reset();
  }

  setDuration(minutes) {
    this.targetSeconds = Math.round(minutes * 60);
    this.reset();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = Date.now();
    this.initialRemaining = this.remainingSeconds;
    this.initialElapsed = this.elapsedSeconds;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      const deltaSec = Math.floor((Date.now() - this.startTime) / 1000);

      if (this.mode === 'countdown') {
        const newRemaining = Math.max(0, this.initialRemaining - deltaSec);
        this.remainingSeconds = newRemaining;
        this.elapsedSeconds = this.initialElapsed + deltaSec;
        this.triggerTick();

        if (this.remainingSeconds <= 0) {
          this.complete();
        }
      } else {
        this.elapsedSeconds = this.initialElapsed + deltaSec;
        this.triggerTick();
      }
    }, 200);

    this.triggerTick();
  }

  pause() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset() {
    this.pause();
    this.remainingSeconds = this.targetSeconds;
    this.elapsedSeconds = 0;
    this.triggerTick();
  }

  complete() {
    this.pause();
    this.recordPracticeTime(this.targetSeconds);
    if (this.onComplete) {
      this.onComplete();
    }
  }

  triggerTick() {
    if (this.onTick) {
      const displaySeconds = this.mode === 'countdown' ? this.remainingSeconds : this.elapsedSeconds;
      this.onTick({
        displayTime: this.formatTime(displaySeconds),
        rawSeconds: displaySeconds,
        elapsedSeconds: this.elapsedSeconds,
        progressPercent: this.mode === 'countdown' 
          ? (this.targetSeconds > 0 ? Math.min(100, Math.round(((this.targetSeconds - this.remainingSeconds) / this.targetSeconds) * 100)) : 0)
          : 100,
        mode: this.mode,
        isRunning: this.isRunning
      });
    }
  }

  formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // --- Statistics & Persistence ---

  loadStats() {
    const defaultStats = {
      totalMinutes: 0,
      todayMinutes: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      streakDays: 1,
      completedExercises: {}
    };

    try {
      const saved = localStorage.getItem('drumpad_stats');
      if (saved) {
        this.stats = JSON.parse(saved);
        // Check date for streak calculation
        const today = new Date().toISOString().split('T')[0];
        if (this.stats.lastActiveDate !== today) {
          const lastDate = new Date(this.stats.lastActiveDate);
          const currDate = new Date(today);
          const diffDays = Math.round((currDate - lastDate) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            this.stats.streakDays += 1;
          } else if (diffDays > 1) {
            this.stats.streakDays = 1;
          }
          this.stats.todayMinutes = 0;
          this.stats.lastActiveDate = today;
          this.saveStats();
        }
      } else {
        this.stats = defaultStats;
        this.saveStats();
      }
    } catch (e) {
      this.stats = defaultStats;
    }
  }

  saveStats() {
    try {
      localStorage.setItem('drumpad_stats', JSON.stringify(this.stats));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  recordPracticeTime(seconds) {
    const minutes = Math.max(1, Math.round(seconds / 60));
    this.stats.totalMinutes = (this.stats.totalMinutes || 0) + minutes;
    this.stats.todayMinutes = (this.stats.todayMinutes || 0) + minutes;
    this.saveStats();
  }

  recordExerciseBpm(exerciseId, bpm) {
    if (!this.stats.completedExercises) this.stats.completedExercises = {};
    const prev = this.stats.completedExercises[exerciseId] || 0;
    if (bpm > prev) {
      this.stats.completedExercises[exerciseId] = bpm;
      this.saveStats();
    }
  }

  getStats() {
    return this.stats;
  }
}
