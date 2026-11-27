"""Genera la locución de un video y los tiempos de cada palabra.

Uso: python3 voz.py videos/01-xxx/guion.json
Sintaxis del guion: cada línea es texto normal; un token {mostrar|decir#clave}
se muestra en subtítulos como "mostrar", se pronuncia "decir" y queda marcado
con "clave" para sincronizar animaciones/efectos. Ej: {$99.000|noventa y nueve mil pesos#precio}
"""
import json, os, re, sys
import numpy as np, soundfile as sf, pyworld as pw
from kokoro_onnx import Kokoro

MODELOS = os.environ.get('KOKORO_DIR', os.path.expanduser('~/kokoro'))
VOCES = {  # voz kokoro -> tono objetivo (Hz)
    'em_santa': 150, 'em_alex': 145, 'ef_dora': 212,
}

def tokens(linea):
    out = []
    for m in re.finditer(r'\{([^}|#]+)(?:\|([^}#]+))?(?:#(\w+))?\}|(\S+)', linea):
        if m.group(4):
            out.append({'show': m.group(4), 'say': m.group(4), 'key': None})
        else:
            show = m.group(1).strip(); say = (m.group(2) or show).strip()
            out.append({'show': show, 'say': say, 'key': m.group(3)})
    return out

def prosodia(x, sr, objetivo, exp=1.25):
    x = x.astype(np.float64)
    f0, t = pw.harvest(x, sr, f0_floor=70, f0_ceil=450, frame_period=5)
    sp = pw.cheaptrick(x, f0, t, sr); ap = pw.d4c(x, f0, t, sr)
    v = f0 > 0; med = np.median(f0[v])
    n = f0.copy(); n[v] = objetivo * (f0[v] / med) ** exp
    y = pw.synthesize(n, sp, ap, sr, frame_period=5)
    return y / np.max(np.abs(y)) * 0.9

def alinear(x, sr, toks, o):
    """Tiempos aproximados por palabra usando las pausas reales del audio."""
    env = np.convolve(np.abs(x), np.ones(int(sr * .02)) / int(sr * .02), 'same')
    act = env > 0.02
    on = np.where(act)[0]; a, b = on[0], on[-1]
    # silencios internos > 110 ms
    gaps = []; i = a
    while i < b:
        if not act[i]:
            j = i
            while j < b and not act[j]: j += 1
            if (j - i) / sr > 0.11: gaps.append(((i + j) / 2 / sr, (j - i)))
            i = j
        else: i += 1
    # frases separadas por puntuación
    frases = [[]]
    for k, tk in enumerate(toks):
        frases[-1].append(k)
        if re.search(r'[,.;:!?…]$', tk['say']) and k < len(toks) - 1: frases.append([])
    bordes = [a / sr]
    if len(frases) > 1 and len(gaps) >= len(frases) - 1:
        g = sorted(sorted(gaps, key=lambda q: -q[1])[:len(frases) - 1])
        bordes += [q[0] for q in g]
    else:
        tot = sum(len(t['say']) for t in toks); acc = 0
        for f in frases[:-1]:
            acc += sum(len(toks[k]['say']) + 1 for k in f); bordes.append(a / sr + (b - a) / sr * acc / tot)
    bordes.append(b / sr)
    res = []
    for fi, f in enumerate(frases):
        s, e = bordes[fi], bordes[fi + 1]
        w = np.array([len(re.sub(r'\W', '', toks[k]['say'])) + 1.2 for k in f], float)
        c = np.concatenate([[0], np.cumsum(w)]) / w.sum()
        for j, k in enumerate(f):
            res.append((k, o + s + c[j] * (e - s), o + s + c[j + 1] * (e - s)))
    return res

def main(ruta):
    g = json.load(open(ruta)); d = os.path.dirname(ruta)
    voz = g.get('voz', 'em_santa'); vel = g.get('velocidad', 1.12)
    k = Kokoro(f'{MODELOS}/kokoro-v1.0.onnx', f'{MODELOS}/voices-v1.0.bin')
    SR = 24000; t = g.get('inicio', 0.35); pistas = []; words = []; lines = []
    for li, L in enumerate(g['lineas']):
        L = L if isinstance(L, dict) else {'texto': L}
        toks = tokens(L['texto'])
        audio, sr = k.create(' '.join(x['say'] for x in toks), voice=L.get('voz', voz),
                             speed=L.get('velocidad', vel), lang='es')
        v_ = L.get('voz', voz); suave = v_.startswith('ef_')
        audio = prosodia(audio, sr, VOCES.get(v_, 158), 1.12 if suave else g.get('expresion', 1.32))
        if 'en' in L: t = L['en']
        pistas.append((t, audio))
        for kk, s, e in alinear(audio, sr, toks, t):
            words.append({'w': toks[kk]['show'], 't': round(s, 3), 'e': round(e, 3), 'line': li, 'key': toks[kk]['key']})
        lines.append({'t': round(t, 3), 'e': round(t + len(audio) / sr, 3)})
        t += len(audio) / sr + L.get('pausa', g.get('pausa', 0.3))
    dur = round(lines[-1]['e'] + g.get('cola', 2.0), 2)
    pista = np.zeros(int(dur * SR))
    for o, a in pistas:
        s = int(o * SR); pista[s:s + len(a)] += a[:len(pista) - s]
    sf.write(f'{d}/voz.wav', pista / np.max(np.abs(pista)) * 0.9, SR)
    keys = {w['key']: w['t'] for w in words if w['key']}
    json.dump({'words': words, 'lines': lines, 'keys': keys, 'duration': dur}, open(f'{d}/tiempos.json', 'w'), ensure_ascii=False)
    open(f'{d}/tiempos.js', 'w').write('window.TL=' + json.dumps({'words': words, 'lines': lines, 'keys': keys, 'duration': dur}, ensure_ascii=False) + ';')
    print(ruta, 'duración', dur, 's', 'claves', keys)

if __name__ == '__main__':
    main(sys.argv[1])
