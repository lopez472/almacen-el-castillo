'use client'
import { useEffect, useState } from 'react'
import { listarServicios, guardarServicio, borrarServicio } from '../../lib/datos'
import { pesos } from '../../lib/horario'

const VACIO = { nombre: '', descripcion: '', precio: '', duracion_min: 30, activo: true, orden: 0 }
const DURACIONES = [15, 20, 30, 40, 45, 60, 75, 90, 120]

export default function Servicios() {
  const [lista, setLista] = useState([])
  const [form, setForm] = useState(VACIO)
  const [aviso, setAviso] = useState('')
  const cargar = () => listarServicios({ todos: true }).then(setLista)
  useEffect(() => { cargar() }, [])

  async function enviar(e) {
    e.preventDefault(); setAviso('')
    try {
      await guardarServicio({ ...form, orden: form.id ? form.orden : lista.length + 1 })
      setAviso(form.id ? 'Corte actualizado.' : 'Corte agregado.'); setForm(VACIO); cargar()
    } catch (er) { setAviso(er.message) }
  }
  async function borrar(s) {
    if (!confirm(`¿Borrar "${s.nombre}"? Las citas ya agendadas se conservan.`)) return
    await borrarServicio(s.id); cargar()
  }
  async function mover(i, d) {
    const j = i + d; if (j < 0 || j >= lista.length) return
    const a = lista[i], b = lista[j]
    await guardarServicio({ ...a, orden: j + 1 }); await guardarServicio({ ...b, orden: i + 1 }); cargar()
  }

  return (
    <>
      <form className="caja" onSubmit={enviar}>
        <h3>{form.id ? 'Editar corte' : 'Agregar tipo de corte'}</h3>
        <div className="campo"><label>Nombre</label><input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Fade con diseño" required /></div>
        <div className="fila">
          <div className="campo"><label>Precio</label><input inputMode="numeric" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value.replace(/\D/g, '') })} placeholder="25000" required /></div>
          <div className="campo"><label>Duración</label>
            <select value={form.duracion_min} onChange={(e) => setForm({ ...form, duracion_min: Number(e.target.value) })}>
              {DURACIONES.map((d) => <option key={d} value={d}>{d} minutos</option>)}
            </select></div>
        </div>
        <div className="campo"><label>Descripción (opcional)</label><input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej: Degradado bajo con diseño a mano" /></div>
        <label className="interruptor"><input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} /> Visible para agendar</label>
        {aviso && <p className="aviso">{aviso}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" type="submit">{form.id ? 'Guardar cambios' : 'Agregar corte'}</button>
          {form.id && <button className="btn sec" type="button" onClick={() => setForm(VACIO)}>Cancelar</button>}
        </div>
      </form>

      {lista.length === 0 && <p className="vacio">Todavía no hay cortes.</p>}
      {lista.map((s, i) => (
        <div key={s.id} className="item" style={{ opacity: s.activo ? 1 : .5 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button className="mini" style={{ padding: '2px 8px' }} onClick={() => mover(i, -1)} aria-label="Subir">▲</button>
            <button className="mini" style={{ padding: '2px 8px' }} onClick={() => mover(i, 1)} aria-label="Bajar">▼</button>
          </div>
          <div className="info"><div className="nombre">{s.nombre}{!s.activo && ' (oculto)'}</div><div className="sub">{pesos(s.precio)} · {s.duracion_min} min{s.descripcion ? ` · ${s.descripcion}` : ''}</div></div>
          <button className="mini" onClick={() => { setForm({ ...s, precio: String(s.precio) }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Editar</button>
          <button className="mini" onClick={() => borrar(s)}>Borrar</button>
        </div>
      ))}
    </>
  )
}
