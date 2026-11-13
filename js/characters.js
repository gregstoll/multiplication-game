/*
 * The buddies, drawn as inline SVG.
 * Every buddy shares the same face parts (eyes, mouths, cheeks, sparkles);
 * CSS shows or hides them depending on the mood class on the wrapper.
 *
 *   MG.characters.render(el, 'narwhal');
 *   MG.characters.setMood(el, 'happy');   // 'neutral' | 'happy' | 'oops' | 'party'
 */
window.MG = window.MG || {};

MG.characters = (function () {
  'use strict';

  var INK = '#3b2a4a';

  var NAMES = { unicorn: 'Unicorn', penguin: 'Penguin', narwhal: 'Narwhal', phoenix: 'Phoenix', dino: 'Dino' };

  // Face parts, positioned per character.
  function face(p) {
    var lx = 100 - p.eyeDx, rx = 100 + p.eyeDx, ey = p.eyeY, my = p.mouthY;
    return '' +
      // cheeks
      '<g class="cheeks" fill="#ff9fbf" opacity="0.65">' +
        '<ellipse cx="' + (100 - p.cheekDx) + '" cy="' + p.cheekY + '" rx="10" ry="6"/>' +
        '<ellipse cx="' + (100 + p.cheekDx) + '" cy="' + p.cheekY + '" rx="10" ry="6"/>' +
      '</g>' +
      // open eyes (blink by squashing this group)
      '<g class="eyes-open">' +
        '<circle cx="' + lx + '" cy="' + ey + '" r="9" fill="' + INK + '"/>' +
        '<circle cx="' + rx + '" cy="' + ey + '" r="9" fill="' + INK + '"/>' +
        '<circle cx="' + (lx + 3) + '" cy="' + (ey - 3) + '" r="3.2" fill="#fff"/>' +
        '<circle cx="' + (rx + 3) + '" cy="' + (ey - 3) + '" r="3.2" fill="#fff"/>' +
      '</g>' +
      // happy eyes ^ ^
      '<g class="eyes-happy" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round">' +
        '<path d="M' + (lx - 9) + ',' + (ey + 3) + ' Q' + lx + ',' + (ey - 10) + ' ' + (lx + 9) + ',' + (ey + 3) + '"/>' +
        '<path d="M' + (rx - 9) + ',' + (ey + 3) + ' Q' + rx + ',' + (ey - 10) + ' ' + (rx + 9) + ',' + (ey + 3) + '"/>' +
      '</g>' +
      // mouths
      '<path class="mouth-neutral" d="M' + (100 - 9) + ',' + my + ' Q100,' + (my + 7) + ' ' + (100 + 9) + ',' + my + '" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>' +
      '<g class="mouth-smile">' +
        '<path d="M' + (100 - 14) + ',' + (my - 2) + ' Q100,' + (my + 22) + ' ' + (100 + 14) + ',' + (my - 2) + ' Z" fill="' + INK + '"/>' +
        '<path d="M' + (100 - 7) + ',' + (my + 8) + ' Q100,' + (my + 2) + ' ' + (100 + 7) + ',' + (my + 8) + ' Q100,' + (my + 15) + ' ' + (100 - 7) + ',' + (my + 8) + ' Z" fill="#ff7a9c"/>' +
      '</g>' +
      '<ellipse class="mouth-oops" cx="100" cy="' + (my + 3) + '" rx="6" ry="7" fill="' + INK + '"/>';
  }

  function sparkles() {
    function star(x, y, s, c) {
      // Position on the outer <g>, so the CSS twinkle animation on the <path> doesn't override it.
      return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path fill="' + c + '" ' +
        'd="M0,-10 L2.5,-2.5 L10,0 L2.5,2.5 L0,10 L-2.5,2.5 L-10,0 L-2.5,-2.5 Z"/></g>';
    }
    return '<g class="sparkles">' +
      star(24, 40, 1.3, '#ffd23f') + star(178, 52, 1.1, '#ff8ccf') +
      star(14, 120, 0.9, '#7ad7f0') + star(188, 132, 1.4, '#ffd23f') +
      star(40, 186, 0.8, '#b18cff') + star(166, 188, 1.0, '#7ee0a8') +
    '</g>';
  }

  var BODIES = {
    unicorn:
      // mane at the back
      '<g>' +
        '<circle cx="52" cy="78" r="20" fill="#ff9fd0"/><circle cx="44" cy="104" r="18" fill="#ffd96b"/>' +
        '<circle cx="46" cy="130" r="16" fill="#8fe3c0"/><circle cx="56" cy="152" r="14" fill="#9fc8ff"/>' +
        '<circle cx="150" cy="78" r="18" fill="#c9a8ff"/><circle cx="158" cy="104" r="15" fill="#ff9fd0"/>' +
      '</g>' +
      // ears
      '<path d="M58,70 L52,30 L84,56 Z" fill="#fff" stroke="#d9c8f0" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M142,70 L148,30 L116,56 Z" fill="#fff" stroke="#d9c8f0" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M62,62 L58,40 L76,55 Z" fill="#ffc6e0"/><path d="M138,62 L142,40 L124,55 Z" fill="#ffc6e0"/>' +
      // head
      '<ellipse cx="100" cy="112" rx="58" ry="56" fill="#fff" stroke="#d9c8f0" stroke-width="3"/>' +
      // snout
      '<ellipse cx="100" cy="146" rx="36" ry="22" fill="#ffe6f2"/>' +
      '<ellipse cx="88" cy="140" rx="3" ry="4" fill="#e6a8c6"/><ellipse cx="112" cy="140" rx="3" ry="4" fill="#e6a8c6"/>' +
      // forelock
      '<circle cx="84" cy="62" r="13" fill="#ff9fd0"/><circle cx="100" cy="58" r="12" fill="#ffd96b"/><circle cx="116" cy="62" r="13" fill="#c9a8ff"/>' +
      // horn
      '<path d="M100,8 L88,52 L112,52 Z" fill="#ffd23f" stroke="#e8a900" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M92,40 L108,34 M94,28 L105,24" stroke="#e8a900" stroke-width="2.5" stroke-linecap="round"/>' +
      face({ eyeDx: 24, eyeY: 104, cheekDx: 40, cheekY: 124, mouthY: 152 }),

    penguin:
      // feet
      '<ellipse cx="78" cy="188" rx="16" ry="8" fill="#ffa53a"/><ellipse cx="122" cy="188" rx="16" ry="8" fill="#ffa53a"/>' +
      // flippers
      '<ellipse cx="38" cy="128" rx="13" ry="34" transform="rotate(18 38 128)" fill="#2b3a67"/>' +
      '<ellipse cx="162" cy="128" rx="13" ry="34" transform="rotate(-18 162 128)" fill="#2b3a67"/>' +
      // body
      '<ellipse cx="100" cy="112" rx="64" ry="76" fill="#2b3a67"/>' +
      // white face + belly
      '<path d="M100,70 C78,48 44,62 48,98 C50,118 56,138 60,150 C68,178 132,178 140,150 C144,138 150,118 152,98 C156,62 122,48 100,70 Z" fill="#fff"/>' +
      // beak
      '<path d="M88,112 L112,112 L100,126 Z" fill="#ffa53a" stroke="#e8851a" stroke-width="2" stroke-linejoin="round"/>' +
      // little hat tuft
      '<path d="M96,38 Q100,24 108,34" fill="none" stroke="#2b3a67" stroke-width="6" stroke-linecap="round"/>' +
      face({ eyeDx: 24, eyeY: 96, cheekDx: 38, cheekY: 116, mouthY: 136 }),

    narwhal:
      // tail
      '<path d="M160,140 Q186,128 190,104 Q178,114 170,112 Q182,98 178,80 Q166,104 150,120 Z" fill="#6fb6e8"/>' +
      // tusk
      '<path d="M108,52 L134,4 L118,56 Z" fill="#fff6dc" stroke="#e0cfa0" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M112,46 L122,40 M117,34 L126,28 M122,22 L129,18" stroke="#e0cfa0" stroke-width="2.5" stroke-linecap="round"/>' +
      // body
      '<ellipse cx="100" cy="120" rx="72" ry="62" fill="#8fd0f5"/>' +
      // belly
      '<ellipse cx="100" cy="148" rx="50" ry="32" fill="#e6f6ff"/>' +
      // spots
      '<g fill="#6fb6e8"><circle cx="64" cy="80" r="6"/><circle cx="80" cy="70" r="4"/><circle cx="140" cy="78" r="5"/><circle cx="152" cy="94" r="4"/><circle cx="56" cy="98" r="3.5"/></g>' +
      // flipper
      '<ellipse cx="48" cy="150" rx="18" ry="9" transform="rotate(-30 48 150)" fill="#6fb6e8"/>' +
      face({ eyeDx: 26, eyeY: 116, cheekDx: 42, cheekY: 134, mouthY: 140 }),

    phoenix:
      // tail flames
      '<path d="M84,168 C70,180 66,192 72,198 C80,192 88,184 94,174 Z" fill="#ff5a3c"/>' +
      '<path d="M116,168 C130,180 134,192 128,198 C120,192 112,184 106,174 Z" fill="#ff5a3c"/>' +
      '<path d="M100,172 C92,184 94,194 100,200 C106,194 108,184 100,172 Z" fill="#ffb12b"/>' +
      // wings (flame-shaped), outer red with a golden inner flame
      '<path d="M52,128 C22,124 8,96 14,70 C22,88 30,92 36,92 C26,76 28,56 38,44 C42,68 54,84 66,100 Z" fill="#ff5a3c"/>' +
      '<path d="M54,120 C34,116 26,100 28,86 C36,98 44,100 50,100 C44,90 46,78 50,70 C54,86 60,96 66,104 Z" fill="#ffb12b"/>' +
      '<path d="M148,128 C178,124 192,96 186,70 C178,88 170,92 164,92 C174,76 172,56 162,44 C158,68 146,84 134,100 Z" fill="#ff5a3c"/>' +
      '<path d="M146,120 C166,116 174,100 172,86 C164,98 156,100 150,100 C156,90 154,78 150,70 C146,86 140,96 134,104 Z" fill="#ffb12b"/>' +
      // crest flames
      '<path d="M100,62 C86,46 90,24 100,8 C110,24 114,46 100,62 Z" fill="#ff5a3c"/>' +
      '<path d="M100,60 C93,48 95,34 100,24 C105,34 107,48 100,60 Z" fill="#ffd23f"/>' +
      '<path d="M88,64 C74,56 68,40 72,26 C80,40 88,48 94,58 Z" fill="#ff8a3d"/>' +
      '<path d="M112,64 C126,56 132,40 128,26 C120,40 112,48 106,58 Z" fill="#ff8a3d"/>' +
      // body
      '<ellipse cx="100" cy="118" rx="58" ry="62" fill="#ff7a45"/>' +
      // face + belly
      '<ellipse cx="100" cy="128" rx="42" ry="46" fill="#ffe0a8"/>' +
      // belly feather marks
      '<path d="M88,156 Q92,162 96,156 M104,156 Q108,162 112,156 M96,166 Q100,172 104,166" fill="none" stroke="#f5b65e" stroke-width="2.5" stroke-linecap="round"/>' +
      // beak
      '<path d="M90,110 L110,110 L100,124 Z" fill="#ffc21a" stroke="#e09a00" stroke-width="2" stroke-linejoin="round"/>' +
      face({ eyeDx: 22, eyeY: 96, cheekDx: 34, cheekY: 114, mouthY: 136 }),

    dino:
      // tail
      '<path d="M146,160 C176,162 192,146 196,122 C184,138 170,144 148,140 Z" fill="#4fb860"/>' +
      // back spikes
      '<g fill="#ffb547" stroke="#f0962a" stroke-width="2.5" stroke-linejoin="round">' +
        '<path d="M58,82 L54,54 L78,66 Z"/>' +
        '<path d="M80,62 L86,32 L104,56 Z"/>' +
        '<path d="M106,56 L124,30 L128,62 Z"/>' +
        '<path d="M132,66 L156,52 L146,84 Z"/>' +
      '</g>' +
      // feet
      '<ellipse cx="74" cy="182" rx="18" ry="10" fill="#4fb860"/><ellipse cx="126" cy="182" rx="18" ry="10" fill="#4fb860"/>' +
      '<g fill="#fff"><circle cx="64" cy="184" r="2.5"/><circle cx="72" cy="187" r="2.5"/><circle cx="128" cy="187" r="2.5"/><circle cx="136" cy="184" r="2.5"/></g>' +
      // body
      '<ellipse cx="100" cy="118" rx="60" ry="66" fill="#6fd17c"/>' +
      // belly
      '<ellipse cx="100" cy="146" rx="38" ry="32" fill="#dcf7c8"/>' +
      '<path d="M78,140 Q100,146 122,140 M80,154 Q100,160 120,154" fill="none" stroke="#bfe8a6" stroke-width="2.5" stroke-linecap="round"/>' +
      // spots
      '<g fill="#56bd68"><circle cx="60" cy="100" r="6"/><circle cx="68" cy="84" r="3.5"/><circle cx="142" cy="96" r="5"/><circle cx="136" cy="112" r="3"/></g>' +
      // little arms
      '<ellipse cx="58" cy="140" rx="8" ry="13" transform="rotate(30 58 140)" fill="#5cc46a"/>' +
      '<ellipse cx="142" cy="140" rx="8" ry="13" transform="rotate(-30 142 140)" fill="#5cc46a"/>' +
      // nostrils
      '<circle cx="94" cy="116" r="2.2" fill="#3f9a4e"/><circle cx="106" cy="116" r="2.2" fill="#3f9a4e"/>' +
      face({ eyeDx: 24, eyeY: 98, cheekDx: 38, cheekY: 116, mouthY: 126 })
  };

  function svg(kind) {
    return '<svg class="buddy-svg" viewBox="0 0 200 200" role="img" aria-label="' + NAMES[kind] + '">' +
      '<g class="buddy-body">' + BODIES[kind] + '</g>' + sparkles() + '</svg>';
  }

  function render(el, kind) {
    el.innerHTML = svg(kind);
    el.dataset.kind = kind;
    setMood(el, 'neutral');
  }

  var timers = new WeakMap();

  /** Set a mood. If `ms` is given, go back to neutral afterwards. */
  function setMood(el, mood, ms) {
    el.classList.remove('mood-neutral', 'mood-happy', 'mood-oops', 'mood-party');
    void el.offsetWidth; // restart CSS animations
    el.classList.add('mood-' + mood);
    clearTimeout(timers.get(el));
    if (ms) timers.set(el, setTimeout(function () { setMood(el, 'neutral'); }, ms));
  }

  return { svg: svg, render: render, setMood: setMood, NAMES: NAMES, KINDS: ['unicorn', 'penguin', 'narwhal', 'phoenix', 'dino'] };
})();
