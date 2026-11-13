/*
 * Pure question logic: building the question list, shuffling,
 * multiple-choice answers and cleaning up typed answers.
 * No DOM code here, so it can be tested on its own (see tests/tests.html).
 */
window.MG = window.MG || {};

MG.questions = (function () {
  'use strict';

  /** Fisher–Yates shuffle. Returns a new array. */
  function shuffle(arr, rand) {
    rand = rand || Math.random;
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /**
   * Build the shuffled question list for the selected numbers.
   * Each pair of factors appears once (2×8 and 8×2 are the same question),
   * shown in a random order.
   */
  function buildQuestions(selected, rand) {
    rand = rand || Math.random;
    var seen = {};
    var list = [];
    selected.forEach(function (n) {
      for (var k = 1; k <= 9; k++) {
        var lo = Math.min(n, k), hi = Math.max(n, k);
        var key = lo + 'x' + hi;
        if (seen[key]) continue;
        seen[key] = true;
        var flip = rand() < 0.5;
        list.push({ a: flip ? lo : hi, b: flip ? hi : lo, answer: lo * hi, key: key });
      }
    });
    return shuffle(list, rand);
  }

  /** Number of questions a set of selected numbers will produce. */
  function countQuestions(selected) {
    return buildQuestions(selected).length;
  }

  /**
   * Make `count` answer choices (including the right one) for a × b.
   * Wrong answers are believable: neighbouring facts, near misses, swapped digits.
   */
  function makeChoices(a, b, count, rand) {
    rand = rand || Math.random;
    count = count || 4;
    var answer = a * b;
    var pool = [
      a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b,
      answer + 1, answer - 1, answer + 2, answer - 2,
      answer + 10, answer - 10
    ];
    if (answer >= 10 && answer <= 99) {
      var s = String(answer);
      var swapped = Number(s[1] + s[0]);
      if (s[1] !== '0') pool.push(swapped);
    }

    var seen = {};
    seen[answer] = true;
    var candidates = [];
    pool.forEach(function (v) {
      if (v > 0 && v <= 100 && !seen[v]) { seen[v] = true; candidates.push(v); }
    });

    var wrong = shuffle(candidates, rand).slice(0, count - 1);

    // Top up with small nearby numbers if there weren't enough (e.g. 1 × 1).
    var step = 3;
    while (wrong.length < count - 1) {
      if (!seen[step]) { seen[step] = true; wrong.push(step); }
      step++;
    }

    return shuffle(wrong.concat([answer]), rand);
  }

  /**
   * Clean up a typed answer: keep digits only.
   * Returns a number, or null if there were no digits.
   */
  function parseTyped(text) {
    var digits = String(text == null ? '' : text).replace(/\D/g, '');
    if (digits === '') return null;
    return Number(digits);
  }

  return {
    shuffle: shuffle,
    buildQuestions: buildQuestions,
    countQuestions: countQuestions,
    makeChoices: makeChoices,
    parseTyped: parseTyped
  };
})();
