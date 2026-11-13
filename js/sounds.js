/*
 * Gentle sound effects made with the Web Audio API (no audio files needed,
 * so this works when opening index.html straight from disk).
 * Turned off entirely by MG.config.features.sounds = false.
 */
window.MG = window.MG || {};

MG.sounds = (function () {
  'use strict';

  var ctx = null;
  var muted = false;
  var MASTER = 0.18; // keep everything soft

  function enabled() { return MG.config.features.sounds && !muted; }

  /** Call from a tap/click handler: browsers only allow audio after a user gesture. */
  function unlock() {
    if (!MG.config.features.sounds) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!ctx) ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { ctx = null; }
  }

  // One soft note with a quick attack and a smooth fade-out (no clicks).
  function note(freq, start, dur, type, vol) {
    var t0 = ctx.currentTime + start;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(MASTER * (vol || 1), t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function play(fn) {
    if (!enabled() || !ctx) return;
    try { fn(); } catch (e) { /* never let sound break the game */ }
  }

  var C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, C6 = 1046.5, A4 = 440, E6 = 1318.5;

  return {
    unlock: unlock,
    setMuted: function (m) { muted = !!m; },
    isMuted: function () { return muted; },

    // "ding-ding": two quick rising xylophone-ish notes
    correct: function () { play(function () {
      note(E5, 0, 0.25, 'triangle'); note(C6, 0.09, 0.35, 'triangle');
    }); },

    // a soft, low "boop" — friendly, not a buzzer
    wrong: function () { play(function () {
      var t0 = ctx.currentTime, osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, t0);
      osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.22);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(MASTER * 0.8, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + 0.35);
    }); },

    // rising arpeggio for streak milestones
    milestone: function () { play(function () {
      [C5, E5, G5, C6].forEach(function (f, i) { note(f, i * 0.08, 0.3, 'triangle'); });
      note(E6, 0.34, 0.4, 'sine', 0.6);
    }); },

    // little chime for each summary star (pass 0, 1, 2 for rising pitch)
    star: function (i) { play(function () {
      var f = [G5, C6, E6][i] || C6;
      note(f, 0, 0.45, 'sine'); note(f * 2, 0.02, 0.3, 'sine', 0.25);
    }); },

    // gentle "here we go" for the start of a round / bonus round
    start: function () { play(function () {
      note(A4, 0, 0.18, 'triangle', 0.7); note(D5, 0.1, 0.18, 'triangle', 0.7); note(E5, 0.2, 0.3, 'triangle', 0.7);
    }); },

    // very quiet tick for button taps
    tap: function () { play(function () { note(1200, 0, 0.05, 'sine', 0.25); }); }
  };
})();
