// Exporta las imágenes del feed: node motor/imagenes.js
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const dir = path.join(__dirname, '..', 'imagenes'); const out = path.join(__dirname, '..', 'entregables');
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.html'))) {
    await p.goto('file://' + path.join(dir, f)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(out, f.replace('.html', '@2x.png')) }); console.log(f);
  }
  await b.close();
})();
