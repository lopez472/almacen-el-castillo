'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIAS, cop } from '../lib/util'

const precioDe = (p) => (p.precio_oferta ? Number(p.precio_oferta) : Number(p.precio))

export default function Tienda() {
  const [productos, setProductos] = useState([])
  const [cargado, setCargado] = useState(false)
  const [config, setConfig] = useState({ nombre: 'ALMACÉN EL CASTILLO', whatsapp: '573103685448', horarios: '' })
  const [cat, setCat] = useState('Todas')
  const [q, setQ] = useState('')
  const [carrito, setCarrito] = useState([])
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    supabase.from('productos').select('*').eq('activo', true).order('creado', { ascending: false })
      .then(({ data }) => { setProductos(data || []); setCargado(true) })
    supabase.from('configuracion').select('*').eq('id', 1).single()
      .then(({ data }) => data && setConfig((c) => ({ ...c, ...data })))
    try { setCarrito(JSON.parse(localStorage.getItem('carrito') || '[]')) } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('carrito', JSON.stringify(carrito)) } catch {}
  }, [carrito])

  const visibles = useMemo(
    () => productos.filter((p) =>
      (cat === 'Todas' || p.categoria === cat) &&
      p.nombre.toLowerCase().includes(q.toLowerCase())),
    [productos, cat, q]
  )

  const agregar = (p) => setCarrito((c) => {
    const ya = c.find((i) => i.id === p.id)
    return ya
      ? c.map((i) => (i.id === p.id ? { ...i, cant: i.cant + 1 } : i))
      : [...c, { id: p.id, nombre: p.nombre, precio: precioDe(p), cant: 1 }]
  })
  const cambiar = (id, d) => setCarrito((c) =>
    c.map((i) => (i.id === id ? { ...i, cant: i.cant + d } : i)).filter((i) => i.cant > 0))

  const total = carrito.reduce((s, i) => s + i.precio * i.cant, 0)
  const unidades = carrito.reduce((s, i) => s + i.cant, 0)
  const mensaje = `Hola, quiero hacer este pedido en ${config.nombre}:\n` +
    carrito.map((i) => `- ${i.cant} x ${i.nombre} (${cop(i.precio)})`).join('\n') +
    `\nTotal: ${cop(total)}`
  const linkPedido = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(mensaje)}`

  return (
    <>
      <header className="barra">
        <h1>{config.nombre}</h1>
        <button onClick={() => setAbierto(true)}>Carrito ({unidades})</button>
      </header>

      <main className="contenedor">
        <input type="search" placeholder="Buscar productos" value={q} onChange={(e) => setQ(e.target.value)} />
        <nav className="cats" aria-label="Categorías">
          {['Todas', ...CATEGORIAS].map((c) => (
            <button key={c} className={c === cat ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>
          ))}
        </nav>

        {!cargado && <p className="vacio">Cargando productos…</p>}
        {cargado && visibles.length === 0 && (
          <p className="vacio">No hay productos en esta categoría todavía.</p>
        )}

        <div className="grilla">
          {visibles.map((p) => (
            <article className="tarjeta" key={p.id}>
              {p.precio_oferta ? <span className="etiqueta">Oferta</span> : null}
              {p.imagenes?.[0] ? <img src={p.imagenes[0]} alt={p.nombre} loading="lazy" /> : <div className="sinfoto" />}
              <div className="info">
                <h3>{p.nombre}</h3>
                <p className="precio">
                  {cop(precioDe(p))}
                  {p.precio_oferta ? <span className="tachado">{cop(p.precio)}</span> : null}
                </p>
                <button onClick={() => agregar(p)}>Agregar al carrito</button>
              </div>
            </article>
          ))}
        </div>

        {config.horarios && <p className="vacio">Horarios: {config.horarios}</p>}
      </main>

      <a className="wa" href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a>

      {abierto && (
        <aside className="panel" aria-label="Carrito">
          <div className="linea"><strong>Tu pedido</strong><button className="sec" onClick={() => setAbierto(false)}>Cerrar</button></div>
          {carrito.length === 0 && <p className="vacio">Tu carrito está vacío. Agrega productos para armar el pedido.</p>}
          {carrito.map((i) => (
            <div className="linea" key={i.id}>
              <span>{i.nombre}<br />{cop(i.precio)}</span>
              <span className="cant">
                <button className="sec" onClick={() => cambiar(i.id, -1)}>−</button>
                {i.cant}
                <button className="sec" onClick={() => cambiar(i.id, 1)}>+</button>
              </span>
            </div>
          ))}
          {carrito.length > 0 && (
            <>
              <p className="precio">Total: {cop(total)}</p>
              <a className="btn-wa" href={linkPedido} target="_blank" rel="noreferrer">Enviar pedido por WhatsApp</a>
            </>
          )}
        </aside>
      )}
    </>
  )
}
