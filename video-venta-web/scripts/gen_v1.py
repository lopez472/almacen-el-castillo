import soundfile as sf
from kokoro_onnx import Kokoro
k=Kokoro('kokoro-v1.0.onnx','voices-v1.0.bin')
L=["¿Tienes una tienda o un negocio, y todavía no tienes página web?",
"Cada día tus clientes te buscan en Google... y terminan comprándole a tu competencia.",
"Por eso te hacemos una página web profesional, moderna, y lista para vender.",
"Diseño único, se ve perfecta en el celular, catálogo de productos, botón de WhatsApp, y lista en siete días.",
"¡Todo por solo ciento quince dólares! Pago único.",
"Comenta: ¡TIENDA!, y te envío toda la información."]
for i,l in enumerate(L):
    a,sr=k.create(l,voice='em_santa',speed=1.15,lang='es'); sf.write(f'v1/em_santa_L{i+1}.wav',a,sr); print(i+1,round(len(a)/sr,2))
