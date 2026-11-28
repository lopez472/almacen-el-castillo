'use client'
import { useEffect, useState } from 'react'
import { MODO_DEMO, sesionActual, alCambiarSesion, entrar, salir } from '../../lib/datos'
import Citas from './Citas'
import Servicios from './Servicios'
import Barberos from './Barberos'
import Ajustes from './Ajustes'

const TABS = [['citas', 'Citas'], ['servicios', 'Tipos de corte'], ['barberos', 'Barberos'], ['ajustes', 'Ajustes']]

export default function Panel() {
  const [sesion, setSesion] = useState(null)
  const [listo, setListo] = useState(false)
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [aviso, setAviso] = useState('')
  const [tab, setTab] = useState('citas')

  useEffect(() => {
    sesionActual().then((s) => { setSesion(s); setListo(true) })
    return alCambiarSesion(setSesion)
  }, [])

  async function enviar(e) {
    e.preventDefault(); setAviso('')
    try { setSesion(await entrar(email, clave)) } catch (er) { setAviso(er.message) }
  }

  if (!listo) return <p className="vacio">Cargando…</p>

  if (!sesion) {
    return (
      <>
        {MODO_DEMO && <div className="demo">MODO DEMOSTRACIÓN · entra con cualquier correo y contraseña</div>}
        <main className="contenedor" style={{ maxWidth: 420, paddingTop: 60 }}>
          <div className="marca" style={{ marginBottom: 26 }}><div className="poste" /><b>PANEL</b></div>
          <form onSubmit={enviar}>
            <div className="campo"><label>Correo</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="campo"><label>Contraseña</label><input type="password" value={clave} onChange={(e) => setClave(e.target.value)} required /></div>
            {aviso && <p className="aviso error">{aviso}</p>}
            <div className="acciones"><button className="btn" type="submit">Entrar</button></div>
          </form>
          <p className="vacio" style={{ paddingTop: 0 }}><a href="/">← Volver a la página de citas</a></p>
        </main>
      </>
    )
  }

  return (
    <>
      {MODO_DEMO && <div className="demo">MODO DEMOSTRACIÓN · los datos se guardan solo en este navegador</div>}
      <header className="cabecera"><div className="contenedor">
        <div className="marca"><div className="poste" /><b>PANEL</b></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a className="panel" href="/" target="_blank" rel="noreferrer">Ver página</a>
          <button className="panel" style={{ background: 'none' }} onClick={() => { salir(); setSesion(null) }}>Salir</button>
        </div>
      </div></header>
      <main className="contenedor" style={{ paddingBottom: 60 }}>
        <nav className="tabs">{TABS.map(([k, t]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{t}</button>)}</nav>
        {tab === 'citas' && <Citas />}
        {tab === 'servicios' && <Servicios />}
        {tab === 'barberos' && <Barberos />}
        {tab === 'ajustes' && <Ajustes />}
      </main>
    </>
  )
}
