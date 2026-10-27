/**
 * 10 Essential Practice Pad Exercises Curriculum for Beginner Drummers
 */

export const EXERCISES = [
  {
    id: 1,
    name: "Single Stroke Alternation",
    category: "Fundamental Alternation",
    timeSignature: [4, 4],
    subdivision: "eighth",
    notesPerBeat: 2,
    defaultBpm: 60,
    targetBpm: 130,
    description: "The most fundamental drumming movement. Focus on balanced sound and height between both hands.",
    techniqueTip: "Maintain relaxed grip fulcrum between thumb and index finger. Allow the stick to bounce back naturally like a basketball.",
    pattern: [
      { hand: "R", accent: true,  beat: "1", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "R", accent: false, beat: "2", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "R", accent: false, beat: "3", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "R", accent: false, beat: "4", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "&" }
    ]
  },
  {
    id: 2,
    name: "Eight on a Hand",
    category: "Wrist Warm-Up & Isolation",
    timeSignature: [4, 4],
    subdivision: "eighth",
    notesPerBeat: 2,
    defaultBpm: 70,
    targetBpm: 140,
    description: "8 consecutive strokes on the right hand, followed by 8 consecutive strokes on the left hand.",
    techniqueTip: "Isolate the wrist motion without tensing your forearm or shoulders. Ensure the left hand matches the right hand's tone.",
    pattern: [
      // Measure 1: All Rights
      { hand: "R", accent: true,  beat: "1", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "R", accent: false, beat: "2", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "R", accent: false, beat: "3", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "R", accent: false, beat: "4", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      // Measure 2: All Lefts
      { hand: "L", accent: true,  beat: "1", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "2", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "3", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "4", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "&" }
    ]
  },
  {
    id: 3,
    name: "Single Stroke 16ths",
    category: "Subdivision Flow",
    timeSignature: [4, 4],
    subdivision: "sixteenth",
    notesPerBeat: 4,
    defaultBpm: 50,
    targetBpm: 105,
    description: "Alternating 16th notes counting '1 e & a, 2 e & a'. The backbone of rock and funk grooves.",
    techniqueTip: "Count out loud: 'One-ee-and-a, Two-ee-and-a'. Keep the stick tips low and matched in height (approx. 4 inches / 10cm).",
    pattern: [
      { hand: "R", accent: true,  beat: "1", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },

      { hand: "R", accent: false, beat: "2", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },

      { hand: "R", accent: false, beat: "3", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },

      { hand: "R", accent: false, beat: "4", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" }
    ]
  },
  {
    id: 4,
    name: "Double Stroke Roll",
    category: "Rebound Control",
    timeSignature: [4, 4],
    subdivision: "sixteenth",
    notesPerBeat: 4,
    defaultBpm: 45,
    targetBpm: 95,
    description: "Two hits per hand: RR LL RR LL. Do not squeeze the stick; allow the second stroke to bounce freely.",
    techniqueTip: "Think 'Drop-Snap'. The first stroke is wrist motion; the second stroke is controlled with your back fingers (middle, ring, pinky).",
    pattern: [
      { hand: "R", accent: true,  beat: "1", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },

      { hand: "R", accent: false, beat: "2", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },

      { hand: "R", accent: false, beat: "3", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },

      { hand: "R", accent: false, beat: "4", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" }
    ]
  },
  {
    id: 5,
    name: "Single Paradiddle",
    category: "Rudiment Core",
    timeSignature: [4, 4],
    subdivision: "sixteenth",
    notesPerBeat: 4,
    defaultBpm: 50,
    targetBpm: 110,
    description: "The holy grail of drumming rudiments: R-L-R-R followed by L-R-L-L. Flips your leading hand every two beats.",
    techniqueTip: "Syllable memory: 'PA-RA-DID-DLE'. Accent the first syllable (PA) and play the rest as lighter tap strokes.",
    pattern: [
      // Beat 1 & 2: R L R R
      { hand: "R", accent: true,  beat: "1", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "R", accent: false, beat: "",  sub: "a" },

      // Beat 3 & 4: L R L L
      { hand: "L", accent: true,  beat: "2", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },

      // Second half
      { hand: "R", accent: true,  beat: "3", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "R", accent: false, beat: "",  sub: "a" },

      { hand: "L", accent: true,  beat: "4", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" }
    ]
  },
  {
    id: 6,
    name: "Accent & Tap (Downstroke / Upstroke)",
    category: "Dynamic Control",
    timeSignature: [4, 4],
    subdivision: "sixteenth",
    notesPerBeat: 4,
    defaultBpm: 50,
    targetBpm: 95,
    description: "Build dynamic contrast between loud downstrokes and soft taps. Accents land on the main downbeats.",
    techniqueTip: "Downstroke stops 1 inch from pad after the accent. Upstrokes start low and finish high to prepare the next accent.",
    pattern: [
      { hand: "R", accent: true,  beat: "1", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },

      { hand: "L", accent: true,  beat: "2", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "R", accent: false, beat: "",  sub: "a" },

      { hand: "R", accent: true,  beat: "3", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },

      { hand: "L", accent: true,  beat: "4", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "R", accent: false, beat: "",  sub: "a" }
    ]
  },
  {
    id: 7,
    name: "Inverted Paradiddle",
    category: "Rudiment Variation",
    timeSignature: [4, 4],
    subdivision: "sixteenth",
    notesPerBeat: 4,
    defaultBpm: 45,
    targetBpm: 95,
    description: "Shift the double stroke to the middle: R-L-L-R followed by L-R-R-L. Crucial for smooth drum fills.",
    techniqueTip: "Keep the inner double strokes (LL / RR) feather-light so the outer accents ring clearly.",
    pattern: [
      { hand: "R", accent: true,  beat: "1", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "R", accent: false, beat: "",  sub: "a" },

      { hand: "L", accent: true,  beat: "2", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },

      { hand: "R", accent: true,  beat: "3", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "R", accent: false, beat: "",  sub: "a" },

      { hand: "L", accent: true,  beat: "4", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" }
    ]
  },
  {
    id: 8,
    name: "Paradiddle-Diddle",
    category: "Six-Stroke Rudiment",
    timeSignature: [3, 4],
    subdivision: "sixteenth",
    notesPerBeat: 4,
    defaultBpm: 55,
    targetBpm: 110,
    description: "Pattern: R-L-R-R-L-L. Notice the same hand leads every time! Ideal for syncopated linear grooves.",
    techniqueTip: "Accent the first stroke (R), tap the second (L), then let two sets of doubles roll smoothly (RR LL).",
    pattern: [
      { hand: "R", accent: true,  beat: "1", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "R", accent: false, beat: "",  sub: "a" },

      { hand: "L", accent: false, beat: "2", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: true,  beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },

      { hand: "R", accent: false, beat: "3", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" }
    ]
  },
  {
    id: 9,
    name: "Single Stroke Triplet Flow",
    category: "Triplet Subdivisions",
    timeSignature: [4, 4],
    subdivision: "triplet",
    notesPerBeat: 3,
    defaultBpm: 55,
    targetBpm: 115,
    description: "Three notes per beat: 1-trip-let, 2-trip-let. The lead hand naturally alternates on each beat.",
    techniqueTip: "Feel the circular waltz-like rhythm. Beat 1 leads with Right, Beat 2 leads with Left, Beat 3 with Right, Beat 4 with Left.",
    pattern: [
      // Beat 1: R L R
      { hand: "R", accent: true,  beat: "1", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "t" },
      { hand: "R", accent: false, beat: "",  sub: "l" },

      // Beat 2: L R L
      { hand: "L", accent: true,  beat: "2", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "t" },
      { hand: "L", accent: false, beat: "",  sub: "l" },

      // Beat 3: R L R
      { hand: "R", accent: true,  beat: "3", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "t" },
      { hand: "R", accent: false, beat: "",  sub: "l" },

      // Beat 4: L R L
      { hand: "L", accent: true,  beat: "4", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "t" },
      { hand: "L", accent: false, beat: "",  sub: "l" }
    ]
  },
  {
    id: 10,
    name: "The Pad Pyramid (Ultimate Daily Workout)",
    category: "Endurance & Hybrid Combo",
    timeSignature: [4, 4],
    subdivision: "sixteenth",
    notesPerBeat: 4,
    defaultBpm: 50,
    targetBpm: 90,
    description: "Combines 1 bar of Singles, 1 bar of Doubles, and 2 bars of Paradiddles into a seamless endurance routine.",
    techniqueTip: "Transition smoothly between the three rudiments without changing your tempo or body posture.",
    pattern: [
      // Measure 1: Singles (16 notes)
      { hand: "R", accent: true,  beat: "1", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },
      { hand: "R", accent: false, beat: "2", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },
      { hand: "R", accent: false, beat: "3", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },
      { hand: "R", accent: false, beat: "4", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },

      // Measure 2: Doubles (16 notes)
      { hand: "R", accent: true,  beat: "1", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },
      { hand: "R", accent: false, beat: "2", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },
      { hand: "R", accent: false, beat: "3", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },
      { hand: "R", accent: false, beat: "4", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },

      // Measure 3: Paradiddles (16 notes)
      { hand: "R", accent: true,  beat: "1", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "R", accent: false, beat: "",  sub: "a" },
      { hand: "L", accent: true,  beat: "2", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" },
      { hand: "R", accent: true,  beat: "3", sub: "" },
      { hand: "L", accent: false, beat: "",  sub: "e" },
      { hand: "R", accent: false, beat: "",  sub: "&" },
      { hand: "R", accent: false, beat: "",  sub: "a" },
      { hand: "L", accent: true,  beat: "4", sub: "" },
      { hand: "R", accent: false, beat: "",  sub: "e" },
      { hand: "L", accent: false, beat: "",  sub: "&" },
      { hand: "L", accent: false, beat: "",  sub: "a" }
    ]
  }
];
