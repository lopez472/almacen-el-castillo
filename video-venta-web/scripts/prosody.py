import sys,numpy as np,soundfile as sf,pyworld as pw
TARGET=158.0; EXP=1.25
for f in sys.argv[1:]:
    x,sr=sf.read(f); x=x.astype(np.float64)
    f0,t=pw.harvest(x,sr,f0_floor=70,f0_ceil=400,frame_period=5)
    sp=pw.cheaptrick(x,f0,t,sr); ap=pw.d4c(x,f0,t,sr)
    v=f0>0; med=np.median(f0[v])
    n=f0.copy(); n[v]=TARGET*(f0[v]/med)**EXP
    # slight end-of-phrase energy: small upward drift on last 15% for questions handled by text
    y=pw.synthesize(n,sp,ap,sr,frame_period=5)
    sf.write(f.replace('.wav','_p.wav'),y/np.max(np.abs(y))*0.9,sr)
    print(f,int(med),'->',int(np.median(n[v])),'sd',int(np.std(n[v])))
