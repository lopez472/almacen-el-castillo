'use client'
import { useEffect, useState } from 'react'
import { obtenerConfig, guardarConfig } from '../../lib/datos'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const corta = (h) => (h ? String(h).slice(0, 5) : '')

export default function Ajustes() {
  const [c, setC] = useState(null)
  const [aviso, setAviso] = useState('')
  useEffect(() => { obtenerConfig().then((x) => setC({ ...x, apertura: corta(x.apertura), cierre: corta(x.cierre), descanso_inicio: corta(x.descanso_inicio), descanso_fin: corta(x.descanso_fin) })) }, [])
  if (!c) return <p className="vacio">Cargando…</p>

  const cambiar = (k) => (e) => setC({ ...c, [k]: e.target.value })
  const alternarDia = (d) => setC({ ...c, dias: c.dias.includes(d) ? c.dias.filter((x) => x !== d) : [...c.dias, d].sort() })

  async function enviar(e) {
    e.preventDefault(); setAviso('')
    try {
      await guardarConfig({ nombre: c.nombre, eslogan: c.eslogan, whatsapp: c.whatsapp.replace(/\D/g, ''), direccion: c.direccion, apertura: c.apertura, cierre: c.cierre,
        intervalo_min: Number(c.intervalo_min), dias: c.dias, descanso_inicio: c.descanso_inicio || '', descanso_fin: c.descanso_fin || '', dias_adelante: Number(c.dias_adelante) })
      setAviso('Ajustes guardados.')
    } catch (er) { setAviso(er.message) }
  }

  return (
    <form onSubmit={enviar}>
      <div className="caja">
        <h3>Barbería</h3>
        <div className="campo"><label>Nombre</label><input value={c.nombre || ''} onChange={cambiar('nombre')} required /></div>
        <div className="campo"><label>Frase de bienvenida</label><input value={c.eslogan || ''} onChange={cambiar('eslogan')} /></div>
        <div className="fila">
          <div className="campo"><label>WhatsApp (con 57)</label><input inputMode="numeric" value={c.whatsapp || ''} onChange={cambiar('whatsapp')} placeholder="573001234567" /></div>
          <div className="campo"><label>Dirección</label><input value={c.direccion || ''} onChange={cambiar('direccion')} /></div>
        </div>
      </div>
      <div className="caja">
        <h3>Horario de atención</h3>
        <div className="campo"><label>Días que abren</label>
          <div className="dias-semana">{DIAS.map((d, i) => <button type="button" key={d} className={c.dias.includes(i) ? 'on' : ''} onClick={() => alternarDia(i)}>{d}</button>)}</div></div>
        <div className="fila">
          <div className="campo"><label>Abre</label><input type="time" value={c.apertura} onChange={cambiar('apertura')} required /></div>
          <div className="campo"><label>Cierra</label><input type="time" value={c.cierre} onChange={cambiar('cierre')} required /></div>
        </div>
        <div className="fila">
          <div className="campo"><label>Almuerzo desde (opcional)</label><input type="time" value={c.descanso_inicio} onChange={cambiar('descanso_inicio')} /></div>
          <div className="campo"><label>Almuerzo hasta</label><input type="time" value={c.descanso_fin} onChange={cambiar('descanso_fin')} /></div>
        </div>
        <div className="fila">
          <div className="campo"><label>Mostrar horas cada</label>
            <select value={c.intervalo_min} onChange={cambiar('intervalo_min')}>{[15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutos</option>)}</select></div>
          <div className="campo"><label>Se puede agendar hasta</label>
            <select value={c.dias_adelante} onChange={cambiar('dias_adelante')}>{[7, 14, 21, 30].map((d) => <option key={d} value={d}>{d} días adelante</option>)}</select></div>
        </div>
      </div>
      {aviso && <p className="aviso">{aviso}</p>}
      <div className="acciones" style={{ marginTop: 0 }}><button className="btn" type="submit">Guardar ajustes</button></div>
    </form>
  )
}
