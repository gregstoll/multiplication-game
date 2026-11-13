# Multiplication Buddies — Chat Log

Transcript of the conversation with Claude where the game was planned and built.
Date: November 12, 2026. Tool calls and tool output are left out.

---

## User

Hello! We're going to be writing a game in HTML/Vanilla JS to let kids practice their multiplication. Here's more information:

* This game is designed to be simple and fun
* Before a level, the user can choose which numbers to test themselves on, allowing multiselection from 1-9. For any number they choose, the questions will include multiplying that number by 1-9 (so for example, if they choose the numbers 2 and 8, it will test them on 2\*1, 2\*2, ..., 2\*9, 8\*1, 8\*2, ..., 8\*9)
* The user can also choose a "mode". Multiple choice mode will let the user answer the multiplication question by selecting one of four answers by clicking/tapping on it. Typing mode will require the user to type in the answer (the game should strip out spaces and other non-numeric characters). Note that this needs to work on desktop but also a tablet (and ideally a phone, although if that isn't possible that's OK)
* If the user gets a question wrong, they will get more chances to try again until they get it right. At the end they will get a summary of how many they got right on the first try.
* To make it more fun, the user will get to choose a character: a unicorn, penguin, or a narwhal. The character will look happy when they get a question right.

Please write up a detailed plan on how to implement this, and ask me any questions you have.

## Claude

I'll take a quick look at your project folder first, then write up the plan.

Your `multiplication-game` folder is empty, so this plan starts from scratch.

# Plan: Multiplication Practice Game

## 1. Tech approach and file layout

Plain HTML, CSS and JS, with no build step and no dependencies.

```
multiplication-game/
├── index.html        # all three screens as <section>s; only one shown at a time
├── css/styles.css
├── js/
│   ├── questions.js  # building the question list, shuffling, wrong-answer choices (no DOM code, so easy to test)
│   ├── characters.js # inline SVG drawings + mood changes
│   ├── game.js       # game state and flow
│   └── ui.js         # screens, input handling, rendering
└── tests/questions.test.html  # a page that runs quick checks on the question logic
```

If you want to open `index.html` straight from disk by double-clicking it, I'll use plain `<script>` tags. Chrome blocks ES modules on `file://` pages. If it will be served (GitHub Pages, a local server), I'll use modules.

## 2. Screens

**Setup screen**
- **Character picker:** three big cards (unicorn, penguin, narwhal). Tap one to select it.
- **Number picker:** a 3×3 grid of toggle buttons for 1–9, plus "All" and "Clear" shortcuts. Each button shows its on/off state with color and a ✓, not color alone.
- **Mode picker:** two buttons, "Tap the answer" and "Type the answer".
- **Start button:** disabled until at least one number is picked.

**Play screen**
- The character on one side, the question in big text (e.g. `7 × 6 = ?`), and a progress bar ("Question 5 of 18").
- An answer area, which depends on the mode (see sections 4 and 5).
- A small "Quit" button that goes back to setup, with a confirmation step.

**Summary screen**
- "You got **14 out of 18** right on the first try!" with the character celebrating. More celebration the higher the score.
- A list of the facts they missed, so they know what to practice.
- **Play again** (same settings) and **Change settings** buttons.

## 3. Game state and logic

```js
state = {
  character: 'unicorn' | 'penguin' | 'narwhal',
  mode: 'choice' | 'typing',
  numbers: [2, 8],
  queue: [{a, b, answer, firstTry: true, attempts: 0}, ...],
  index: 0,
}
```

- **Building the questions:** for each selected number `n`, add `n × 1` through `n × 9`, then shuffle with a Fisher-Yates shuffle. If you pick 2 and 8, you get 18 questions, and both 2×8 and 8×2 show up (see question 2 below).
- **Wrong answer:** the question's `firstTry` becomes false and `attempts` goes up by one. The question stays on screen until it's answered correctly. The character gives a gentle "try again" reaction, not a sad one.
- **Right answer:** the character looks happy for about 1 second, then the next question appears automatically.
- **Score:** the count of questions where `firstTry` is still true.

## 4. Multiple-choice mode

- Four big buttons in a 2×2 grid, which works well with thumbs on tablets and phones.
- **Wrong answers that look plausible**, because random numbers are too easy to rule out. The candidates are:
  - neighboring facts: `a×(b±1)` and `(a±1)×b`
  - answers that are off by a little: ±1, ±2, ±10
  - the digits swapped (e.g. 54 → 45)

  Any candidate that equals the right answer, repeats another, or is 0 or less gets thrown out. Then three are picked at random and mixed in with the right answer.
- If they pick a wrong answer, that button shakes and grays out so they can't pick it again. They choose again from the remaining buttons.

## 5. Typing mode (the tricky part for tablets)

- Use `<input type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off">`. That brings up the number pad on iOS and Android. `type="number"` would accept `e`, `-` and `.`, and it handles input inconsistently across devices.
- Before checking, strip everything that isn't a digit (`value.replace(/\D/g, '')`), as you asked. An empty result does nothing.
- The answer can be submitted with Enter or a big "Check" button.
- **My recommendation: also build an on-screen keypad** (0–9, ⌫, ✓) right into the page. On tablets and phones, the system keyboard covers half the screen, shifts the layout around, and on iOS keyboard focus only works after a tap. A built-in keypad looks the same on every device and is easy for kids to hit. A physical keyboard would still work on desktop. With the keypad, phone support becomes realistic.
- A wrong answer clears the box, shakes it, and returns focus to it.

## 6. Characters

- **There's no narwhal emoji**, and emoji look different on every device anyway, so I'll draw all three characters as simple, cute inline SVGs.
- Each SVG has separate parts for the eyes and mouth. A CSS class on the wrapper (`mood-neutral`, `mood-happy`, `mood-oops`) swaps which parts show, and also adds a bounce or wiggle animation. Happy: eyes squint into a smile, the mouth gets bigger, and little sparkles or hearts pop out.
- The animations will turn off for users whose device is set to reduce motion (`prefers-reduced-motion`).

## 7. Making it work on desktop, tablet and phone

- A viewport meta tag, and layouts built with flexbox and grid. Font sizes scale with the screen using `clamp()`.
- Touch targets are at least 56px. `touch-action: manipulation` stops double-tap zoom when kids tap quickly. Nothing relies on hover.
- Layout adjusts to the screen: the character sits beside the question on wide or landscape screens and above it on narrow or portrait screens.
- I'll test in Chrome DevTools' device mode at iPad and phone sizes.

## 8. Accessibility and polish

- Right/wrong feedback is also announced to screen readers through an `aria-live` region.
- All controls are real `<button>`s, so keyboard navigation works.
- Optional extras: sound effects (see questions below) and remembering last session's settings in `localStorage`.

## 9. Build order

1. Question logic plus its test page.
2. Static HTML/CSS for all three screens.
3. Game flow in multiple-choice mode, start to finish.
4. Typing mode and the keypad.
5. Character SVGs and animations.
6. Summary screen polish, then testing on different device sizes.

## Questions for you

1. **How will you run it?** Opening the file directly from disk, or hosting it somewhere like GitHub Pages?
2. **Order of the numbers:** if they pick 8, should questions always look like `8 × 3`, or should the order be random (`3 × 8` sometimes)? If they pick both 2 and 8, is it fine that 2×8 and 8×2 both come up?
3. **Retries:** when they get one wrong, should they retry it right away (my default)? Or should it also come back once more at the end of the round for extra practice?
4. **Typing mode:** OK with the on-screen keypad I recommended?
5. **Round length:** picking all nine numbers means 81 questions. Is that fine, or do you want a cap or a "short/long round" option?
6. **Sound effects:** yes or no? If yes, they'd be generated in code, so no audio files are needed.
7. **Who's playing?** Roughly how old are the kids? Younger kids would get fewer words and more pictures, older kids more text. And do you want any extras like a timer, streaks or stars, or should it stay deliberately calm and simple?
8. **Characters:** OK with me drawing simple cartoon SVGs, or do you have art you'd like to use?

Once you've answered, I can save the final plan to this project so it's there for later sessions.

---

## User

Great! Here are the answers:

1. I would like the ability to run it by directly opening from disk or from hosting on a "real" web server
2. Let's have the order be random. If they pick both 2 and 8, only show 2x8 (or 8x2) one time.
3. Let's have them come back once more at the end of the round.
4. No, I think kids look better by typing than by tapping, so I want to make sure they use whatever keyboard is on their device.
5. It's fine, I only expect a few numbers to be picked for a round at a time, so let's include all questions.
6. Sure if the sounds are cute and not scary or anything.
7. These are kids that are around 9 years old, so text is fine, although cute pictures are always helpful. I deliberately do _not_ want a timer, but extras like streaks and stars are fine. Please make these extras easy to toggle off in code so I can turn it off if they decide they don't like it.
8. Yes, simple cartoon SVGs sound great.

Any other questions? If not, please write out the plan.

## Claude

No more blocking questions. A few small details I've decided myself, and they're listed in section 11 of the plan so you can overrule any of them. I'm saving the full plan to the project so it's there in later sessions.

*(The plan was saved to the project as `implementation-plan.md`. Its full text is in the appendix at the end of this log.)*

I've written the full plan and saved it to the project as **implementation-plan.md**. Here's what your answers changed:

- **Opening from disk and from a server:** the game uses plain `<script>` tags instead of JS modules. The characters are SVGs embedded in the code, and the sounds are generated in code, so there are no files to load. That's what lets it work from `file://` too.
- **Each pair appears once:** 2×8 and 8×2 count as one question, and the order is random. Picking 2 and 8 gives 17 questions, not 18.
- **Bonus round:** every question missed the first time comes back once in a "Bonus practice!" round at the end. That round doesn't change the score.
- **Device keyboard:** typing mode uses `inputmode="numeric"`, which brings up the number pad on tablets and phones. The biggest risk with a device keyboard is that it closes between questions on iPad. To prevent that, the same answer box is reused for every question and never loses focus.
- **Easy toggles:** sounds, streaks, stars, confetti and remembering settings are each one `true`/`false` switch in `js/config.js`. There's no timer.
- **Gentle sounds:** soft "ding" and "boop" tones, plus a mute button in the game.

Section 11 of the plan lists a few small decisions I made myself, so you can quickly overrule any of them. For example, a question shows up in the bonus round only once, even if it took several tries.

If the plan looks good, I'll start building it in your `multiplication-game` folder.

---

## User

Yes, that looks great! Thanks, let's begin implementation.

## Claude

I'm starting the build now. I'll write and test it here first, then copy the files into your `multiplication-game` folder.

The logic and its 15 tests pass. Next I'm writing the characters, sounds and the page itself.

Testing caught a real bug. The browser's built-in form validation blocked typed answers with spaces (like " 48 "), which is exactly the case you wanted stripped. Fixing that and a few visual issues now.

Everything works at desktop, tablet and phone sizes, with the extras on and off. Writing a short README, then copying the files to your folder.

I've built the game and copied it into `C:\git\multiplication-game`. Double-click `index.html` to play, or put the folder on any web server. There's no build step and nothing to install.

All 15 logic tests pass; open `tests/tests.html` to run them yourself. I also played full rounds in headless Chrome at desktop, iPad (portrait and landscape), phone, and a short "keyboard open" screen height. I did that once with all extras on and once with them all off. There were no errors.

**Not tested yet:** I couldn't hear the sounds, and I couldn't try a real iPad or phone keyboard. Two things are worth checking on a real tablet:
- The number pad stays open between questions in typing mode.
- The sounds are as gentle as intended.

**Bug found and fixed:** a typed answer with spaces, like " 48 ", was being blocked by the browser before the game could clean it up. That's fixed now.

**Things I picked myself that you may want to change:**
- I named it **Multiplication Buddies**. The name is in the page title and heading in `index.html`.
- When a buddy is happy, the speech bubble sometimes shows a line just for that character: "Magical! ✨", "Ice cool! ❄️" or "Fin-tastic! 🌊".
- On desktop, keys 1–4 also pick an answer in tap mode.

Each extra (sounds, streaks, stars, confetti, remembering settings) is one `true`/`false` switch at the top of `js/config.js`. The README explains them.

The best next step is to try it with the kids on their tablet and see what they think of the buddies and sounds.

---

## User

Great! The game is working great - could we add a phoenix character?

## Claude

I'll add a phoenix as a fourth buddy. First I'm pulling your current files, in case anything changed since I delivered them.

Your copies match mine, so I'll edit them directly.

Looks good. Copying the four changed files to your folder.

You can now pick a phoenix as a fourth buddy; it's in your `multiplication-game` folder. It's orange-red with a flame crest, flame-shaped wings and tail feathers, and a golden belly. Like the others, it has its neutral, happy, oops and party moods, and its own praise line: "Red hot! 🔥".

I checked it in Chrome on the setup screen and during play, at desktop and phone sizes, and the 15 logic tests still pass. Reload the page to see it.

The buddy picker now shows four buddies in a row on desktop and tablet, and a 2×2 grid on phones. I changed four files: the phoenix drawing in `js/characters.js`, its praise line in `js/ui.js`, the picker layout in `css/styles.css`, and the README.

---

## User

I shift-reloaded the page (index.html) and I still only see the original three buddies.

## Claude

Let me check what's actually on your disk.

Your files got new timestamps, but their sizes didn't change. That means the old versions were written back over them instead of the new ones. Finding out why:

My staged copy has the phoenix, but the copy-back step sent your computer an older cached version of each file. I'll retry from new file paths so it can't use the cache.

That was my mistake. When I copied the files back, your computer was sent older cached versions of them, so the phoenix never actually reached your folder. I re-sent the four files under new names. Their sizes on your disk now match my updated versions exactly (for example, `characters.js` went from 7,524 to 9,426 bytes).

Reload `index.html` and the phoenix should be there. In future I'll check file sizes on your disk after every copy, not just trust that the copy worked.

---

## User

Great! Let's add one more buddy - a green dinosaur.

## Claude

I'll add a green dino. Your files on disk match my latest versions (I just checked their sizes), so I'll build on those.

The dino looks good at all three sizes. Copying the files over under fresh names, then checking the sizes on your disk.

The green dino is now in your folder as the fifth buddy, and the file sizes on your disk match my updated versions this time. It's called "Dino", with orange back spikes, a pale belly, little arms and a curly tail. Like the others, it has happy, oops and party moods, and its own praise line: "Dino-mite! 🦖". Reload `index.html` to see it.

The buddy picker now shows all five in a row on desktop and tablet. On phones it shows three on top and two centered below. I checked it in Chrome at all three sizes, and the 15 logic tests still pass.

---

## Appendix: Implementation plan (as saved to the project)

<details>
<summary>Show the full plan</summary>

# Multiplication Game — Implementation Plan

A simple, fun, timer-free game for kids around 9 years old to practice multiplication facts. Plain HTML, CSS and JavaScript with no dependencies.

### 1. Requirements (agreed)

| Topic | Decision |
|---|---|
| Numbers | Multi-select from 1–9. Each selected number *n* produces *n × 1 … n × 9*. |
| Duplicates | Each pair of numbers appears **once**, whatever the order. With 2 and 8 selected, 2×8 and 8×2 are the same question. |
| Order shown | Random: either `2 × 8` or `8 × 2`. |
| Modes | **Multiple choice** (tap or click one of 4 answers) or **Typing** (uses the **device's own keyboard**, with no on-screen keypad). |
| Typing input | Strip spaces and any other non-digit characters before checking. |
| Wrong answers | Retry until correct. Every missed question also **comes back once more at the end of the round**. |
| Summary | Number right on the first try, out of the total, plus a list of the facts to practice. |
| Round length | All questions for the selected numbers. No cap. |
| Characters | Unicorn, penguin or narwhal, drawn as simple cartoon SVGs. Happy when the answer is right. |
| Sounds | Yes, but cute and gentle only. Generated in code. |
| Extras | Streaks and stars, each **easy to switch off in one config file**. |
| Timer | **None, on purpose.** |
| Devices | Desktop and tablet must work. Phone should work. |
| Running it | Must work both **opened straight from disk (`file://`)** and **from a web server**. |

### 2. Tech approach

Supporting `file://` rules out two things:
- **ES modules** (`<script type="module">`), because Chrome blocks them on `file://`.
- **`fetch()`** for loading JSON, SVG or sound files.

So the game uses:
- Plain `<script src="…">` tags loaded in order, sharing one global namespace object (`window.MG`) so nothing else ends up global.
- Character SVGs embedded as strings in JS.
- Sounds made with the **Web Audio API**, so there are no audio files to load. This works on both `file://` and servers.

Everything runs in the browser, with no build step and no libraries.

**File layout**
```
multiplication-game/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── config.js       # feature switches + settings (edit this to turn extras off)
│   ├── questions.js    # pure logic: building questions, de-duplicating, shuffling, wrong-answer choices
│   ├── characters.js   # SVG drawings + setMood()
│   ├── sounds.js       # Web Audio sound effects
│   ├── game.js         # game state and round flow (no DOM code)
│   └── ui.js           # screens, rendering, input handling
├── tests/
│   └── tests.html      # open in a browser: runs checks on questions.js and game.js
└── README.md
```

Load order in `index.html`: config, then questions, characters, sounds, game, and ui last.

### 3. Config and feature switches (`js/config.js`)

```js
window.MG = window.MG || {};
MG.config = {
  features: {
    sounds:      true,  // gentle sound effects (a mute button is also shown in the game)
    streaks:     true,  // "5 in a row!" counter + celebrations at milestones
    stars:       true,  // 1–3 star rating on the summary screen
    confetti:    true,  // sparkle burst on milestones / great summaries
    rememberSettings: true, // remember last character/numbers/mode in localStorage
  },
  streakMilestones: [3, 5, 10, 15, 20],
  starThresholds: { three: 0.9, two: 0.7, one: 0 },  // fraction right on the first try
  happyDelayMs: 1100,     // how long the character celebrates before the next question
  choiceCount: 4,
};
```

Each feature is checked in **one place** (e.g. `if (MG.config.features.streaks) renderStreak()`). Setting a switch to `false` removes that feature completely, including its piece of the screen, so nothing is left behind.

### 4. Screens

All three screens are `<section>`s in `index.html`. Only one is visible at a time, using the `hidden` attribute.

**4.1 Setup screen**
1. **"Pick your buddy!"**: three big cards with the character SVGs. The selected card gets a thick border, grows slightly, and plays a small "hello" wiggle.
2. **"Which numbers do you want to practice?"**: a 3×3 grid of toggle buttons for 1–9, plus **All** and **Clear** shortcuts. Selected buttons are filled in and show ✓, so the state isn't shown by color alone. Uses `aria-pressed`.
3. **"How do you want to answer?"**: two large buttons, 👆 **Tap the answer** and ⌨️ **Type the answer**.
4. **Start!**: disabled until at least one number is picked. A helper line below it says "This round has 17 questions".

If `rememberSettings` is on, the last choices are pre-filled. Wrapped in try/catch, because `localStorage` can throw on `file://` in some browsers, and the game must still work if it does.

**4.2 Play screen**
```
┌───────────────────────────────────────────┐
│ ▓▓▓▓▓▓░░░░░░  Question 6 of 17   🔊  ✕    │  progress bar, mute, quit
│                                           │
│   [character]        7 × 6 = ?            │
│                                           │
│                 [ answer area ]           │
│                                           │
│   ⭐ 4 in a row!                           │  streak (if enabled)
└───────────────────────────────────────────┘
```
- On wide or landscape screens, the character sits beside the question. On narrow or portrait screens, it's above, and smaller.
- During the end-of-round repeats, the label changes to **"Bonus practice! 2 of 3"** and the progress bar is a different color.
- **Quit** (✕) asks "Stop this round?" with an in-page Yes / Keep playing panel. It doesn't use `confirm()`.

**4.3 Summary screen**
- The character celebrates.
- **"You got 14 out of 17 right on the first try!"**
- Stars (if enabled): 1–3 stars that pop in one at a time, each with a little chime.
- Best streak this round (if enabled).
- **"Facts to practice"**: chips like `7 × 8 = 56` for every question missed the first time. When none were missed: "Perfect round! 🎉"
- Buttons: **Play again** (same settings, newly shuffled) and **Change settings**.

### 5. Game logic

**5.1 Building the question list (`questions.js`)**
```js
function buildQuestions(selected) {          // selected: e.g. [2, 8]
  const seen = new Set(), list = [];
  for (const n of selected) for (let k = 1; k <= 9; k++) {
    const lo = Math.min(n, k), hi = Math.max(n, k), key = lo + 'x' + hi;
    if (seen.has(key)) continue;
    seen.add(key);
    const [a, b] = Math.random() < 0.5 ? [lo, hi] : [hi, lo];  // random order shown
    list.push({ a, b, answer: lo * hi, key });
  }
  return shuffle(list);                       // Fisher-Yates
}
```
Example: picking {2, 8} gives 9 + 9 − 1 = **17** questions, because 2×8 is shared. Picking all of 1–9 gives 45. Square facts like 2×2 appear once.

**5.2 Round flow (`game.js`)**

State:
```js
{
  character, mode, numbers,
  main: [...questions],      // the main pass
  bonus: [],                 // missed questions, filled in during the main pass
  phase: 'main' | 'bonus',
  index: 0,
  current: { q, missedThisTime: false, eliminated: [] },
  results: { firstTryCorrect: 0, total: N, missed: [] },
  streak: 0, bestStreak: 0,
  busy: false,               // true during the celebration pause; ignores input
}
```
- **Correct answer:**
  - In the main pass, the question counts toward the score if nothing was missed on it.
  - Streak goes up by 1. If it hits a milestone, a bigger celebration plays.
  - The character turns happy, a sound plays, and the next question appears after `happyDelayMs`.
- **Wrong answer:**
  - In the main pass, the first miss on a question records it in `results.missed` and adds a copy to `bonus`.
  - Streak resets to 0.
  - The character makes a gentle "oops" face and a soft sound plays. The question stays up to try again.
- When the main pass ends, if `bonus` isn't empty: shuffle it, show a short "Bonus practice!" message, and switch to `phase = 'bonus'`.
- **Bonus pass:** retry until correct, as usual, but **nothing is added back to the list**, so each missed question comes back exactly once. The score is not affected. Streaks still count, which keeps it fun.
- When everything is done, show the summary.

`game.js` exposes plain functions (`startRound`, `submitAnswer`, `next`, `getSummary`) and calls back into the UI through a small `onEvent` hook. That keeps it testable without the page.

### 6. Multiple-choice mode

- Four big buttons in a **2×2 grid** that fills the width on phones.
- **Wrong-answer choices that look plausible** (`makeChoices(a, b, answer)`). The candidate pool is:
  - neighboring facts: `a×(b±1)`, `(a±1)×b`
  - off by a little: `answer ± 1`, `± 2`, `± 10`
  - digits swapped: 54 → 45, only for 2-digit answers that aren't palindromes

  Any candidate equal to the right answer, a repeat, ≤ 0 or > 100 is thrown out. Pick 3 at random, add the right answer, and shuffle.

  Small answers like 1×1 don't have enough candidates, so the pool is topped up with small numbers near the answer.
- A **wrong pick** shakes that button, grays it out and disables it, so they choose from what's left.
- A **right pick** turns the button green, with a bounce.
- On desktop, keys 1–4 also choose an answer. Buttons can also be reached with Tab and pressed with Enter or Space.

### 7. Typing mode (using the device keyboard)

**Input element**
```html
<form id="answer-form" autocomplete="off">
  <input id="answer" type="text" inputmode="numeric" pattern="[0-9]*"
         enterkeyhint="done" autocorrect="off" autocapitalize="off"
         spellcheck="false" aria-label="Your answer">
  <button type="submit">Check ✓</button>
</form>
```
- `inputmode="numeric"` brings up the **number pad** on iPad, Android and phones, and still lets a hardware keyboard type normally.
- **`type="number"` is avoided**: it accepts `e`, `-` and `.`, has spinner arrows, and behaves inconsistently across devices.
- Using a `<form>` means **Enter** on desktop and the **Done/Go key** on mobile keyboards both submit.
- Checking: `const digits = input.value.replace(/\D/g, '')`. An empty result does nothing (maybe a small "Type a number!" hint). Otherwise compare `Number(digits)` with the answer.

**Keeping the keyboard open on tablets and phones**

This is the main mobile problem. iOS only lets code focus an input, and so show the keyboard, **during a user tap**.
- The input is focused inside the **Start** button's click handler, so the keyboard comes up straight away.
- **The same input element is reused for every question.** It is never removed, re-created or blurred. Between questions only its value is cleared, so the keyboard stays open.
- During the celebration pause, extra key presses are ignored using the `busy` flag. `disabled` or `readonly` aren't used, because they can close the mobile keyboard.
- The Check button calls `preventDefault()` on `pointerdown`, so tapping it doesn't take focus away from the input and close the keyboard.
- If the keyboard does get dismissed (the child taps elsewhere), tapping the question or answer area focuses the input again.

**Layout with the keyboard open**
- On phones, the question, the input and the character's face sit in the **top part** of the screen, so the keyboard doesn't cover them.
- The page height is set with `100dvh`, and `visualViewport` resize events add a compact class when the keyboard is taking up space (the character shrinks).
- A wrong answer shakes the input, clears it, and keeps focus. A right answer turns the input green, then it clears for the next question.

### 8. Characters (`characters.js`)

- Three hand-written SVGs with a shared structure, rounded shapes and bright pastel colors:
  - **Unicorn:** white/lavender, rainbow mane, gold horn.
  - **Penguin:** navy/white, orange beak and feet, rosy cheeks.
  - **Narwhal:** sky blue, spotted back, spiral tusk.
- Each SVG has named groups: `.eyes-open`, `.eyes-happy` (curved ^ ^ eyes), `.mouth-neutral`, `.mouth-smile`, `.mouth-oops`, `.cheeks`, `.sparkles`.
- `MG.characters.setMood(el, 'neutral' | 'happy' | 'oops' | 'party')` changes a class on the wrapper. CSS decides which groups show and runs the animations:
  - **happy:** eyes squint into ^ ^, a big smile, a bounce, and sparkles that pop out
  - **party** (streak milestone or great summary): a bigger jump and spin, plus confetti if enabled
  - **oops:** a small head tilt and an "o" mouth. **Encouraging, never sad**, with "Try again!" in a speech bubble
  - **neutral:** a gentle idle bob, plus an occasional blink
- All animations are reduced to simple fades when the device asks for reduced motion (`prefers-reduced-motion`).

### 9. Sounds (`sounds.js`)

Short tones made with the Web Audio API, all soft and cheerful:

| Event | Sound |
|---|---|
| Correct | Two quick rising notes (a "ding-ding" on a xylophone-like sine/triangle tone) |
| Wrong | One soft, low "boop" (a gentle sine at low volume, **not** a buzzer) |
| Streak milestone | A short rising arpeggio (C–E–G–C) |
| Summary star | A little chime for each star |
| Button tap | A very quiet tick (optional) |

- The `AudioContext` is created or resumed inside the **Start** tap, because iOS and Chrome only allow audio to start after a tap.
- A 🔊/🔇 mute button on the play screen. The setting is remembered if `rememberSettings` is on.
- Volume is kept low by default, and each sound fades out quickly so nothing clicks or sounds harsh.
- `features.sounds = false` turns off all sound and hides the mute button.

### 10. Responsive design and accessibility

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- Fluid type with `clamp()`. The question text is very large (around 3–5rem).
- Touch targets are at least 56px. `touch-action: manipulation` stops double-tap zoom. Nothing relies on hover.
- Layout with flexbox and grid. Breakpoints adjust for portrait/landscape and phone/tablet/desktop.
- A rounded, friendly font from the system font stack (`ui-rounded`, then `"Segoe UI"`, then `system-ui`), so no font files are needed.
- High contrast for text. Selected and right/wrong states always pair color with an icon or text.
- An `aria-live="polite"` region announces "Correct!" / "Not quite, try again" / "Question 6 of 17".
- All controls are real `<button>`s with visible focus outlines.

### 11. Small decisions I made (easy to change)

1. A missed question shows up in the bonus round **once**, even if it took several tries in the main pass.
2. The bonus round doesn't change the score. It's practice only.
3. Streaks keep counting through the bonus round.
4. A random order (`a × b` vs `b × a`) is chosen once per question, so the bonus repeat appears in the same order the child saw before.
5. Stars: ≥ 90% right on the first try = 3 stars, ≥ 70% = 2, otherwise 1. A child always gets at least one star.
6. Selecting 1 is allowed. It makes an easy warm-up round.

### 12. Testing

- **`tests/tests.html`**: a tiny test runner with no dependencies. It checks:
  - `buildQuestions`: correct counts ({2,8} → 17, {1..9} → 45, {5} → 9), no duplicate pairs, every answer correct
  - `makeChoices`: always 4 unique, positive numbers, exactly one of them correct, across all 45 facts × many runs
  - digit stripping: `" 4 2 "`, `"42abc"`, `"4-2"` → 42, and `""` / `"abc"` → no answer
  - round flow: a miss adds to the bonus round once, the score counts only first-try answers, the bonus round adds nothing back
- **Manual testing**:
  - Chrome DevTools device mode (iPad portrait/landscape, iPhone SE, Pixel)
  - opening `index.html` directly from disk as well as from a local server (`npx serve` or `python -m http.server`)
  - a real tablet if one is available, especially to check the keyboard stays open in typing mode

### 13. Build order

1. **Basics:** `config.js`, `questions.js`, test page. The tests pass.
2. **Static screens:** HTML and CSS for setup, play and summary, with placeholder characters. Check the layout at every screen size.
3. **Multiple-choice round, start to finish:** `game.js` and `ui.js`, including the bonus round and summary.
4. **Typing mode:** input handling, keeping focus, layout with the keyboard open.
5. **Characters:** the three SVGs and their moods.
6. **Extras:** sounds, streaks, stars, confetti, remembered settings. Each one behind its switch.
7. **Polish and testing:** check each feature switched off, test on devices, write the README.

</details>
