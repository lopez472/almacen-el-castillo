'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { CATEGORIAS } from '../../lib/util'

const vacio = {
  nombre: '', descripcion: '', precio: '', precio_oferta: '', categoria: CATEGORIAS[0],
  imagenes: [], variantes: [], relacionados: [], activo: true, destacado: false
}

export default function FormularioProducto({ editando, productos = [], alTerminar, setAviso }) {
  const [f, setF] = useState(vacio)
  const [subiendo, setSubiendo] = useState(false)
  const [nuevoColor, setNuevoColor] = useState('')

  useEffect(() => {
    setF(editando
      ? { ...vacio, ...editando, precio_oferta: editando.precio_oferta || '', variantes: editando.variantes || [], relacionados: editando.relacionados || [] }
      : vacio)
    setNuevoColor('')
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

  const quitarFoto = (u) => setF((x) => ({
    ...x,
    imagenes: x.imagenes.filter((y) => y !== u),
    variantes: x.variantes.map((v) => (v.imagen === u ? { ...v, imagen: '' } : v))
  }))
  const hacerPrincipal = (u) => setF((x) => ({ ...x, imagenes: [u, ...x.imagenes.filter((y) => y !== u)] }))

  const agregarColor = () => {
    const nombre = nuevoColor.trim()
    if (!nombre) return
    if (f.variantes.some((v) => v.nombre.toLowerCase() === nombre.toLowerCase())) return setAviso('Ese color ya está agregado.')
    setF((x) => ({ ...x, variantes: [...x.variantes, { nombre, imagen: '' }] }))
    setNuevoColor('')
  }
  const cambiarVariante = (i, cambios) =>
    setF((x) => ({ ...x, variantes: x.variantes.map((v, j) => (j === i ? { ...v, ...cambios } : v)) }))
  const quitarVariante = (i) => setF((x) => ({ ...x, variantes: x.variantes.filter((_, j) => j !== i) }))

  const alternarRelacionado = (id) => setF((x) => ({
    ...x,
    relacionados: x.relacionados.includes(id) ? x.relacionados.filter((y) => y !== id) : [...x.relacionados, id]
  }))

  async function guardar(e) {
    e.preventDefault()
    const fila = {
      nombre: f.nombre, descripcion: f.descripcion, categoria: f.categoria,
      precio: Number(f.precio), precio_oferta: f.precio_oferta ? Number(f.precio_oferta) : null,
      imagenes: f.imagenes, activo: f.activo, destacado: f.destacado,
      variantes: f.variantes.filter((v) => v.nombre.trim()),
      relacionados: f.relacionados
    }
    const { error } = editando
      ? await supabase.from('productos').update(fila).eq('id', editando.id)
      : await supabase.from('productos').insert(fila)
    if (error) return setAviso('No se pudo guardar: ' + error.message + ' (¿Ya corriste actualizar-base-de-datos.sql en Supabase?)')
    setAviso('Producto guardado.')
    alTerminar()
  }

  const otros = productos.filter((p) => p.id !== editando?.id)

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

      <div className="campo"><label>Fotos (puedes subir varias de la galería o la cámara)</label>
        <input type="file" accept="image/*" multiple onChange={subirFotos} />
        {subiendo && <span>Subiendo fotos…</span>}
        {f.imagenes.length > 0 && <span className="ayuda">La foto con borde es la principal (la que sale en la tienda).</span>}
        <div className="miniaturas">
          {f.imagenes.map((u, i) => (
            <div key={u} className={'foto-admin' + (i === 0 ? ' principal-foto' : '')}>
              <img src={u} alt={`Foto ${i + 1}`} />
              {i > 0 && <button type="button" className="sec" onClick={() => hacerPrincipal(u)}>Principal</button>}
              <button type="button" className="peligro" onClick={() => quitarFoto(u)}>Quitar</button>
            </div>
          ))}
        </div>
      </div>

      <div className="campo"><label>Colores (opcional)</label>
        <span className="ayuda">Agrega cada color y toca la foto que le corresponde. El cliente elige el color y le sale esa foto.</span>
        {f.variantes.map((v, i) => (
          <div className="variante" key={i}>
            <div className="fila" style={{ alignItems: 'center' }}>
              <input style={{ flex: 1 }} value={v.nombre} onChange={(e) => cambiarVariante(i, { nombre: e.target.value })} aria-label="Nombre del color" />
              <button type="button" className="peligro" onClick={() => quitarVariante(i)}>Quitar</button>
            </div>
            {f.imagenes.length
              ? (
                <div className="elegir-foto">
                  {f.imagenes.map((u, j) => (
                    <button type="button" key={u} className={v.imagen === u ? 'on' : ''}
                      onClick={() => cambiarVariante(i, { imagen: v.imagen === u ? '' : u })} aria-label={`Usar foto ${j + 1} para ${v.nombre}`}>
                      <img src={u} alt="" />
                    </button>
                  ))}
                </div>
                )
              : <span className="ayuda">Sube fotos arriba para asignarle una a este color.</span>}
          </div>
        ))}
        <div className="fila">
          <input style={{ flex: 1 }} placeholder="Ej: Rojo" value={nuevoColor}
            onChange={(e) => setNuevoColor(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarColor() } }} />
          <button type="button" className="sec" onClick={agregarColor}>Agregar color</button>
        </div>
      </div>

      {otros.length > 0 && (
        <div className="campo"><label>Combo: productos que se ofrecen junto con este (opcional)</label>
          <span className="ayuda">Si no eliges ninguno, la tienda sugiere otros de la misma categoría.</span>
          <div className="lista-check">
            {otros.map((p) => (
              <label key={p.id}>
                <input type="checkbox" checked={f.relacionados.includes(p.id)} onChange={() => alternarRelacionado(p.id)} />
                {p.nombre}
              </label>
            ))}
          </div>
        </div>
      )}

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
