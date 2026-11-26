'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const resenaVacia = { nombre: '', estrellas: 5, texto: '' }

export default function Configuracion({ setAviso }) {
  const [c, setC] = useState({ nombre: '', whatsapp: '', horarios: '', mensaje_franja: '', direccion: '', enlace_maps: '', resenas: [] })

  useEffect(() => {
    supabase.from('configuracion').select('*').eq('id', 1).single()
      .then(({ data }) => data && setC((x) => ({ ...x, ...data, resenas: Array.isArray(data.resenas) ? data.resenas : [] })))
  }, [])

  const cambiarResena = (i, cambios) => setC((x) => ({ ...x, resenas: x.resenas.map((r, j) => (j === i ? { ...r, ...cambios } : r)) }))
  const quitarResena = (i) => setC((x) => ({ ...x, resenas: x.resenas.filter((_, j) => j !== i) }))
  const agregarResena = () => setC((x) => ({ ...x, resenas: [...x.resenas, { ...resenaVacia }] }))

  async function guardar(e) {
    e.preventDefault()
    const { error } = await supabase.from('configuracion').upsert({
      id: 1, nombre: c.nombre, whatsapp: c.whatsapp, horarios: c.horarios, mensaje_franja: c.mensaje_franja,
      direccion: c.direccion, enlace_maps: c.enlace_maps,
      resenas: c.resenas.filter((r) => r.texto.trim()).map((r) => ({ ...r, estrellas: Number(r.estrellas) || 5 }))
    })
    setAviso(error
      ? 'No se pudo guardar: ' + error.message + ' (¿Ya corriste actualizar-base-de-datos.sql en Supabase?)'
      : 'Configuración guardada.')
  }

  return (
    <form className="caja" onSubmit={guardar} style={{ marginTop: '1.5rem' }}>
      <h2>Configuración general</h2>
      <div className="campo">
        <label>Mensaje de la franja de arriba</label>
        <input value={c.mensaje_franja || ''} placeholder="Ej: ¡Envíos gratis este fin de semana!" onChange={(e) => setC({ ...c, mensaje_franja: e.target.value })} />
        <span className="ayuda">Déjalo vacío si no quieres mostrar la franja.</span>
      </div>
      <div className="campo"><label>Nombre de la tienda</label><input value={c.nombre || ''} onChange={(e) => setC({ ...c, nombre: e.target.value })} /></div>
      <div className="campo"><label>WhatsApp de pedidos</label><input inputMode="numeric" placeholder="3103685448" value={c.whatsapp || ''} onChange={(e) => setC({ ...c, whatsapp: e.target.value })} /></div>
      <div className="campo"><label>Horarios</label><input value={c.horarios || ''} onChange={(e) => setC({ ...c, horarios: e.target.value })} /></div>

      <h2 style={{ marginTop: '1rem' }}>Dirección y mapa</h2>
      <div className="campo">
        <label>Dirección del almacén</label>
        <input value={c.direccion || ''} placeholder="Ej: Calle 15 # 10-20, Barrio Centro, San Marcos, Sucre" onChange={(e) => setC({ ...c, direccion: e.target.value })} />
        <span className="ayuda">Escribe calle, barrio, municipio y departamento. Con esto sale el mapa y el botón "Cómo llegar".</span>
      </div>
      <div className="campo">
        <label>Enlace de tu negocio en Google Maps (opcional)</label>
        <input value={c.enlace_maps || ''} placeholder="https://maps.app.goo.gl/..." onChange={(e) => setC({ ...c, enlace_maps: e.target.value })} />
        <span className="ayuda">En Google Maps busca tu almacén, toca Compartir y copia el enlace. Se usa en "Ver más reseñas en Google".</span>
      </div>

      <h2 style={{ marginTop: '1rem' }}>Reseñas de clientes</h2>
      <span className="ayuda">Copia aquí algunas reseñas reales de tus clientes (de Google, Facebook o WhatsApp).</span>
      {c.resenas.map((r, i) => (
        <div className="resena-admin" key={i}>
          <div className="fila">
            <input style={{ flex: 2 }} placeholder="Nombre del cliente" value={r.nombre} onChange={(e) => cambiarResena(i, { nombre: e.target.value })} />
            <select style={{ flex: 1 }} value={r.estrellas} onChange={(e) => cambiarResena(i, { estrellas: Number(e.target.value) })} aria-label="Estrellas">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
            </select>
          </div>
          <textarea rows={2} placeholder="Lo que dijo el cliente" value={r.texto} onChange={(e) => cambiarResena(i, { texto: e.target.value })} />
          <button type="button" className="peligro" onClick={() => quitarResena(i)}>Quitar reseña</button>
        </div>
      ))}
      <button type="button" className="sec" onClick={agregarResena} style={{ margin: '.3rem 0 1rem' }}>+ Agregar reseña</button>

      <div><button type="submit">Guardar configuración</button></div>
    </form>
  )
}
