'use client'
import { useEffect, useMemo, useState } from 'react'
import { listarCitas, listarBarberos, actualizarCita, obtenerConfig } from '../../lib/datos'
import { hoyISO, sumarDias, fechaLarga, horaBonita, pesos, capitalizar } from '../../lib/horario'

const VISTAS = [['hoy', 'Hoy'], ['manana', 'Mañana'], ['proximas', 'Próximas'], ['fecha', 'Elegir día']]
const ETIQUETA = { pendiente: 'Pendiente', atendida: 'Atendida', no_vino: 'No vino', cancelada: 'Cancelada' }

export default function Citas() {
  const [citas, setCitas] = useState(null)
  const [barberos, setBarberos] = useState([])
  const [config, setConfig] = useState(null)
  const [vista, setVista] = useState('hoy')
  const [dia, setDia] = useState(hoyISO())
  const [barbero, setBarbero] = useState('todos')
  const [verCanceladas, setVerCanceladas] = useState(false)

  useEffect(() => {
    listarBarberos({ todos: true }).then(setBarberos)
    obtenerConfig().then(setConfig)
    try { const b = localStorage.getItem('barberia-panel-barbero'); if (b) setBarbero(b) } catch {}
  }, [])

  const rango = useMemo(() => {
    const hoy = hoyISO()
    if (vista === 'hoy') return [hoy, hoy]
    if (vista === 'manana') return [sumarDias(hoy, 1), sumarDias(hoy, 1)]
    if (vista === 'fecha') return [dia, dia]
    return [hoy, sumarDias(hoy, 60)]
  }, [vista, dia])

  async function cargar() { setCitas(await listarCitas({ desde: rango[0], hasta: rango[1] })) }
  useEffect(() => { setCitas(null); cargar() }, [rango])
  // refresco automático cada 30 s para ver citas nuevas
  useEffect(() => { const t = setInterval(cargar, 30000); return () => clearInterval(t) }, [rango])

  function elegirBarbero(id) { setBarbero(id); try { localStorage.setItem('barberia-panel-barbero', id) } catch {} }

  const visibles = (citas || []).filter((c) => (barbero === 'todos' || c.barbero_id === barbero) && (verCanceladas || c.estado !== 'cancelada'))
  const activas = visibles.filter((c) => c.estado !== 'cancelada')
  const porDia = visibles.reduce((acc, c) => { (acc[c.fecha] ||= []).push(c); return acc }, {})

  async function cambiar(c, estado) {
    if (estado === 'cancelada' && !confirm(`¿Cancelar la cita de ${c.nombre} ${c.apellido}?`)) return
    await actualizarCita(c.id, { estado }); cargar()
  }

  const nombreNegocio = config?.nombre || 'la barbería'
  const recordatorio = (c) => encodeURIComponent(`Hola ${c.nombre} 👋 Te recordamos tu cita en ${nombreNegocio}: ${fechaLarga(c.fecha)} a las ${horaBonita(c.hora)} con ${c.barbero_nombre} (${c.servicio_nombre}). ¡Te esperamos!`)
  const tel57 = (t) => (t.length === 10 ? '57' + t : t)

  return (
    <>
      <div className="chips">
        <button className={'chip' + (barbero === 'todos' ? ' on' : '')} onClick={() => elegirBarbero('todos')}>Todos los barberos</button>
        {barberos.map((b) => <button key={b.id} className={'chip' + (barbero === b.id ? ' on' : '')} onClick={() => elegirBarbero(b.id)}>{b.nombre}</button>)}
      </div>
      <div className="chips">
        {VISTAS.map(([k, t]) => <button key={k} className={'chip' + (vista === k ? ' on' : '')} onClick={() => setVista(k)}>{t}</button>)}
      </div>
      {vista === 'fecha' && <div className="campo"><input type="date" value={dia} onChange={(e) => setDia(e.target.value)} /></div>}

      <div className="resumen-dia">
        <div><b>{activas.length}</b><span>Citas</span></div>
        <div><b>{activas.filter((c) => c.estado === 'pendiente').length}</b><span>Por atender</span></div>
        <div><b style={{ fontSize: 26, paddingTop: 6 }}>{pesos(activas.filter((c) => c.estado !== 'no_vino').reduce((a, c) => a + Number(c.precio), 0))}</b><span>Total</span></div>
      </div>

      <label className="interruptor" style={{ fontSize: 14, color: 'var(--gris)' }}>
        <input type="checkbox" checked={verCanceladas} onChange={(e) => setVerCanceladas(e.target.checked)} /> Mostrar canceladas
      </label>

      {citas === null ? <p className="vacio">Cargando citas…</p>
        : visibles.length === 0 ? <p className="vacio">No hay citas {vista === 'hoy' ? 'para hoy' : vista === 'manana' ? 'para mañana' : 'en este período'}.</p>
        : Object.entries(porDia).map(([f, lista]) => (
          <section key={f}>
            {(vista === 'proximas') && <h3 className="grupo-dia">{f === hoyISO() ? 'Hoy · ' : ''}{capitalizar(fechaLarga(f))}</h3>}
            {lista.map((c) => (
              <article key={c.id} className={'cita' + (c.estado === 'cancelada' || c.estado === 'no_vino' ? ' apagada' : '')}>
                <div className="h"><b>{horaBonita(c.hora).split(' ')[0]}</b><small>{horaBonita(c.hora).split(' ').slice(1).join(' ')} · {c.duracion_min} min</small></div>
                <div className="d">
                  <div className="cliente">{c.nombre} {c.apellido}<span className={'estado ' + c.estado}>{ETIQUETA[c.estado]}</span></div>
                  <div className="meta">{c.servicio_nombre} · {pesos(c.precio)}{barbero === 'todos' ? ` · ${c.barbero_nombre}` : ''}</div>
                  <div className="meta">📱 {c.telefono}</div>
                  <div className="btns">
                    <a className="mini" href={`tel:${c.telefono}`}>Llamar</a>
                    <a className="mini" href={`https://wa.me/${tel57(c.telefono)}?text=${recordatorio(c)}`} target="_blank" rel="noreferrer">WhatsApp</a>
                    {c.estado === 'pendiente' && <>
                      <button className="mini blanco" onClick={() => cambiar(c, 'atendida')}>✓ Atendida</button>
                      <button className="mini" onClick={() => cambiar(c, 'no_vino')}>No vino</button>
                      <button className="mini" onClick={() => cambiar(c, 'cancelada')}>Cancelar</button>
                    </>}
                    {c.estado !== 'pendiente' && <button className="mini" onClick={() => cambiar(c, 'pendiente')}>Deshacer</button>}
                  </div>
                </div>
              </article>
            ))}
          </section>
        ))}
    </>
  )
}
