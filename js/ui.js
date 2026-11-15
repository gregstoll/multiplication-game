/*
 * Screens, rendering and input handling.
 * Game rules live in game.js; this file only decides what to show.
 */
(function () {
  'use strict';

  const cfg = MG.config;
  const F = cfg.features;
  const Q = MG.questions;
  const C = MG.characters;
  const S = MG.sounds;
  const $ = (id) => document.getElementById(id);

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------------
  // Settings (remembered in localStorage when enabled)
  // ------------------------------------------------------------------
  const STORE_KEY = 'multiplication-buddies-v1';
  const settings = { character: null, numbers: [], mode: 'choice', muted: false };

  function loadSettings() {
    if (!F.rememberSettings) return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!saved) return;
      if (C.KINDS.indexOf(saved.character) !== -1) settings.character = saved.character;
      if (Array.isArray(saved.numbers)) settings.numbers = saved.numbers.filter((n) => n >= 1 && n <= Q.maxNumber());
      if (saved.mode === 'choice' || saved.mode === 'typing') settings.mode = saved.mode;
      settings.muted = !!saved.muted;
    } catch (e) { /* storage unavailable (e.g. some browsers on file://) — that's fine */ }
  }

  function saveSettings() {
    if (!F.rememberSettings) return;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function announce(text) {
    const el = $('announcer');
    el.textContent = '';
    setTimeout(() => { el.textContent = text; }, 30);
  }

  function restartAnim(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function showScreen(name) {
    ['setup', 'play', 'summary'].forEach((s) => { $('screen-' + s).hidden = s !== name; });
    document.body.dataset.screen = name;
    window.scrollTo(0, 0);
  }

  let timers = [];
  function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function confetti(count) {
    if (!F.confetti || reducedMotion) return;
    const layer = $('confetti-layer');
    const colors = ['#ff8ccf', '#ffd23f', '#7ad7f0', '#7ee0a8', '#b18cff', '#ffa53a'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'confetti' + (Math.random() < 0.3 ? ' round' : '');
      p.style.left = (Math.random() * 100) + 'vw';
      p.style.background = pick(colors);
      p.style.setProperty('--drift', (Math.random() * 160 - 80) + 'px');
      p.style.setProperty('--spin', (Math.random() * 720 - 360) + 'deg');
      p.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
      p.style.animationDelay = (Math.random() * 0.4) + 's';
      layer.appendChild(p);
      setTimeout(() => p.remove(), 3400);
    }
  }

  // ------------------------------------------------------------------
  // Setup screen
  // ------------------------------------------------------------------
  function buildSetup() {
    const picker = $('char-picker');
    C.KINDS.forEach((kind) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'char-card';
      btn.setAttribute('role', 'radio');
      btn.dataset.char = kind;
      btn.innerHTML = '<div class="buddy"></div><span class="char-name">' + C.NAMES[kind] + '</span>';
      C.render(btn.querySelector('.buddy'), kind);
      btn.addEventListener('click', () => {
        settings.character = kind;
        C.setMood(btn.querySelector('.buddy'), 'happy', 900);
        S.tap();
        updateSetup();
      });
      picker.appendChild(btn);
    });

    const grid = $('num-grid');
    for (let n = 1; n <= Q.maxNumber(); n++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'num-btn';
      btn.dataset.num = n;
      btn.innerHTML = '<span class="num-val">' + n + '</span><span class="num-check" aria-hidden="true">✓</span>';
      btn.setAttribute('aria-label', 'Practice the ' + n + ' times table');
      btn.addEventListener('click', () => {
        const i = settings.numbers.indexOf(n);
        if (i === -1) settings.numbers.push(n); else settings.numbers.splice(i, 1);
        settings.numbers.sort((a, b) => a - b);
        S.tap();
        updateSetup();
      });
      grid.appendChild(btn);
    }
    $('num-all').addEventListener('click', () => { settings.numbers = Array.from({ length: Q.maxNumber() }, (_, i) => i + 1); S.tap(); updateSetup(); });
    $('num-clear').addEventListener('click', () => { settings.numbers = []; S.tap(); updateSetup(); });

    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => { settings.mode = btn.dataset.mode; S.tap(); updateSetup(); });
    });

    $('start-btn').addEventListener('click', startRound);
  }

  function updateSetup() {
    document.querySelectorAll('.char-card').forEach((b) => {
      const on = b.dataset.char === settings.character;
      b.classList.toggle('selected', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    document.querySelectorAll('.num-btn').forEach((b) => {
      const on = settings.numbers.indexOf(Number(b.dataset.num)) !== -1;
      b.classList.toggle('selected', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('.mode-btn').forEach((b) => {
      const on = b.dataset.mode === settings.mode;
      b.classList.toggle('selected', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });

    const missing = [];
    if (!settings.character) missing.push('a buddy');
    if (!settings.numbers.length) missing.push('at least one number');
    if (!settings.mode) missing.push('a way to answer');

    const ready = missing.length === 0;
    $('start-btn').disabled = !ready;
    if (ready) {
      const n = Q.countQuestions(settings.numbers);
      $('round-info').textContent = 'This round has ' + n + ' question' + (n === 1 ? '' : 's') + '.';
    } else {
      $('round-info').textContent = 'Pick ' + missing.join(' and ') + ' to start.';
    }
    saveSettings();
  }

  // ------------------------------------------------------------------
  // Play screen
  // ------------------------------------------------------------------
  let game = null;
  let busy = false;      // true while celebrating / showing a banner: input is ignored
  let paused = false;    // true while the "Stop this round?" panel is open
  let current = null;

  const buddyEl = () => $('play-buddy');
  const input = () => $('answer-input');
  const typing = () => settings.mode === 'typing';

  const PRAISE = ['Great job!', 'You got it!', 'Awesome!', 'Super!', 'Yes! 🎉', 'Brilliant!', 'Nailed it!', 'Fantastic!', 'Way to go!'];
  const PRAISE_BY_CHAR = { unicorn: 'Magical! ✨', penguin: 'Ice cool! ❄️', narwhal: 'Fin-tastic! 🌊', phoenix: 'Red hot! 🔥', dino: 'Dino-mite! 🦖' };
  const PRAISE_RETRY = ['You got it!', 'There you go!', "Yes, that's it!", 'Good thinking!'];
  const OOPS = ['Not quite. Try again!', 'Almost! Try again.', 'Oops! Have another go.', 'Keep trying, you can do it!'];

  function sayBubble(text, kind) {
    const b = $('bubble');
    b.textContent = text;
    b.className = 'bubble show ' + (kind || '');
    restartAnim(b, 'show');
  }
  function hideBubble() { $('bubble').className = 'bubble'; }

  function startRound() {
    S.unlock();
    clearTimers();
    busy = false; paused = false;
    game = MG.game.create({ numbers: settings.numbers.slice() });

    C.render(buddyEl(), settings.character);
    $('choices').hidden = typing();
    $('answer-form').hidden = !typing();
    $('screen-play').classList.toggle('typing-mode', typing());
    $('streak').hidden = !F.streaks;
    $('mute-btn').hidden = !F.sounds;
    updateMuteBtn();
    updateStreak(0);
    $('bonus-banner').hidden = true;
    $('quit-panel').hidden = true;
    $('screen-play').classList.remove('bonus');

    showScreen('play');
    if (typing()) {
      // Must happen inside the tap handler so tablets/phones open their keyboard.
      input().value = '';
      input().focus();
    }
    S.start();
    renderQuestion();
  }

  function renderQuestion() {
    current = game.current();
    const q = current.q;
    busy = false;
    hideBubble();
    C.setMood(buddyEl(), 'neutral');

    const qEl = $('question');
    qEl.innerHTML = '<span class="q-num">' + q.a + '</span> <span class="q-op">×</span> <span class="q-num">' + q.b +
      '</span> <span class="q-op">=</span> <span class="q-ans">?</span>';
    restartAnim(qEl, 'pop-in');

    const bonus = current.phase === 'bonus';
    $('progress-label').textContent = (bonus ? 'Bonus ' : 'Question ') + current.position + ' of ' + current.count;
    $('progress-fill').style.width = ((current.position - 1) / current.count * 100) + '%';

    if (typing()) {
      const el = input();
      el.value = '';
      el.classList.remove('right', 'wrong', 'shake');
      if (document.activeElement !== el && !paused) el.focus();
    } else {
      renderChoices(q);
    }
    announce((bonus ? 'Bonus question. ' : '') + 'What is ' + q.a + ' times ' + q.b + '?');
  }

  function renderChoices(q) {
    const box = $('choices');
    box.innerHTML = '';
    Q.makeChoices(q.a, q.b, cfg.choiceCount).forEach((v, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.dataset.value = v;
      btn.innerHTML = '<span class="key-hint" aria-hidden="true">' + (i + 1) + '</span><span class="choice-val">' + v + '</span>';
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        handleAnswer(v, btn);
      });
      box.appendChild(btn);
    });
  }

  function handleAnswer(value, btn) {
    if (busy || paused || !game) return;
    const r = game.submit(value);
    if (r.correct) onCorrect(r, btn);
    else onWrong(r, btn);
  }

  function onCorrect(r, btn) {
    busy = true;
    const q = current.q;
    const milestone = F.streaks && r.milestone;

    if (btn) btn.classList.add('right');
    if (typing()) input().classList.add('right');
    document.querySelectorAll('.choice-btn').forEach((b) => { if (b !== btn) b.classList.add('faded'); });

    $('question').querySelector('.q-ans').textContent = q.answer;
    restartAnim($('question'), 'solved');
    $('progress-fill').style.width = (current.position / current.count * 100) + '%';

    C.setMood(buddyEl(), milestone ? 'party' : 'happy');
    if (milestone) {
      sayBubble(r.streak + ' in a row! ' + pick(['Amazing!', 'Wow!', "You're on fire!", 'Incredible!']), 'party');
      S.milestone();
      confetti(40);
    } else {
      const options = r.firstTry ? PRAISE.concat([PRAISE_BY_CHAR[settings.character]]) : PRAISE_RETRY;
      sayBubble(pick(options), 'good');
      S.correct();
    }
    updateStreak(r.streak, milestone);
    announce('Correct! ' + q.a + ' times ' + q.b + ' is ' + q.answer + '.');

    later(next, cfg.happyDelayMs + (milestone ? 600 : 0));
  }

  function onWrong(r, btn) {
    if (btn) {
      btn.classList.add('wrong');
      btn.disabled = true;
      btn.setAttribute('aria-label', btn.dataset.value + ', not correct');
    }
    if (typing()) {
      const el = input();
      el.value = '';
      el.classList.remove('right');
      restartAnim(el, 'shake');
      el.focus();
    }
    C.setMood(buddyEl(), 'oops', 1300);
    sayBubble(pick(OOPS), 'oops');
    S.wrong();
    updateStreak(0);
    announce('Not quite. Try again.');
  }

  function next() {
    const res = game.advance();
    if (res.status === 'next') {
      renderQuestion();
    } else if (res.status === 'bonus') {
      busy = true;
      $('screen-play').classList.add('bonus');
      $('bonus-banner').hidden = false;
      C.setMood(buddyEl(), 'happy');
      S.start();
      announce("Bonus practice! Let's try the tricky ones one more time.");
      later(() => { $('bonus-banner').hidden = true; renderQuestion(); }, 2200);
    } else {
      showSummary();
    }
  }

  function updateStreak(n, big) {
    if (!F.streaks) return;
    const el = $('streak');
    if (n >= 2) {
      el.innerHTML = '<span class="streak-star">⭐</span> ' + n + ' in a row!';
      el.classList.add('visible');
      el.classList.toggle('big', !!big);
      restartAnim(el, 'bump');
    } else {
      el.classList.remove('visible', 'big');
    }
  }

  function updateMuteBtn() {
    const btn = $('mute-btn');
    btn.textContent = settings.muted ? '🔇' : '🔊';
    btn.setAttribute('aria-label', settings.muted ? 'Sound off' : 'Sound on');
    btn.setAttribute('aria-pressed', settings.muted ? 'true' : 'false');
    S.setMuted(settings.muted);
  }

  function refocusTyping() {
    if (typing() && !$('screen-play').hidden && !paused) input().focus();
  }

  function buildPlay() {
    // Typing mode
    $('answer-form').addEventListener('submit', (e) => {
      e.preventDefault();
      refocusTyping();
      if (busy || paused) return;
      const v = Q.parseTyped(input().value);
      if (v === null) {
        sayBubble('Type a number!', 'oops');
        restartAnim(input(), 'shake');
        return;
      }
      handleAnswer(v, null);
    });
    // Ignore typing while celebrating so it doesn't spill into the next question.
    input().addEventListener('beforeinput', (e) => { if (busy) e.preventDefault(); });

    // Buttons that shouldn't steal focus from the answer box (keeps the mobile keyboard open).
    document.querySelectorAll('.keep-focus').forEach((b) => {
      b.addEventListener('mousedown', (e) => { if (typing()) e.preventDefault(); });
    });
    // Tapping the question area brings the keyboard back if it was dismissed.
    $('qa').addEventListener('click', (e) => { if (e.target.closest('button')) return; refocusTyping(); });

    $('mute-btn').addEventListener('click', () => {
      settings.muted = !settings.muted;
      updateMuteBtn();
      saveSettings();
      S.unlock();
      S.tap();
      refocusTyping();
    });

    $('quit-btn').addEventListener('click', () => {
      paused = true;
      $('quit-panel').hidden = false;
      $('quit-no').focus();
    });
    $('quit-no').addEventListener('click', () => {
      paused = false;
      $('quit-panel').hidden = true;
      refocusTyping();
    });
    $('quit-yes').addEventListener('click', () => {
      clearTimers();
      paused = false; busy = false; game = null;
      $('quit-panel').hidden = true;
      input().blur();
      showScreen('setup');
    });

    // Desktop shortcut: keys 1–4 pick an answer in multiple-choice mode.
    document.addEventListener('keydown', (e) => {
      if ($('screen-play').hidden || typing() || busy || paused) return;
      if (e.key === 'Escape') return;
      const i = Number(e.key) - 1;
      const btns = document.querySelectorAll('.choice-btn');
      if (i >= 0 && i < btns.length && !btns[i].disabled) { e.preventDefault(); btns[i].click(); }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('quit-panel').hidden) $('quit-no').click();
    });
  }

  // ------------------------------------------------------------------
  // Summary screen
  // ------------------------------------------------------------------
  function showSummary() {
    const s = game.summary();
    const perfect = s.firstTryCorrect === s.total;
    const buddy = $('summary-buddy');
    C.render(buddy, settings.character);

    $('summary-title').textContent = perfect ? 'Perfect round!' :
      s.stars === 3 ? 'Amazing job!' : s.stars === 2 ? 'Great work!' : 'Nice practice!';
    $('score').innerHTML = 'You got <strong>' + s.firstTryCorrect + ' out of ' + s.total +
      '</strong> right on the first try!';

    const best = $('best-streak');
    best.hidden = !(F.streaks && s.bestStreak >= 2);
    best.innerHTML = 'Best streak: <span class="streak-star">⭐</span> ' + s.bestStreak + ' in a row';

    const chips = $('fact-chips');
    chips.innerHTML = '';
    if (s.missed.length) {
      $('practice-title').textContent = 'Facts to practice';
      s.missed.forEach((q) => {
        const c = document.createElement('span');
        c.className = 'fact-chip';
        c.textContent = q.a + ' × ' + q.b + ' = ' + q.answer;
        chips.appendChild(c);
      });
    } else {
      $('practice-title').textContent = 'You knew every fact! 🎉';
    }

    const starsEl = $('stars');
    starsEl.innerHTML = '';
    starsEl.hidden = !F.stars;

    showScreen('summary');
    C.setMood(buddy, s.stars === 3 || perfect ? 'party' : 'happy');
    announce($('summary-title').textContent + ' You got ' + s.firstTryCorrect + ' out of ' + s.total + ' right on the first try.');

    if (F.stars) {
      for (let i = 0; i < 3; i++) {
        const st = document.createElement('span');
        st.className = 'star' + (i < s.stars ? ' earned' : '');
        st.textContent = '★';
        starsEl.appendChild(st);
        if (i < s.stars) later(() => { st.classList.add('pop'); S.star(i); }, 400 + i * 450);
      }
      starsEl.setAttribute('aria-label', s.stars + ' out of 3 stars');
    } else {
      S.milestone();
    }
    if (s.stars === 3 || perfect) later(() => confetti(70), F.stars ? 1500 : 200);
    $('again-btn').focus({ preventScroll: true });
  }

  function buildSummary() {
    $('again-btn').addEventListener('click', startRound);
    $('settings-btn').addEventListener('click', () => { clearTimers(); updateSetup(); showScreen('setup'); });
  }

  // ------------------------------------------------------------------
  // Keep the play screen fitted to the visible area (on-screen keyboards)
  // ------------------------------------------------------------------
  function watchViewport() {
    const vv = window.visualViewport;
    function update() {
      const h = vv ? vv.height : window.innerHeight;
      document.documentElement.style.setProperty('--vvh', h + 'px');
      document.body.classList.toggle('compact', h < 560);
      if (document.body.dataset.screen === 'play') window.scrollTo(0, 0);
    }
    if (vv) vv.addEventListener('resize', update);
    window.addEventListener('resize', update);
    update();
  }

  // ------------------------------------------------------------------
  // Start up
  // ------------------------------------------------------------------
  loadSettings();
  buildSetup();
  buildPlay();
  buildSummary();
  updateSetup();
  watchViewport();
  showScreen('setup');
  // Any tap can unlock audio (browsers require a user gesture first).
  document.addEventListener('pointerdown', () => S.unlock(), { passive: true });
})();
