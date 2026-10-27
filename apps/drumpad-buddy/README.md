# DrumPad Buddy 🥁

A fast, zero-dependency, modern web application designed for beginner drummers practicing with drumsticks and a practice pad.

## Features

1. **Jitter-Free Precision Metronome**:
   - Built on the native **Web Audio API lookahead scheduler pattern** to ensure zero timing drift.
   - Tempo range: 40 to 220 BPM with fine-tuning (`-5`, `-1`, `+1`, `+5`) and continuous slider.
   - **Tap Tempo**: Quickly sync with any song or tempo by tapping along.
   - Multiple synthesized sound profiles: Warm Woodblock, Practice Pad Snare Tap, Digital Beep, and Cowbell.
   - Visual pulsing beat engine indicating beat 1 accents and subdivisions.

2. **Exercise Practice Timer & Session Tracker**:
   - Countdown presets (1 min, 2 min, 3 min, 5 min) and stopwatch mode.
   - Synchronized metronome start/stop.
   - Completion celebration chime.
   - Progress persistence: Daily streaks and minutes practiced stored in browser `localStorage`.

3. **Synchronized Sticking Visualizer & 10 Beginner Exercises**:
   - Real-time runner sweeping across hand stickings in sync with the audio clock.
   - Clear color coding: **Right Hand (Blue)** vs. **Left Hand (Amber)**, with dynamic accent badges.
   - 10 curated rudiments for practice pad mastery:
     1. Single Stroke Alternation
     2. Eight on a Hand
     3. Single Stroke 16ths
     4. Double Stroke Roll
     5. Single Paradiddle
     6. Accent & Tap (Downstroke / Upstroke)
     7. Inverted Paradiddle
     8. Paradiddle-Diddle
     9. Single Stroke Triplet Flow
     10. The Pad Pyramid (Daily Endurance Workout)

4. **Practice-Ready Ergonomics**:
   - **Screen Wake Lock API**: Prevents the screen from turning off while your hands hold sticks.
   - High-contrast dark theme designed to be readable from 2–3 feet away on a music stand.
   - Full keyboard shortcuts support.

---

## How to Run

### Option 1: Direct in Browser
Simply double-click or open `index.html` in any modern web browser (Chrome, Safari, Firefox, Edge).

### Option 2: Local HTTP Server
Using Python (pre-installed on macOS/Linux):
```bash
python3 -m http.server 8000
```
Then navigate to: [http://localhost:8000](http://localhost:8000)

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Start / Pause Exercise & Timer |
| `←` / `→` | Adjust BPM ±1 |
| `↑` / `↓` | Adjust BPM ±5 |
| `T` | Tap Tempo |
| `[` / `]` | Previous / Next Exercise |
| `M` | Mute / Unmute Metronome |
| `R` | Reset Practice Timer |
| `Esc` | Close Curriculum Modal |
