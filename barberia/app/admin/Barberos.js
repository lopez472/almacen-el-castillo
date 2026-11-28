'use client'
import { useEffect, useState } from 'react'
import { listarBarberos, guardarBarbero, borrarBarbero, subirFoto } from '../../lib/datos'
import Avatar from '../componentes/Avatar'

const VACIO = { nombre: '', especialidad: '', foto: '', activo: true, orden: 0 }

export default function Barberos() {
  const [lista, setLista] = useState([])
  const [form, setForm] = useState(VACIO)
  const [aviso, setAviso] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const cargar = () => listarBarberos({ todos: true }).then(setLista)
  useEffect(() => { cargar() }, [])

  async function foto(e) {
    const f = e.target.files?.[0]; if (!f) return
    setSubiendo(true); setAviso('')
    try { setForm((x) => ({ ...x, foto: '' })); const url = await subirFoto(f); setForm((x) => ({ ...x, foto: url })) }
    catch { setAviso('No se pudo subir la foto.') } finally { setSubiendo(false) }
  }
  async function enviar(e) {
    e.preventDefault(); setAviso('')
    try {
      await guardarBarbero({ ...form, orden: form.id ? form.orden : lista.length + 1 })
      setAviso(form.id ? 'Barbero actualizado.' : 'Barbero agregado.'); setForm(VACIO); cargar()
    } catch (er) { setAviso(er.message) }
  }
  async function borrar(b) {
    if (!confirm(`¿Borrar a ${b.nombre}? Sus citas ya agendadas se conservan.`)) return
    await borrarBarbero(b.id); cargar()
  }

  return (
    <>
      <form className="caja" onSubmit={enviar}>
        <h3>{form.id ? 'Editar barbero' : 'Agregar barbero'}</h3>
        <div className="foto-campo campo">
          <Avatar barbero={form} />
          <label className="mini" style={{ cursor: 'pointer' }}>{subiendo ? 'Subiendo…' : form.foto ? 'Cambiar foto' : 'Subir foto'}
            <input type="file" accept="image/*" hidden onChange={foto} /></label>
          {form.foto && <button type="button" className="mini" onClick={() => setForm({ ...form, foto: '' })}>Quitar</button>}
        </div>
        <div className="campo"><label>Nombre</label><input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Andrés" required /></div>
        <div className="campo"><label>Especialidad (opcional)</label><input value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value })} placeholder="Ej: Fades y diseños" /></div>
        <label className="interruptor"><input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} /> Recibe citas</label>
        {aviso && <p className="aviso">{aviso}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" type="submit" disabled={subiendo}>{form.id ? 'Guardar cambios' : 'Agregar barbero'}</button>
          {form.id && <button className="btn sec" type="button" onClick={() => setForm(VACIO)}>Cancelar</button>}
        </div>
      </form>

      {lista.length === 0 && <p className="vacio">Todavía no hay barberos.</p>}
      {lista.map((b) => (
        <div key={b.id} className="item" style={{ opacity: b.activo ? 1 : .5 }}>
          <Avatar barbero={b} />
          <div className="info"><div className="nombre">{b.nombre}{!b.activo && ' (no recibe citas)'}</div>{b.especialidad && <div className="sub">{b.especialidad}</div>}</div>
          <button className="mini" onClick={() => { setForm(b); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Editar</button>
          <button className="mini" onClick={() => borrar(b)}>Borrar</button>
        </div>
      ))}
    </>
  )
}
