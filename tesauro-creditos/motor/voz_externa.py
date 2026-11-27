"""Usa una voz grabada afuera (ej. CapCut) en lugar de la voz generada.

guion.json -> "audio_externo": {"archivo": "voz-capcut.wav", "cortes": [4.95, 7.6, ...]}
  cortes = segundos aproximados (en el audio original) donde empieza cada línea a partir de la 2.ª.
Genera voz.wav + tiempos.json/js igual que voz.py, con el texto del guion para los subtítulos.
"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
sys.path.insert(0, os.path.dirname(__file__))
from voz import tokens, alinear

def main(ruta):
    g = json.load(open(ruta)); d = os.path.dirname(ruta); ext = g['audio_externo']
    x, sr = sf.read(os.path.join(d, ext['archivo']))
    if x.ndim > 1: x = x.mean(1)
    if sr != 24000: x = resample_poly(x, 24000, sr); sr = 24000
    x = x / np.max(np.abs(x)) * 0.9
    w = int(sr * .02); env = np.convolve(np.abs(x), np.ones(w) / w, 'same')
    thr = max(0.02, np.percentile(env, 60) * 0.15)
    act = env > thr; idx = np.where(act)[0]
    first, last = idx[0], idx[-1]
    starts = [first]; ends = []
    for b in ext['cortes']:
        a0, a1 = int((b - .5) * sr), int((b + .35) * sr)
        k = int(.06 * sr); seg = np.convolve(env[a0:a1], np.ones(k) / k, 'same')
        m = a0 + int(np.argmin(seg))
        prev = idx[idx < m]; nxt = idx[idx >= m]
        ends.append(prev[-1] if len(prev) else m); starts.append(nxt[0] if len(nxt) else m)
    ends.append(last)
    lead = g.get('inicio', .35); off = first / sr - lead
    words, lines = [], []
    for li, L in enumerate(g['lineas']):
        L = L if isinstance(L, dict) else {'texto': L}
        toks = tokens(L['texto'])
        s0 = max(0, starts[li] - int(.04 * sr)); e0 = min(len(x), ends[li] + int(.04 * sr))
        for kk, s, e in alinear(x[s0:e0], sr, toks, s0 / sr - off):
            words.append({'w': toks[kk]['show'], 't': round(s, 3), 'e': round(e, 3), 'line': li, 'key': toks[kk]['key']})
        lines.append({'t': round(starts[li] / sr - off, 3), 'e': round(ends[li] / sr - off, 3)})
    dur = round(lines[-1]['e'] + g.get('cola', 2.0), 2)
    out = np.zeros(int(dur * sr)); s = int(off * sr)
    if s >= 0: seg = x[s:s + len(out)]; out[:len(seg)] = seg
    else: out[-s:-s + len(x)] = x[:len(out) + s]
    out[int((lines[-1]['e'] + .15) * sr):] *= 0  # silencio después de la última frase
    sf.write(f'{d}/voz.wav', out, sr)
    keys = {w['key']: w['t'] for w in words if w['key']}
    data = {'words': words, 'lines': lines, 'keys': keys, 'duration': dur}
    json.dump(data, open(f'{d}/tiempos.json', 'w'), ensure_ascii=False)
    open(f'{d}/tiempos.js', 'w').write('window.TL=' + json.dumps(data, ensure_ascii=False) + ';')
    print(ruta, 'voz externa · duración', dur, '· líneas', [(l['t'], l['e']) for l in lines])

if __name__ == '__main__':
    main(sys.argv[1])
