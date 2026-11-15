# Multiplication Buddies

A simple, timer-free game for kids to practice their times tables with a cute buddy
(a unicorn, penguin, narwhal, phoenix or dino).

This app was vibe-coded with Claude - see transcript at CHAT-LOG.md.

## Playing

Open `index.html` in a browser. Opening it straight from disk works, and so does putting the folder on any web server.
There's nothing to install or build.

1. Pick a buddy.
2. Pick the numbers to practice (1–12). Each number you pick adds that number × 1 through × 12.
   A pair only appears once, so with 2 and 8 picked, 2 × 8 is asked a single time.
3. Choose **Tap the answer** (4 choices) or **Type the answer** (uses the device's own keyboard).

A wrong answer can be tried again until it's right. Every question missed the first time comes back once
in a **Bonus practice** round at the end. The summary shows how many were right on the first try, plus the facts to practice.

## Turning extras on/off

Edit `js/config.js`:

```js
features: {
  sounds: true,           // gentle sound effects + mute button
  streaks: true,          // "4 in a row!" counter and milestone celebrations
  stars: true,            // 1–3 stars on the summary screen
  confetti: true,         // confetti on milestones and great rounds
  rememberSettings: true  // remember last buddy / numbers / mode / mute
}
```

The same file has a few other settings: the highest number (`maxNumber`, 12 by default), streak milestones, star thresholds, and how long the celebration lasts.

## Files

| File | What it does |
|---|---|
| `index.html` | The three screens (setup, play, summary) |
| `css/styles.css` | All styling, including the buddy moods and animations |
| `js/config.js` | Feature switches and settings |
| `js/questions.js` | Building and shuffling questions, multiple-choice answers, cleaning up typed answers |
| `js/game.js` | Round flow: scoring, retries, bonus round, streaks |
| `js/characters.js` | The three buddy SVGs and `setMood()` |
| `js/sounds.js` | Sound effects generated with the Web Audio API (no audio files) |
| `js/ui.js` | Screens, rendering and input handling |
| `tests/tests.html` | Open in a browser to run the logic tests |

The code uses plain `<script>` tags (no ES modules or `fetch`). That's what lets it work from `file://`.
