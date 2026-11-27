"""Música de fondo + efectos sincronizados con la voz.
Uso: python3 musica.py videos/01-xxx/guion.json  (requiere tiempos.json)
guion.json -> "musica": {"bpm": 100, "estilo": "pop"|"trap"|"chill"}
            "sfx": [{"tipo": "boom", "clave": "precio", "dt": 0, "g": 1}, {"tipo":"pop","t":3.2}]
            "whoosh_lineas": true  (whoosh suave al iniciar cada línea)
tipos: whoosh, boom, ding, pop, click, teclas (n clics), caja (cha-ching), notif, error, swipe
"""
import json, os, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

SR = 44100
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
mtof = lambda m: 440 * 2 ** ((m - 69) / 12)

ESTILOS = {
    # acordes (midi) y raíces del bajo
    'pop':   ([[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]], [48, 45, 41, 43]),
    'trap':  ([[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]], [45, 41, 48, 43]),
    'chill': ([[62, 65, 69, 72], [58, 62, 65, 69], [60, 64, 67, 70], [57, 60, 64, 67]], [50, 46, 48, 45]),
}

def main(ruta):
    g = json.load(open(ruta)); d = os.path.dirname(ruta)
    tl = json.load(open(f'{d}/tiempos.json')); END = tl['duration']
    N = int(END * SR); t = np.arange(N) / SR
    rng = np.random.default_rng(11)
    mus = np.zeros(N); sfx = np.zeros(N)
    def add(buf, x, at, gain=1.0):
        s = int(at * SR)
        if s >= N or s + len(x) <= 0: return
        if s < 0: x = x[-s:]; s = 0
        n = min(len(x), N - s); buf[s:s + n] += gain * x[:n]
    M = g.get('musica', {}); bpm = M.get('bpm', 100); estilo = M.get('estilo', 'pop')
    chords, roots = ESTILOS[estilo]; beat = 60 / bpm; bar = 4 * beat
    for b in range(int(END / bar) + 1):
        c = chords[b % 4]; st = b * bar; L = int(bar * SR); tt = np.arange(L) / SR
        env = np.minimum(1, tt / 0.25) * np.exp(-tt * 0.3)
        pad = sum(np.sin(2 * np.pi * mtof(m) * tt * (1 + dd)) for m in c for dd in (-0.004, 0.004))
        add(mus, lp(pad * env, 2500) * 0.03, st)
        # pluck / arpegio
        patt = [0, 2, 1, 3, 2, 1, 3, 2] if estilo != 'chill' else [0, 2, 3, 2]
        step = bar / len(patt)
        for k, p in enumerate(patt):
            L2 = int(0.35 * SR); t2 = np.arange(L2) / SR; f = mtof(c[p] + 12)
            tone = np.sign(np.sin(2 * np.pi * f * t2)) * 0.3 + np.sin(2 * np.pi * f * t2)
            add(mus, lp(tone, 3500) * np.exp(-t2 * 9) * 0.045, st + k * step)
        # bajo
        offs = (0, 1.5 * beat, 2.5 * beat) if estilo == 'trap' else (0, beat, 2 * beat, 3 * beat)
        for off in offs:
            L3 = int(beat * (1.3 if estilo == 'trap' else 0.9) * SR); t3 = np.arange(L3) / SR; f = mtof(roots[b % 4] - 12)
            add(mus, np.tanh(2 * np.sin(2 * np.pi * f * t3)) * np.exp(-t3 * (2 if estilo == 'trap' else 5)) * 0.2, st + off)
        for k in range(4):
            tb = st + k * beat
            kick = (k in (0, 2)) if estilo != 'pop' else True
            if kick:
                L4 = int(0.35 * SR); t4 = np.arange(L4) / SR; ph = 2 * np.pi * np.cumsum(45 + 120 * np.exp(-t4 * 32)) / SR
                add(mus, np.sin(ph) * np.exp(-t4 * 10) * 0.5, tb)
            if k in (1, 3):
                L5 = int(0.22 * SR); n5 = bp(rng.standard_normal(L5), 1000, 6000) * np.exp(-np.arange(L5) / SR * 22)
                add(mus, n5 * 0.22, tb)
            subdiv = 4 if estilo == 'trap' else 2
            for h in range(subdiv):
                L6 = int(0.04 * SR); n6 = hp(rng.standard_normal(L6), 7500) * np.exp(-np.arange(L6) / SR * 100)
                add(mus, n6 * (0.06 if h % 2 == 0 else 0.035), tb + h * beat / subdiv)
    cut = np.clip(t / 1.2, 0, 1); mus = lp(mus, 700) * (1 - cut) + mus * cut
    mus *= np.clip((END - t) / 1.0, 0, 1)

    def whoosh(dur=0.6, gain=0.3, rev=False):
        L = int(dur * SR); tt = np.arange(L) / SR; e = np.sin(np.pi * tt / dur) ** 2
        x = bp(rng.standard_normal(L), 300, 3500) * e * gain
        return x[::-1] if rev else x
    def boom(gain=0.7):
        L = int(1.2 * SR); tt = np.arange(L) / SR; ph = 2 * np.pi * np.cumsum(35 + 85 * np.exp(-tt * 12)) / SR
        return (np.sin(ph) * np.exp(-tt * 3) + lp(rng.standard_normal(L), 400) * np.exp(-tt * 8) * .5) * gain
    def ding(f=1760, gain=0.22):
        L = int(1.4 * SR); tt = np.arange(L) / SR
        return (np.sin(2 * np.pi * f * tt) + .5 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 4)) * np.exp(-tt * 3) * gain
    def pop(gain=0.35):
        L = int(.12 * SR); tt = np.arange(L) / SR; ph = 2 * np.pi * np.cumsum(300 + 900 * np.exp(-tt * 60)) / SR
        return np.sin(ph) * np.exp(-tt * 35) * gain
    def click(gain=0.18):
        L = int(.03 * SR); return hp(rng.standard_normal(L), 2500) * np.exp(-np.arange(L) / SR * 200) * gain
    def caja(gain=0.3):  # cha-ching
        x = np.zeros(int(1.2 * SR))
        a = hp(rng.standard_normal(int(.08 * SR)), 3000) * np.exp(-np.arange(int(.08 * SR)) / SR * 50)
        x[:len(a)] += a * .6
        b = ding(2637, .3) + ding(3520, .2); x[int(.09 * SR):int(.09 * SR) + len(b)] += b[:len(x) - int(.09 * SR)]
        return x * gain / .3
    def notif(gain=0.25):
        x = np.zeros(int(.6 * SR)); a = ding(1318, .25)[:int(.3 * SR)]; b = ding(1760, .25)
        x[:len(a)] += a; x[int(.12 * SR):] += b[:len(x) - int(.12 * SR)]
        return x * gain / .25
    def error(gain=0.25):
        L = int(.35 * SR); tt = np.arange(L) / SR
        return np.sign(np.sin(2 * np.pi * 180 * tt)) * np.exp(-tt * 6) * gain * .5
    def swipe(gain=0.25): return whoosh(.3, gain)
    FX = dict(whoosh=whoosh, boom=boom, ding=ding, pop=pop, click=click, caja=caja, notif=notif, error=error, swipe=swipe)

    if g.get('whoosh_lineas', True):
        for i, L in enumerate(tl['lines'][1:], 1): add(sfx, whoosh(.5, .18), L['t'] - .3)
    add(sfx, whoosh(.8, .28, True), 0)
    for e in g.get('sfx', []):
        at = e['t'] if 't' in e else (tl['keys'][e['clave']] if 'clave' in e else tl['lines'][e['linea']]['t'])
        at += e.get('dt', 0); tipo = e['tipo']
        if tipo == 'teclas':
            for k in range(e.get('n', 6)): add(sfx, click(), at + k * e.get('cada', .1))
        else:
            add(sfx, FX[tipo](), at, e.get('g', 1.0))
    sf.write(f'{d}/musica.wav', np.stack([mus, mus], 1) / np.max(np.abs(mus)) * .8, SR)
    m = np.max(np.abs(sfx)) or 1
    sf.write(f'{d}/sfx.wav', np.stack([sfx, sfx], 1) / m * .8, SR)

if __name__ == '__main__':
    main(sys.argv[1])
