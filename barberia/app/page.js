'use client'
import { useEffect, useMemo, useState } from 'react'
import { MODO_DEMO, obtenerConfig, listarServicios, listarBarberos, horasOcupadas, agendarCita } from '../lib/datos'
import Avatar from './componentes/Avatar'
import { diasDisponibles, horasLibres, nombreDia, numeroDia, mesCorto, fechaLarga, horaBonita, pesos, capitalizar } from '../lib/horario'

const PASOS = ['Tus datos', 'Tipo de corte', 'Barbero', 'Día', 'Hora', 'Confirmar']

export default function Agendar() {
  const [config, setConfig] = useState(null)
  const [servicios, setServicios] = useState([])
  const [barberos, setBarberos] = useState([])
  const [paso, setPaso] = useState(0)
  const [datos, setDatos] = useState({ nombre: '', apellido: '', telefono: '' })
  const [servicio, setServicio] = useState(null)
  const [barbero, setBarbero] = useState(null)
  const [fecha, setFecha] = useState(null)
  const [hora, setHora] = useState(null)
  const [ocupadas, setOcupadas] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [hecho, setHecho] = useState(false)

  useEffect(() => {
    Promise.all([obtenerConfig(), listarServicios(), listarBarberos()])
      .then(([c, s, b]) => { setConfig(c); setServicios(s); setBarberos(b) })
      .catch(() => setError('No se pudo cargar la información. Revisa tu conexión.'))
    try { const g = JSON.parse(localStorage.getItem('barberia-cliente')); if (g) setDatos(g) } catch {}
  }, [])

  // horas ocupadas del barbero en el día elegido
  useEffect(() => {
    if (!barbero || !fecha) return
    setOcupadas(null)
    horasOcupadas(barbero.id, fecha).then(setOcupadas).catch(() => setOcupadas([]))
  }, [barbero, fecha])

  const dias = useMemo(() => (config ? diasDisponibles(config) : []), [config])
  const libres = useMemo(() => (config && servicio && fecha && ocupadas ? horasLibres(config, fecha, servicio.duracion_min, ocupadas) : []), [config, servicio, fecha, ocupadas])

  const telLimpio = datos.telefono.replace(/\D/g, '')
  const datosOk = datos.nombre.trim().length >= 2 && datos.apellido.trim().length >= 2 && telLimpio.length >= 10
  const puede = [datosOk, !!servicio, !!barbero, !!fecha, !!hora, true][paso]

  function siguiente() {
    setError('')
    if (paso === 0) { try { localStorage.setItem('barberia-cliente', JSON.stringify(datos)) } catch {} }
    if (paso < 5) setPaso(paso + 1)
    else confirmar()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function atras() { setError(''); setPaso(Math.max(0, paso - 1)) }

  async function confirmar() {
    setEnviando(true); setError('')
    try {
      await agendarCita({ ...datos, servicio, barbero, fecha, hora })
      setHecho(true)
    } catch (e) {
      setError(e.message)
      if (String(e.message).includes('hora')) { setHora(null); setPaso(4); horasOcupadas(barbero.id, fecha).then(setOcupadas) }
    } finally { setEnviando(false) }
  }

  function nuevaCita() {
    setServicio(null); setBarbero(null); setFecha(null); setHora(null); setHecho(false); setPaso(1)
  }

  const nombreNegocio = config?.nombre || 'BARBERÍA'
  const wa = config?.whatsapp?.replace(/\D/g, '')
  const mensajeWa = encodeURIComponent(`Hola, agendé una cita en ${nombreNegocio}:\n• ${datos.nombre} ${datos.apellido}\n• ${servicio?.nombre}\n• Barbero: ${barbero?.nombre}\n• ${fecha ? fechaLarga(fecha) : ''} a las ${hora ? horaBonita(hora) : ''}`)

  return (
    <>
      {MODO_DEMO && <div className="demo">MODO DEMOSTRACIÓN · los datos se guardan solo en este navegador</div>}
      <header className="cabecera"><div className="contenedor">
        <div className="marca"><div className="poste" /><b>{nombreNegocio}</b></div>
        <a className="panel" href="/admin">Panel</a>
      </div></header>

      <main className="contenedor">
        {hecho ? (
          <section className="listo">
            <div className="check">✓</div>
            <p className="etiqueta">Cita agendada</p>
            <h2 className="titulo-paso" style={{ marginBottom: 8 }}>¡Te esperamos, {datos.nombre.split(' ')[0]}!</h2>
            <p style={{ color: 'var(--gris)', marginBottom: 22 }}>Llega 5 minutos antes de tu hora.</p>
            <div className="resumen" style={{ textAlign: 'left' }}>
              <div><span>Corte</span><b>{servicio.nombre}</b></div>
              <div><span>Barbero</span><b>{barbero.nombre}</b></div>
              <div><span>Día</span><b>{capitalizar(fechaLarga(fecha))}</b></div>
              <div><span>Hora</span><b>{horaBonita(hora)}</b></div>
              <div className="total"><span>Valor</span><b>{pesos(servicio.precio)}</b></div>
            </div>
            <div className="acciones" style={{ flexDirection: 'column' }}>
              {wa && <a className="btn" style={{ textAlign: 'center', textDecoration: 'none' }} href={`https://wa.me/${wa}?text=${mensajeWa}`} target="_blank" rel="noreferrer">Enviar confirmación por WhatsApp</a>}
              <button className="btn sec" style={{ flex: 1 }} onClick={nuevaCita}>Agendar otra cita</button>
            </div>
          </section>
        ) : (
          <>
            {paso === 0 && (
              <section className="portada">
                <div className="tijera">Barbería</div>
                <h1>Agenda<br />tu cita</h1>
                <p>{config?.eslogan || 'Elige tu corte, tu barbero y la hora que te quede mejor.'}</p>
              </section>
            )}

            <div className="pasos" style={{ marginTop: paso === 0 ? 0 : 26 }}>{PASOS.map((p, i) => <i key={p} className={i <= paso ? 'on' : ''} />)}</div>
            <p className="etiqueta">Paso {paso + 1} de {PASOS.length}</p>
            <h2 className="titulo-paso">{['¿Quién eres?', 'Elige tu corte', 'Elige tu barbero', '¿Qué día?', '¿A qué hora?', 'Revisa tu cita'][paso]}</h2>

            {paso === 0 && (
              <form onSubmit={(e) => { e.preventDefault(); if (datosOk) siguiente() }}>
                <div className="fila">
                  <div className="campo"><label>Nombre</label><input autoComplete="given-name" value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} placeholder="Ej: Juan" /></div>
                  <div className="campo"><label>Apellido</label><input autoComplete="family-name" value={datos.apellido} onChange={(e) => setDatos({ ...datos, apellido: e.target.value })} placeholder="Ej: Pérez" /></div>
                </div>
                <div className="campo"><label>Número de celular</label><input inputMode="tel" autoComplete="tel" value={datos.telefono} onChange={(e) => setDatos({ ...datos, telefono: e.target.value })} placeholder="Ej: 300 123 4567" /></div>
                {datos.telefono && telLimpio.length < 10 && <p className="etiqueta" style={{ textTransform: 'none', letterSpacing: 0 }}>El número debe tener 10 dígitos.</p>}
                <button type="submit" hidden />
              </form>
            )}

            {paso === 1 && (
              <div className="opciones">
                {servicios.length === 0 && <p className="vacio">Aún no hay cortes disponibles.</p>}
                {servicios.map((s) => (
                  <button key={s.id} className={'opcion' + (servicio?.id === s.id ? ' sel' : '')} onClick={() => { setServicio(s); setHora(null) }}>
                    <div className="info"><div className="nombre">{s.nombre}</div>{s.descripcion && <div className="sub">{s.descripcion}</div>}</div>
                    <div className="precio">{pesos(s.precio)}<small>{s.duracion_min} min</small></div>
                  </button>
                ))}
              </div>
            )}

            {paso === 2 && (
              <div className="opciones">
                {barberos.length === 0 && <p className="vacio">Aún no hay barberos disponibles.</p>}
                {barberos.map((b) => (
                  <button key={b.id} className={'opcion' + (barbero?.id === b.id ? ' sel' : '')} onClick={() => { setBarbero(b); setHora(null) }}>
                    <Avatar barbero={b} />
                    <div className="info"><div className="nombre">{b.nombre}</div>{b.especialidad && <div className="sub">{b.especialidad}</div>}</div>
                  </button>
                ))}
              </div>
            )}

            {paso === 3 && (
              <div className="dias">
                {dias.map((d) => (
                  <button key={d.fecha} disabled={!d.abierto} className={'dia' + (fecha === d.fecha ? ' sel' : '')} onClick={() => { setFecha(d.fecha); setHora(null) }}>
                    <span>{nombreDia(d.fecha)}</span><b>{numeroDia(d.fecha)}</b><small>{d.abierto ? mesCorto(d.fecha) : 'Cerrado'}</small>
                  </button>
                ))}
              </div>
            )}

            {paso === 4 && (
              <>
                <p style={{ color: 'var(--gris)', marginTop: -8, marginBottom: 16 }}>{capitalizar(fechaLarga(fecha))} · {barbero.nombre}</p>
                {ocupadas === null ? <p className="vacio">Buscando horas libres…</p>
                  : libres.length === 0 ? <p className="vacio">No quedan horas libres este día. Prueba otro día u otro barbero.</p>
                  : <div className="horas">{libres.map((h) => <button key={h} className={'hora' + (hora === h ? ' sel' : '')} onClick={() => setHora(h)}>{horaBonita(h)}</button>)}</div>}
              </>
            )}

            {paso === 5 && (
              <div className="resumen">
                <div><span>Cliente</span><b>{datos.nombre} {datos.apellido}</b></div>
                <div><span>Celular</span><b>{datos.telefono}</b></div>
                <div><span>Corte</span><b>{servicio.nombre}</b></div>
                <div><span>Barbero</span><b>{barbero.nombre}</b></div>
                <div><span>Día</span><b>{capitalizar(fechaLarga(fecha))}</b></div>
                <div><span>Hora</span><b>{horaBonita(hora)}</b></div>
                <div className="total"><span>Valor</span><b>{pesos(servicio.precio)}</b></div>
              </div>
            )}

            {error && <p className="aviso error">{error}</p>}

            <div className="acciones">
              {paso > 0 && <button className="btn sec" onClick={atras}>Atrás</button>}
              <button className="btn" disabled={!puede || enviando} onClick={siguiente}>
                {paso === 5 ? (enviando ? 'Agendando…' : 'Confirmar cita') : 'Continuar'}
              </button>
            </div>
          </>
        )}
      </main>
      <footer className="pie"><div className="contenedor">{nombreNegocio}{config?.direccion ? ` · ${config.direccion}` : ''}</div></footer>
    </>
  )
}
