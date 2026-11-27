import json,re,numpy as np,soundfile as sf
L=["¿Tienes una tienda, o un negocio?",
"Por solo ciento quince dólares, te hacemos una página web profesional, que vende por ti.",
"Moderna, perfecta en el celular, con catálogo de productos, y botón de WhatsApp.",
"Y te la entregamos en solo siete días.",
"Comenta: ¡TIENDA!, y te envío toda la información."]
O=[0.3,2.5,7.7,12.4,15.3]; END=20.5; SR=24000
track=np.zeros(int(END*SR)); words=[]
for i,(txt,o) in enumerate(zip(L,O)):
    x,sr=sf.read(f'em_santa_L{i+1}_eq.wav'); assert sr==SR
    s=int(o*SR); track[s:s+len(x)]+=x[:len(track)-s]
    env=np.convolve(np.abs(x),np.ones(480)/480,'same'); on=np.where(env>0.02)[0]
    a,b=on[0]/SR,on[-1]/SR
    # pausas reales (silencios >120ms dentro de la frase)
    ws=txt.split(); wt=[len(re.sub(r'\W','',w))+1.5 + (3 if re.search(r'[,:.!?]$',w) else 0) for w in ws]
    c=np.cumsum([0]+wt); c=c/c[-1]
    for j,w in enumerate(ws):
        words.append({"w":w,"t":round(o+a+c[j]*(b-a),3),"e":round(o+a+c[j+1]*(b-a),3),"line":i})
sf.write('voz_track.wav',track/np.max(np.abs(track))*0.9,SR)
open('/home/user/almacen-el-castillo/video-venta-web/palabras.js','w').write('window.WORDS='+json.dumps(words,ensure_ascii=False)+';window.DURATION=%s;'%END)
for w in words: print(w['t'],w['w'])
