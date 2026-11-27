import numpy as np,soundfile as sf
from scipy.signal import butter,sosfilt
SR=44100; END=20.5; N=int(END*SR); rng=np.random.default_rng(7)
t=np.arange(N)/SR; mus=np.zeros(N); sfx=np.zeros(N)
bpm=92; beat=60/bpm; bar=4*beat
def lp(x,f,o=2): return sosfilt(butter(o,f,'low',fs=SR,output='sos'),x)
def hp(x,f,o=2): return sosfilt(butter(o,f,'high',fs=SR,output='sos'),x)
def bp(x,a,b): return sosfilt(butter(2,[a,b],'band',fs=SR,output='sos'),x)
def add(buf,x,at,g=1.0):
    s=int(at*SR); 
    if s>=N: return
    n=min(len(x),N-s); buf[s:s+n]+=g*x[:n]
mtof=lambda m:440*2**((m-69)/12)
# acordes Am9 Fmaj7 C(add9) G6  (lujo / chill)
chords=[[57,60,64,67,71],[53,57,60,64,69],[48,55,60,64,67],[55,59,62,64,67]]
roots=[45,41,48,43]
for b in range(int(END/bar)+1):
    c=chords[b%4]; st=b*bar; L=int(bar*SR); tt=np.arange(L)/SR
    env=np.minimum(1,tt/0.35)*np.exp(-tt*0.25)
    pad=sum(np.sin(2*np.pi*mtof(m)*tt*(1+d))+0.3*np.sin(4*np.pi*mtof(m)*tt) for m in c for d in(-0.003,0.003))
    add(mus,lp(pad*env,2200)*0.035,st)
    # campanitas (arpegio) 8vos
    for k in range(8):
        m=c[(k*2)%len(c)]+12; L2=int(0.5*SR); t2=np.arange(L2)/SR
        add(mus,np.sin(2*np.pi*mtof(m)*t2)*np.exp(-t2*7)*0.05,st+k*beat/2)
    # 808
    for off in(0,1.5*beat,2.5*beat):
        L3=int(beat*1.2*SR); t3=np.arange(L3)/SR; f=mtof(roots[b%4]-12)
        add(mus,np.tanh(2*np.sin(2*np.pi*f*t3))*np.exp(-t3*2.2)*0.22,st+off)
    for k in range(4):
        tb=st+k*beat
        if k in(0,2): # kick
            L4=int(0.4*SR); t4=np.arange(L4)/SR; ph=2*np.pi*np.cumsum(45+110*np.exp(-t4*30))/SR
            add(mus,np.sin(ph)*np.exp(-t4*9)*0.5,tb)
        if k in(1,3): # clap/snap
            L5=int(0.25*SR); n5=bp(rng.standard_normal(L5),900,5000)*np.exp(-np.arange(L5)/SR*25)
            add(mus,n5*0.25,tb)
        for h in range(4): # hats 16vos
            L6=int(0.05*SR); n6=hp(rng.standard_normal(L6),7000)*np.exp(-np.arange(L6)/SR*90)
            add(mus,n6*(0.07 if h%2==0 else 0.04),tb+h*beat/4)
# intro: filtro que se abre en los primeros 2.5 s
cut=np.clip(t/2.5,0,1); low=lp(mus,600); mus=low*(1-cut)+mus*cut
mus*=np.clip((END-t)/1.2,0,1)  # fade out
# ---------- efectos ----------
def whoosh(d=0.8,g=0.35,rev=False):
    L=int(d*SR); x=rng.standard_normal(L); tt=np.arange(L)/SR
    e=np.sin(np.pi*tt/d)**2; f=bp(x,300,3000)
    return (f*e*g)[::-1] if rev else f*e*g
def boom(g=0.8):
    L=int(1.2*SR); tt=np.arange(L)/SR; ph=2*np.pi*np.cumsum(35+80*np.exp(-tt*12))/SR
    return (np.sin(ph)*np.exp(-tt*3)+lp(rng.standard_normal(L),400)*np.exp(-tt*8)*0.5)*g
def ding(f=1760,g=0.25):
    L=int(1.5*SR); tt=np.arange(L)/SR
    return (np.sin(2*np.pi*f*tt)+0.5*np.sin(2*np.pi*f*2.76*tt)*np.exp(-tt*4))*np.exp(-tt*3)*g
def pop(g=0.35):
    L=int(0.12*SR); tt=np.arange(L)/SR; ph=2*np.pi*np.cumsum(300+900*np.exp(-tt*60))/SR
    return np.sin(ph)*np.exp(-tt*35)*g
def click(g=0.18):
    L=int(0.03*SR); return hp(rng.standard_normal(L),2500)*np.exp(-np.arange(L)/SR*200)*g
add(sfx,whoosh(0.9,0.3,True),0.0)
add(sfx,whoosh(0.6,0.3),2.55); add(sfx,boom(0.7),2.98); add(sfx,ding(1760,0.22),3.0)
for tm in(7.73,8.91,9.59,11.23): add(sfx,pop(),tm)
add(sfx,whoosh(0.5,0.25),12.0); add(sfx,boom(0.55),13.79)
add(sfx,whoosh(0.6,0.25),14.85)
for k in range(6): add(sfx,click(),15.62+k*0.11)
add(sfx,pop(0.4),16.35); add(sfx,ding(2093,0.18),16.4)
sf.write('musica.wav',np.stack([mus,mus],1)/np.max(np.abs(mus))*0.8,SR)
sf.write('sfx.wav',np.stack([sfx,sfx],1)/np.max(np.abs(sfx))*0.8,SR)
