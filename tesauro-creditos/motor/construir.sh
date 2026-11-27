#!/usr/bin/env bash
# Construye un video completo: ./motor/construir.sh videos/01-estrena-hoy [solo-preview]
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"; V="$RAIZ/$1"; N="$(basename "$V")"
TMP="${TMPDIR:-/tmp}/tesauro-$N"; mkdir -p "$TMP" "$RAIZ/entregables"
EXT=$(python3 -I -c "import json,sys;print(1 if 'audio_externo' in json.load(open(sys.argv[1])) else 0)" "$V/guion.json")
if [ "$EXT" = 1 ]; then VOZ_PY=voz_externa.py; ECO=""; else VOZ_PY=voz.py; ECO="aecho=0.8:0.5:35|60:0.1|0.06,"; fi
[ -f "$V/tiempos.json" ] && [ "$V/tiempos.json" -nt "$V/guion.json" ] || python3 -I "$RAIZ/motor/$VOZ_PY" "$V/guion.json"
if [ "${2:-}" != "" ]; then rm -rf "$TMP/pv"; node "$RAIZ/motor/render.js" "$V/escena.html" "$TMP/pv" 30 "$2"
  ffmpeg -loglevel error -y -i "$TMP/pv/f%05d.jpg" -vf "scale=270:-1,tile=$(echo "$2" | tr ',' '\n' | wc -l)x1" -frames:v 1 "$TMP/preview.jpg"; echo "$TMP/preview.jpg"; exit 0; fi
python3 -I "$RAIZ/motor/musica.py" "$V/guion.json"
rm -rf "$TMP/frames"; node "$RAIZ/motor/render.js" "$V/escena.html" "$TMP/frames" 30
ffmpeg -loglevel error -y -i "$V/voz.wav" -i "$V/musica.wav" -i "$V/sfx.wav" -filter_complex \
"[0]aresample=44100,highpass=f=85,equalizer=f=3500:t=q:w=1.2:g=2.5,acompressor=threshold=-20dB:ratio=3.5:attack=4:release=60:makeup=2,${ECO}pan=stereo|c0=c0|c1=c0,asplit=2[v][vsc];\
[1]volume=0.5[m];[m][vsc]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=300[md];\
[2]volume=0.75[s];[v][md][s]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1:LRA=9" -ar 44100 "$TMP/mezcla.wav"
ffmpeg -loglevel error -y -framerate 30 -i "$TMP/frames/f%05d.jpg" -i "$TMP/mezcla.wav" -c:v libx264 -pix_fmt yuv420p -crf 19 -preset medium \
  -c:a aac -b:a 192k -shortest -movflags +faststart "$RAIZ/entregables/$N.mp4"
echo "LISTO: $RAIZ/entregables/$N.mp4"
