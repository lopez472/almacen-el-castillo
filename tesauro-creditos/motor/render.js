// Renderiza una escena HTML cuadro a cuadro: node render.js escena.html carpeta_salida [fps] [t1,t2,...]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [html, out, fps = 30, only] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => { console.error('ERROR PÁGINA:', e.message); process.exitCode = 1; });
  await p.goto('file://' + path.resolve(html)); await p.waitForTimeout(400);
  await p.evaluate(() => document.fonts.ready);
  const W = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.scrollHeight]);
  if (W[1] < 1900) await p.setViewportSize({ width: W[0], height: W[1] });
  const D = await p.evaluate(() => window.DURATION || 0);
  const times = only ? only.split(',').map(Number) : [...Array(Math.round(D * fps)).keys()].map(i => i / fps);
  for (let i = 0; i < times.length; i++) {
    await p.evaluate(t => render(t), times[i]);
    await p.screenshot({ path: `${out}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 90 });
  }
  await b.close();
})();
