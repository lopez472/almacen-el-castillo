'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { CATEGORIAS, cop } from '../../lib/util'

const vacio = { nombre: '', descripcion: '', precio: '', precio_oferta: '', categoria: CATEGORIAS[0], imagenes: [], activo: true, destacado: false }

export default function Admin() {
  const [sesion, setSesion] = useState(null)
  const [listo, setListo] = useState(false)
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [aviso, setAviso] = useState('')
  const [productos, setProductos] = useState([])
  const [f, setF] = useState(vacio)
  const [editando, setEditando] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [config, setConfig] = useState({ nombre: '', whatsapp: '', horarios: '' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSesion(data.session); setListo(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => { if (sesion) cargar() }, [sesion])

  async function cargar() {
    const { data } = await supabase.from('productos').select('*').order('creado', { ascending: false })
    setProductos(data || [])
    const { data: c } = await supabase.from('configuracion').select('*').eq('id', 1).single()
    if (c) setConfig(c)
  }

  async function entrar(e) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password: clave })
    setAviso(error ? 'Correo o contraseña incorrectos.' : '')
  }

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
      ? await supabase.from('productos').update(fila).eq('id', editando)
      : await supabase.from('productos').insert(fila)
    if (error) return setAviso('No se pudo guardar: ' + error.message)
    setAviso('Producto guardado.')
    setF(vacio); setEditando(null); cargar()
  }

  async function borrar(id) {
    if (!confirm('¿Eliminar este producto?')) return
    await supabase.from('productos').delete().eq('id', id)
    cargar()
  }

  async function alternar(p) {
    await supabase.from('productos').update({ activo: !p.activo }).eq('id', p.id)
    cargar()
  }

  async function guardarConfig(e) {
    e.preventDefault()
    const { error } = await supabase.from('configuracion').upsert({ id: 1, nombre: config.nombre, whatsapp: config.whatsapp, horarios: config.horarios })
    setAviso(error ? 'No se pudo guardar: ' + error.message : 'Configuración guardada.')
  }

  if (!listo) return <p className="contenedor">Cargando…</p>

  if (!sesion) {
    return (
      <main className="contenedor" style={{ maxWidth: 420 }}>
        <h1>Administrar tienda</h1>
        <form onSubmit={entrar} style={{ marginTop: '1rem' }}>
          <div className="campo"><label>Correo</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="campo"><label>Contraseña</label><input type="password" value={clave} onChange={(e) => setClave(e.target.value)} required /></div>
          <button type="submit">Entrar</button>
          {aviso && <p className="vacio">{aviso}</p>}
        </form>
      </main>
    )
  }

  return (
    <>
      <header className="barra">
        <h1>Administrar tienda</h1>
        <button onClick={() => supabase.auth.signOut()}>Salir</button>
      </header>
      <main className="contenedor">
        {aviso && <p className="caja">{aviso}</p>}

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
            {editando && <button type="button" className="sec" onClick={() => { setF(vacio); setEditando(null) }}>Cancelar</button>}
          </div>
        </form>

        <h2>Productos ({productos.length})</h2>
        {productos.length === 0 && <p className="vacio">Aún no hay productos.
