// Vista de prueba: la misma página de citas y el mismo panel, en una sola página (modo demostración).
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import Agendar from '../app/page'
import Panel from '../app/admin/page'
import { reiniciarDemo } from '../lib/datos'

window.confirm = () => true // en la vista de prueba las confirmaciones se aceptan solas

const vistaDeHash = () => (location.hash === '#panel' ? 'panel' : 'cliente')

function Vista() {
  const [vista, setVista] = useState(vistaDeHash)
  const [clave, setClave] = useState(0)

  useEffect(() => {
    const alCambiar = () => setVista(vistaDeHash())
    window.addEventListener('hashchange', alCambiar)
    // los enlaces internos (/ y /admin) cambian de vista en vez de salir de la página
    const clic = (e) => {
      const a = e.target.closest && e.target.closest('a[href]')
      if (!a) return
      const h = a.getAttribute('href')
      if (h === '/' || h === '/admin') { e.preventDefault(); ir(h === '/admin' ? 'panel' : 'cliente') }
    }
    document.addEventListener('click', clic, true)
    return () => { window.removeEventListener('hashchange', alCambiar); document.removeEventListener('click', clic, true) }
  }, [])

  function ir(v) {
    setVista(v); setClave((k) => k + 1)
    try { history.replaceState(null, '', v === 'panel' ? '#panel' : '#cliente') } catch {}
    window.scrollTo(0, 0)
  }
  function reiniciar() { reiniciarDemo(); setClave((k) => k + 1); window.scrollTo(0, 0) }

  return (
    <>
      <div className="vp-barra">
        <span className="vp-etiqueta">Vista de prueba</span>
        <div className="vp-botones">
          <button className={vista === 'cliente' ? 'on' : ''} onClick={() => ir('cliente')}>Vista cliente</button>
          <button className={vista === 'panel' ? 'on' : ''} onClick={() => ir('panel')}>Panel</button>
        </div>
        <button className="vp-reiniciar" onClick={reiniciar}>Reiniciar</button>
      </div>
      {vista === 'panel' ? <Panel key={'p' + clave} /> : <Agendar key={'c' + clave} />}
    </>
  )
}

createRoot(document.getElementById('raiz')).render(<Vista />)
