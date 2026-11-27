# Ajuste tonal suave: iguala el balance de graves/agudos al de la referencia (±6 dB, curva suavizada)
import sys,numpy as np,soundfile as sf
from scipy.signal import welch,firwin2,fftconvolve
ref,sr0=sf.read(sys.argv[1]); files=sys.argv[2:]
if ref.ndim>1: ref=ref.mean(1)
gen=np.concatenate([sf.read(f)[0] for f in files]); sr=sf.read(files[0])[1]
from scipy.signal import resample_poly
ref=resample_poly(ref,sr,sr0) if sr0!=sr else ref
fr,pr=welch(ref,sr,nperseg=2048); fg,pg=welch(gen,sr,nperseg=2048)
g=10*np.log10((pr+1e-12)/(pg+1e-12)); g-=np.median(g[(fr>300)&(fr<3000)])
k=np.ones(25)/25; g=np.convolve(g,k,'same'); g=np.clip(g,-6,6); g[fr<80]=-12; g[fr>min(7600,sr/2-200)]=0
h=firwin2(1025,fr/(sr/2),10**(g/20))
for f in files:
    x,_=sf.read(f); y=fftconvolve(x,h,'same'); sf.write(f.replace('_p.wav','_eq.wav'),y/np.max(np.abs(y))*0.9,sr)
print('eq bands dB @250/1k/3k/6k:',[round(float(np.interp(q,fr,g)),1) for q in (250,1000,3000,6000)])
