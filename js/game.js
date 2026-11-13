/*
 * Game state and round flow. No DOM code: the UI calls these functions
 * and decides what to show.
 *
 *   var g = MG.game.create({ numbers: [2, 8] });
 *   g.current()        -> the question on screen now
 *   g.submit(42)       -> { correct, streak, milestone, ... }
 *   g.advance()        -> moves on after a correct answer: { status: 'next' | 'bonus' | 'done' }
 *   g.summary()        -> results for the summary screen
 */
window.MG = window.MG || {};

MG.game = (function () {
  'use strict';

  function create(settings, opts) {
    opts = opts || {};
    var cfg = MG.config || {};
    var rand = opts.rand || Math.random;
    var milestones = opts.milestones || cfg.streakMilestones || [];

    var main = MG.questions.buildQuestions(settings.numbers, rand);
    var state = {
      main: main,
      bonus: [],
      phase: 'main',
      index: 0,
      missedThisTime: false,   // has the current question been answered wrong yet?
      eliminated: [],          // wrong answers already tried on the current question
      firstTryCorrect: 0,
      missed: [],              // questions missed in the main pass (for the summary)
      streak: 0,
      bestStreak: 0,
      done: false
    };

    function list() { return state.phase === 'main' ? state.main : state.bonus; }

    function current() {
      if (state.done) return null;
      var l = list();
      return {
        q: l[state.index],
        phase: state.phase,
        position: state.index + 1,
        count: l.length,
        eliminated: state.eliminated.slice(),
        missedThisTime: state.missedThisTime
      };
    }

    function submit(value) {
      if (state.done) return null;
      var q = list()[state.index];
      var correct = value === q.answer;

      if (correct) {
        if (state.phase === 'main' && !state.missedThisTime) state.firstTryCorrect++;
        state.streak++;
        if (state.streak > state.bestStreak) state.bestStreak = state.streak;
        return {
          correct: true,
          firstTry: !state.missedThisTime,
          streak: state.streak,
          milestone: milestones.indexOf(state.streak) !== -1
        };
      }

      // Wrong answer: stay on this question.
      var firstMiss = !state.missedThisTime;
      if (firstMiss && state.phase === 'main') {
        state.missed.push(q);
        state.bonus.push(q);
      }
      state.missedThisTime = true;
      if (state.eliminated.indexOf(value) === -1) state.eliminated.push(value);
      var lostStreak = state.streak;
      state.streak = 0;
      return { correct: false, firstMiss: firstMiss, lostStreak: lostStreak, streak: 0 };
    }

    function advance() {
      if (state.done) return { status: 'done' };
      state.index++;
      state.missedThisTime = false;
      state.eliminated = [];
      if (state.index < list().length) return { status: 'next' };

      if (state.phase === 'main' && state.bonus.length > 0) {
        state.phase = 'bonus';
        state.bonus = MG.questions.shuffle(state.bonus, rand);
        state.index = 0;
        return { status: 'bonus', count: state.bonus.length };
      }
      state.done = true;
      return { status: 'done' };
    }

    function summary() {
      var total = state.main.length;
      var frac = total ? state.firstTryCorrect / total : 0;
      var th = cfg.starThresholds || { three: 0.9, two: 0.7 };
      var stars = frac >= th.three ? 3 : frac >= th.two ? 2 : 1;
      return {
        total: total,
        firstTryCorrect: state.firstTryCorrect,
        fraction: frac,
        stars: stars,
        bestStreak: state.bestStreak,
        missed: state.missed.slice()
      };
    }

    return {
      current: current,
      submit: submit,
      advance: advance,
      summary: summary,
      isDone: function () { return state.done; },
      streak: function () { return state.streak; }
    };
  }

  return { create: create };
})();
