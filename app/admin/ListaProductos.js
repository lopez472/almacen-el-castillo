'use client'
import { supabase } from '../../lib/supabase'
import { cop } from '../../lib/util'

export default function ListaProductos({ productos, alEditar, alCambiar }) {
  async function borrar(id) {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('productos').delete().eq('id', id)
    alCambiar()
  }

  async function alternar(p) {
    await supabase.from('productos').update({ activo: !p.activo }).eq('id', p.id)
    alCambiar()
  }

  return (
    <>
      <h2>Productos ({productos.length})</h2>
      {productos.length === 0 && <p className="vacio">Aún no hay productos. Crea el primero con el formulario de arriba.</p>}
      {productos.map((p) => (
        <div className="linea" key={p.id}>
          <span>{p.nombre} · {cop(p.precio_oferta || p.precio)}{p.activo ? '' : ' (oculto)'}</span>
          <span className="fila">
            <button className="sec" onClick={() => alEditar(p)}>Editar</button>
            <button className="sec" onClick={() => alternar(p)}>{p.activo ? 'Ocultar' : 'Mostrar'}</button>
            <button className="peligro" onClick={() => borrar(p.id)}>Eliminar</button>
          </span>
        </div>
      ))}
    </>
  )
}
