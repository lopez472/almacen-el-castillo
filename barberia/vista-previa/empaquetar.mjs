// Empaqueta la vista de prueba en un solo HTML: node vista-previa/empaquetar.mjs
import { build } from 'esbuild'
import { readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = join(aqui, '..')

// React viene del CDN (global window.React / ReactDOM); Supabase no se usa en modo demostración.
const externos = {
  name: 'externos',
  setup(b) {
    b.onResolve({ filter: /^(react|react-dom\/client|@supabase\/supabase-js)$/ }, (a) => ({ path: a.path, namespace: 'ext' }))
    b.onLoad({ filter: /.*/, namespace: 'ext' }, (a) => ({
      contents: a.path === 'react' ? 'module.exports = window.React'
        : a.path === 'react-dom/client' ? 'module.exports = window.ReactDOM'
        : 'export const createClient = () => null',
      loader: 'js'
    }))
  }
}

const r = await build({
  entryPoints: [join(aqui, 'demo.js')], bundle: true, minify: true, write: false, format: 'iife', target: 'es2019',
  loader: { '.js': 'jsx' }, jsx: 'transform', jsxFactory: 'React.createElement', jsxFragment: 'React.Fragment',
  define: { 'process.env.NEXT_PUBLIC_SUPABASE_URL': '""', 'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': '""', 'process.env.NODE_ENV': '"production"' },
  plugins: [externos], logLevel: 'warning'
})
const js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')
const css = readFileSync(join(raiz, 'app/globals.css'), 'utf8')

const html = `<title>Agenda Barbería</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap">
<style>
/* Vista de prueba: diseño en blanco y negro de un solo tema (oscuro), igual que la página real */
:root{color-scheme:dark;--vp-fondo:#0a0a0a;--vp-texto:#ffffff;--vp-borde:#2a2a2a;--vp-gris:#8a8a8a}
body{background:var(--vp-fondo);color:var(--vp-texto)}
${css}
.vp-barra{position:sticky;top:env(safe-area-inset-top,0px);z-index:50;display:flex;align-items:center;gap:10px;padding:10px max(16px,env(safe-area-inset-right,0px)) 10px max(16px,env(safe-area-inset-left,0px));background:#000;border-bottom:1px solid var(--vp-borde)}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:60;background:#000}
.vp-etiqueta{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--vp-gris);white-space:nowrap}
.vp-botones{display:flex;gap:4px;margin:0 auto;background:#141414;border:1px solid var(--vp-borde);border-radius:999px;padding:3px}
.vp-botones button{border:none;background:none;color:var(--vp-gris);font-weight:700;font-size:13px;padding:7px 14px;border-radius:999px}
.vp-botones button.on{background:var(--vp-texto);color:#000}
.vp-reiniciar{border:1px solid var(--vp-borde);background:none;color:var(--vp-gris);font-size:12px;padding:6px 10px;border-radius:999px}
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid #fff;outline-offset:2px}
@media(max-width:420px){.vp-etiqueta{display:none}.vp-botones{margin:0}.vp-barra{justify-content:space-between}}
@media(prefers-reduced-motion:reduce){*{transition:none!important;scroll-behavior:auto!important}}
</style>
<div id="raiz"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${js}</script>
`
writeFileSync(join(aqui, 'agenda-barberia.html'), html)
console.log('listo', (html.length / 1024).toFixed(0) + ' KB')
