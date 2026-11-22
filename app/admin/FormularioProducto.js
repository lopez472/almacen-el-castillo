'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { CATEGORIAS } from '../../lib/util'

const vacio = { nombre: '', descripcion: '', precio: '', precio_oferta: '', categoria: CATEGORIAS[0], imagenes: [], activo: true, destacado: false }

export default function FormularioProducto({ editando, alTerminar, setAviso }) {
  const [f, setF] = useState(vacio)
  const [subiendo, setSubiendo] = useState(false)

  useEffect(() => {
    setF(editando ? { ...vacio, ...editando, precio_oferta: editando.precio_oferta || '' } : vacio)
  }, [editando])

  async function subirFotos(e) {
    const archivos = Array.from(e.target.files || [])
    if (!archivos.length) return
    setSubiendo(true)
    const urls = []
    for (const [i, a] of archivos.entries()) {
      const ruta = `${Date.now()}-${i}-${a.name.replace(/[^\w.]/g, '_')}`
      const { error } = await supabase.storage.from('productos').upload(ruta, a)
      if (error) { setAviso('No se pudo subir una foto: ' + error.message); continue }
      urls.push(supabase.storage.from('productos').getPublicUrl(ruta).data.publicUrl)
    }
    setF((x) => ({ ...x, imagenes: [...x.imagenes, ...urls] }))
    setSubiendo(false)
    e.target.value = ''
  }

  async function guardar(e) {
    e.preventDefault()
    const fila = {
      nombre: f.nombre, descripcion: f.descripcion, categoria: f.categoria,
      precio: Number(f.precio), precio_oferta: f.precio_oferta ? Number(f.precio_oferta) : null,
      imagenes: f.imagenes, activo: f.activo, destacado: f.destacado
    }
    const { error } = editando
      ? await supabase.from('productos').update(fila).eq('id', editando.id)
      : await supabase.from('productos').insert(fila)
    if (error) return setAviso('No se pudo guardar: ' + error.message)
    setAviso('Producto guardado.')
    alTerminar()
  }

  return (
    <form className="caja" onSubmit={guardar}>
      <h2>{editando ? 'Editar producto' : 'Nuevo producto'}</h2>
      <div className="campo"><label>Nombre</label><input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required /></div>
      <div className="campo"><label>Descripción</label><textarea rows={3} value={f.descripcion || ''} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></div>
      <div className="fila">
        <div className="campo" style={{ flex: 1 }}><label>Precio (COP)</label><input type="number" inputMode="numeric" value={f.precio} onChange={(e) => setF({ ...f, precio: e.target.value })} required /></div>
        <div className="campo" style={{ flex: 1 }}><label>Precio en oferta</label><input type="number" inputMode="numeric" value={f.precio_oferta || ''} onChange={(e) => setF({ ...f, precio_oferta: e.target.value })} /></div>
      </div>
      <div className="campo"><label>Categoría</label>
        <select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>
          {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="campo"><label>Fotos (galería o cámara del iPhone)</label>
        <input type="file" accept="image/*" multiple onChange={subirFotos} />
        {subiendo && <span>Subiendo fotos…</span>}
        <div className="miniaturas">
          {f.imagenes.map((u) => (
            <img key={u} src={u} alt="" onClick={() => setF({ ...f, imagenes: f.imagenes.filter((x) => x !== u) })} title="Toca para quitar" />
          ))}
        </div>
      </div>
      <div className="fila">
        <label><input type="checkbox" style={{ width: 'auto' }} checked={f.activo} onChange={(e) => setF({ ...f, activo: e.target.checked })} /> Visible en la tienda</label>
        <label><input type="checkbox" style={{ width: 'auto' }} checked={f.destacado} onChange={(e) => setF({ ...f, destacado: e.target.checked })} /> Destacado</label>
      </div>
      <div className="fila" style={{ marginTop: '.8rem' }}>
        <button type="submit" disabled={subiendo}>Guardar producto</button>
        {editando && <button type="button" className="sec" onClick={alTerminar}>Cancelar</button>}
      </div>
    </form>
  )
}
