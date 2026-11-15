/*
 * Multiplication Game — settings and feature switches.
 *
 * To turn an extra off, change its value below from `true` to `false`
 * and reload the page. Nothing else needs to change.
 */
window.MG = window.MG || {};

MG.config = {
  features: {
    sounds: true,           // gentle sound effects (also shows a mute button in the game)
    streaks: true,          // "4 in a row!" counter, with celebrations at milestones
    stars: true,            // 1–3 star rating on the summary screen
    confetti: true,         // sparkle bursts on streak milestones and great summaries
    rememberSettings: true  // remember the last character / numbers / mode / mute
  },

  // Highest number to practice, and the highest multiplier.
  // With 12, picking 7 asks 7 × 1 through 7 × 12, and the picker shows 1–12.
  maxNumber: 12,

  // Streak counts that trigger a bigger celebration.
  streakMilestones: [3, 5, 10, 15, 20, 25, 30, 40, 50],

  // Fraction of questions right on the first try needed for each star rating.
  starThresholds: { three: 0.9, two: 0.7 },   // anything lower gets one star

  // How long (ms) the character celebrates before the next question appears.
  happyDelayMs: 1100,

  // How many answer buttons to show in multiple-choice mode.
  choiceCount: 4
};
