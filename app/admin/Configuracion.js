'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Configuracion({ setAviso }) {
  const [c, setC] = useState({ nombre: '', whatsapp: '', horarios: '' })

  useEffect(() => {
    supabase.from('configuracion').select('*').eq('id', 1).single()
      .then(({ data }) => data && setC(data))
  }, [])

  async function guardar(e) {
    e.preventDefault()
    const { error } = await supabase.from('configuracion')
      .upsert({ id: 1, nombre: c.nombre, whatsapp: c.whatsapp, horarios: c.horarios })
    setAviso(error ? 'No se pudo guardar: ' + error.message : 'Configuración guardada.')
  }

  return (
    <form className="caja" onSubmit={guardar} style={{ marginTop: '1.5rem' }}>
      <h2>Configuración general</h2>
      <div className="campo"><label>Nombre de la tienda</label><input value={c.nombre || ''} onChange={(e) => setC({ ...c, nombre: e.target.value })} /></div>
      <div className="campo"><label>WhatsApp de pedidos (con 57)</label><input inputMode="numeric" value={c.whatsapp || ''} onChange={(e) => setC({ ...c, whatsapp: e.target.value })} /></div>
      <div className="campo"><label>Horarios</label><input value={c.horarios || ''} onChange={(e) => setC({ ...c, horarios: e.target.value })} /></div>
      <button type="submit">Guardar configuración</button>
    </form>
  )
}
