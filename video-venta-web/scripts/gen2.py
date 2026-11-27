import sys,json,numpy as np,soundfile as sf
from kokoro_onnx import Kokoro
k=Kokoro('kokoro-v1.0.onnx','voices-v1.0.bin')
L=[("¿Tienes una tienda, o un negocio?",1.12),
("Por solo ciento quince dólares, te hacemos una página web profesional, que vende por ti.",1.12),
("Moderna, perfecta en el celular, con catálogo de productos, y botón de WhatsApp.",1.12),
("Y te la entregamos en solo siete días.",1.08),
("Comenta: ¡TIENDA!, y te envío toda la información.",1.08)]
v=sys.argv[1]
def f0stats(a,sr):
    f=[]
    for i in range(0,len(a)-2048,512):
        fr=a[i:i+2048]
        if np.sqrt((fr**2).mean())<0.03: continue
        fr=fr-fr.mean();ac=np.correlate(fr,fr,'full')[2047:]
        lo,hi=sr//400,sr//70;l=lo+np.argmax(ac[lo:hi])
        if ac[l]>0.4*ac[0]: f.append(sr/l)
    return np.median(f),np.std(f)
out=[]
for i,(t,s) in enumerate(L):
    a,sr=k.create(t,voice=v,speed=s,lang='es'); sf.write(f'{v}_L{i+1}.wav',a,sr)
    m,sd=f0stats(a,sr); out.append(round(len(a)/sr,2)); print(v,i+1,round(len(a)/sr,2),'F0',int(m),'sd',int(sd))
