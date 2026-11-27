// Base común: tiempos, ayudas de animación, fondo, marca y subtítulos.
const TL = window.TL, W = TL.words, D = TL.duration;
window.DURATION = D;
const $ = id => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = x => 1 - Math.pow(1 - clamp(x), 3);
const easeIO = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const back = (x, c = 1.9) => { x = clamp(x); return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const K = k => { if (!(k in TL.keys)) throw new Error('clave ' + k); return TL.keys[k]; };
const LS = i => TL.lines[i].t, LE = i => TL.lines[i].e;
const win = (t, a, b, f = .25) => clamp((t - a) / f) * clamp((b - t) / f);
function pop(el, t, t0, dur = .45, dy = 80, s0 = .6) {
  const p = (t - t0) / dur; el.style.opacity = clamp(p * 2.2);
  el.style.transform = `translateY(${(1 - ease(p)) * dy}px) scale(${s0 + (1 - s0) * back(p)})`;
  return p;
}
function show(el, t, t0, t1, dur = .45, dy = 80, s0 = .6) {
  pop(el, t, t0, dur, dy, s0);
  if (t1 !== undefined) el.style.opacity = Math.min(+el.style.opacity, clamp((t1 - t) / .25));
}
let _seed = 5; const rnd = () => (_seed = (_seed * 9301 + 49297) % 233280) / 233280;

// ---- estructura base
(function () {
  const st = $('stage');
  st.insertAdjacentHTML('afterbegin', `<div id="bg"></div>`);
  const bg = $('bg');
  for (let i = 0; i < 6; i++) bg.insertAdjacentHTML('beforeend', `<div class="ray" data-a="${i * 30}"></div>`);
  window._dots = [...Array(26)].map(() => {
    const d = document.createElement('div'); d.className = 'dot'; const s = 10 + rnd() * 50;
    d.style.width = d.style.height = s + 'px'; d.style.filter = `blur(${1 + rnd() * 5}px)`; bg.appendChild(d);
    return { d, x: rnd() * 1280, y: rnd() * 2120, v: 20 + rnd() * 50, ph: rnd() * 6, a: .15 + rnd() * .45 };
  });
  if (!window.NO_BRAND) st.insertAdjacentHTML('beforeend', `<div id="brand"><div class="logo">T</div><b>TESAURO</b><span>Créditos</span></div>`);
  st.insertAdjacentHTML('beforeend', `<div id="cap"></div><div id="legal"></div><div id="vig"></div><div id="flash"></div>`);
  if (window.LEGAL) $('legal').textContent = window.LEGAL;
})();

// ---- subtítulos (grupos de hasta 3 palabras)
const CH = []; { let cur = [];
  W.forEach((w, i) => { cur.push(i); const nx = W[i + 1];
    if (cur.length >= (window.CAP_MAX || 3) || /[,.?!:;]$/.test(w.w) || !nx || nx.line !== w.line) { CH.push(cur); cur = []; } }); }
let _lastCh = -2;
function captions(t) {
  let ci = -1; CH.forEach((c, i) => { if (t >= W[c[0]].t - .04) ci = i; });
  const cap = $('cap');
  if (ci < 0 || (window.HIDE_CAPS && window.HIDE_CAPS(t))) { cap.style.opacity = 0; return; }
  const c = CH[ci], last = W[c[c.length - 1]], nx = CH[ci + 1];
  const until = nx && W[nx[0]].line === last.line ? Infinity : last.e + .5;
  cap.style.opacity = t < until ? 1 : 0;
  if (ci !== _lastCh) { cap.innerHTML = c.map(i => `<span>${W[i].w}</span>`).join(''); _lastCh = ci; }
  [...cap.children].forEach((s, k) => {
    const w = W[c[k]], p = (t - w.t) / .16;
    s.style.opacity = t >= w.t - .02 ? 1 : 0;
    s.style.transform = `scale(${t >= w.t ? .7 + .3 * back(p, 2.6) : .7}) rotate(${(k % 2 ? 1 : -1) * 1.5}deg)`;
    const active = t >= w.t && (k === c.length - 1 || t < W[c[k + 1]].t);
    s.className = active ? 'on' : (window.HI && window.HI.test(w.w) ? 'hi' : '');
  });
}

function base(t) {
  // fondo vivo
  document.querySelectorAll('.ray').forEach((r, i) => { r.style.transform = `rotate(${+r.dataset.a + t * 6}deg)`; });
  _dots.forEach(b => { const y = ((b.y - b.v * t) % 2120 + 2120) % 2120;
    b.d.style.transform = `translate(${b.x + Math.sin(t * .7 + b.ph) * 30}px,${y}px)`; b.d.style.opacity = b.a * (.6 + .4 * Math.sin(t * 2 + b.ph)); });
  $('flash').style.opacity = t < .2 ? 1 - t / .2 : 0;
  const br = $('brand'); if (br) br.style.opacity = clamp(t / .4);
  if (window.LEGAL_WIN) { const [a, b] = window.LEGAL_WIN; $('legal').style.opacity = win(t, a, b) * .9; }
  captions(t);
}
function flash(t, at, k = .7) { const f = $('flash'); if (t > at) f.style.opacity = Math.max(+f.style.opacity, k * Math.exp(-(t - at) * 10)); }
function punch(t, at, a = .06) { return t > at ? a * Math.exp(-(t - at) * 6) : 0; }
window.render = function (t) { base(t); window.scene && window.scene(t); };
