'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { CATEGORIAS, WHATSAPP, cop, precioDe, fotosDe, linkWhatsApp } from '../lib/util'
import { Corazon, Lupa, Carrito, Cerrar, WhatsApp } from './componentes/Iconos'
import DetalleProducto from './componentes/DetalleProducto'
import Presupuesto from './componentes/Presupuesto'
import PiePagina from './componentes/PiePagina'

const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || '') ?? d } catch { return d } }
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

export default function Tienda() {
  const [productos, setProductos] = useState([])
  const [cargado, setCargado] = useState(false)
  const [config, setConfig] = useState({
    nombre: 'ALMACÉN EL CASTILLO', whatsapp: WHATSAPP, horarios: '',
    mensaje_franja: '¡Lo mejor para ti! Pide por WhatsApp al 310 368 5448'
  })
  const [cat, setCat] = useState('Todas')
  const [q, setQ] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [carrito, setCarrito] = useState([])
  const [favoritos, setFavoritos] = useState([])
  const [panel, setPanel] = useState(null) // 'carrito' | 'favoritos' | null
  const [detalle, setDetalle] = useState(null)
  const [aviso, setAviso] = useState('')
  const listo = useRef(false)
  const buscador = useRef(null)

  useEffect(() => {
    supabase.from('productos').select('*').eq('activo', true).order('creado', { ascending: false })
      .then(({ data }) => { setProductos(data || []); setCargado(true) })
    supabase.from('configuracion').select('*').eq('id', 1).single()
      .then(({ data }) => data && setConfig((c) => ({ ...c, ...Object.fromEntries(Object.entries(data).filter(([, v]) => v != null && v !== '')) })))
    setCarrito(leer('carrito', []).map((i) => ({ ...i, clave: i.clave || i.id })))
    setFavoritos(leer('favoritos', []))
    listo.current = true
  }, [])

  useEffect(() => { if (listo.current) guardar('carrito', carrito) }, [carrito])
  useEffect(() => { if (listo.current) guardar('favoritos', favoritos) }, [favoritos])
  useEffect(() => { if (buscando) buscador.current?.focus() }, [buscando])
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), 2200)
    return () => clearTimeout(t)
  }, [aviso])

  const visibles = useMemo(() => {
    const t = q.trim().toLowerCase()
    return productos.filter((p) =>
      (cat === 'Todas' || p.categoria === cat) &&
      (!t || p.nombre.toLowerCase().includes(t) || (p.descripcion || '').toLowerCase().includes(t)))
  }, [productos, cat, q])

  const agregar = useCallback((p, color = '', imagen) => {
    const clave = color ? `${p.id}|${color}` : p.id
    setCarrito((c) => {
      const ya = c.find((i) => i.clave === clave)
      return ya
        ? c.map((i) => (i.clave === clave ? { ...i, cant: i.cant + 1 } : i))
        : [...c, { clave, id: p.id, nombre: p.nombre, color, precio: precioDe(p), imagen: imagen || fotosDe(p)[0] || '', cant: 1 }]
    })
    setAviso(`Agregado: ${p.nombre}${color ? ' (' + color + ')' : ''}`)
  }, [])
  const cambiar = (clave, d) => setCarrito((c) =>
    c.map((i) => (i.clave === clave ? { ...i, cant: i.cant + d } : i)).filter((i) => i.cant > 0))
  const alternarFavorito = useCallback((id) =>
    setFavoritos((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])), [])

  const total = carrito.reduce((s, i) => s + i.precio * i.cant, 0)
  const unidades = carrito.reduce((s, i) => s + i.cant, 0)
  const listaFavoritos = productos.filter((p) => favoritos.includes(p.id))

  const mensajePedido =
    `Hola 👋, quiero confirmar este pedido en ${config.nombre}:\n\n` +
    carrito.map((i, n) =>
      `${n + 1}. ${i.nombre}${i.color ? ` (color: ${i.color})` : ''}\n` +
      `   ${i.cant} x ${cop(i.precio)} = ${cop(i.precio * i.cant)}`).join('\n') +
    `\n\n*Total (${unidades} ${unidades === 1 ? 'artículo' : 'artículos'}): ${cop(total)}*\n\n¿Me confirman disponibilidad y entrega?`
  const linkPedido = linkWhatsApp(config.whatsapp, mensajePedido)
  const linkFlotante = carrito.length
    ? linkPedido
    : linkWhatsApp(config.whatsapp, `Hola 👋, quiero información sobre los productos de ${config.nombre}.`)

  return (
    <>
      {config.mensaje_franja && <div className="franja">{config.mensaje_franja}</div>}

      <header className="encabezado">
        <div className="lado">
          <button className="icono" onClick={() => setPanel('favoritos')} aria-label={`Me gusta (${favoritos.length})`}>
            <Corazon />{favoritos.length > 0 && <span className="globo">{favoritos.length}</span>}
          </button>
        </div>
        <a href="/" className="logo" aria-label={config.nombre}>
          <img src="/logo.png" alt={config.nombre} width="616" height="461" />
        </a>
        <div className="lado derecha">
          <button className={'icono' + (buscando ? ' on' : '')} onClick={() => setBuscando((b) => !b)} aria-label="Buscar" aria-expanded={buscando}>
            <Lupa />
          </button>
          <button className="icono" onClick={() => setPanel('carrito')} aria-label={`Carrito (${unidades})`}>
            <Carrito />{unidades > 0 && <span className="globo">{unidades}</span>}
          </button>
        </div>
      </header>

      {buscando && (
        <div className="buscador">
          <Lupa />
          <input ref={buscador} type="text" enterKeyHint="search" placeholder="¿Qué estás buscando?" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar productos" />
          <button className="icono" onClick={() => { setQ(''); setBuscando(false) }} aria-label="Cerrar búsqueda"><Cerrar /></button>
        </div>
      )}

      <main className="contenedor">
        <nav className="cats" aria-label="Categorías">
          {['Todas', ...CATEGORIAS].map((c) => (
            <button key={c} className={c === cat ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>
          ))}
        </nav>

        {!q && cat === 'Todas' && cargado && productos.length > 0 && (
          <Presupuesto productos={productos} abrir={setDetalle} agregar={agregar} />
        )}

        {q && <p className="suave resultado">{visibles.length} resultado(s) para “{q}”</p>}
        {!cargado && <p className="vacio">Cargando productos…</p>}
        {cargado && visibles.length === 0 && (
          <p className="vacio">{q ? 'No encontramos productos con esa búsqueda.' : 'No hay productos en esta categoría todavía.'}</p>
        )}

        <div className="grilla">
          {visibles.map((p) => {
            const fotos = fotosDe(p)
            const fav = favoritos.includes(p.id)
            return (
              <article className="tarjeta" key={p.id}>
                {p.precio_oferta ? <span className="etiqueta">Oferta</span> : null}
                <button className={'icono corazon flotante' + (fav ? ' on' : '')} onClick={() => alternarFavorito(p.id)}
                  aria-label={fav ? `Quitar ${p.nombre} de me gusta` : `Me gusta ${p.nombre}`} aria-pressed={fav}>
                  <Corazon lleno={fav} />
                </button>
                <button className="foto" onClick={() => setDetalle(p)} aria-label={`Ver ${p.nombre}`}>
                  {fotos[0] ? <img src={fotos[0]} alt={p.nombre} loading="lazy" /> : <div className="sinfoto" />}
                  {fotos.length > 1 && <span className="contador">{fotos.length} fotos</span>}
                </button>
                <div className="info">
                  <h3><button className="enlace titulo" onClick={() => setDetalle(p)}>{p.nombre}</button></h3>
                  {(p.variantes || []).length > 0 && <p className="suave">{p.variantes.length} colores</p>}
                  <p className="precio">
                    {cop(precioDe(p))}
                    {p.precio_oferta ? <span className="tachado">{cop(p.precio)}</span> : null}
                  </p>
                  <button className="principal" onClick={() => ((p.variantes || []).length ? setDetalle(p) : agregar(p))}>
                    {(p.variantes || []).length ? 'Elegir color' : 'Agregar'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>

      </main>

      <PiePagina config={config} />

      <a className="wa" href={linkFlotante} target="_blank" rel="noreferrer"
        aria-label={carrito.length ? 'Enviar mi pedido por WhatsApp' : 'Escríbenos por WhatsApp'}>
        <WhatsApp />{carrito.length ? `Pedir (${cop(total)})` : 'WhatsApp'}
      </a>

      {aviso && <div className="aviso" role="status">{aviso}</div>}

      {detalle && (
        <DetalleProducto
          producto={detalle} productos={productos}
          esFavorito={favoritos.includes(detalle.id)} alternarFavorito={alternarFavorito}
          agregar={agregar} abrir={setDetalle} cerrar={() => setDetalle(null)}
        />
      )}

      {panel && (
        <div className="fondo" onClick={() => setPanel(null)}>
          <aside className="panel" aria-label={panel === 'carrito' ? 'Carrito' : 'Me gusta'} onClick={(e) => e.stopPropagation()}>
            <div className="linea">
              <strong>{panel === 'carrito' ? 'Tu pedido' : 'Tus me gusta'}</strong>
              <button className="icono" onClick={() => setPanel(null)} aria-label="Cerrar"><Cerrar /></button>
            </div>

            {panel === 'favoritos' && (
              <>
                {listaFavoritos.length === 0 && <p className="vacio">Toca el corazón de los productos que te gusten y aparecerán aquí.</p>}
                {listaFavoritos.map((p) => (
                  <div className="item" key={p.id}>
                    {fotosDe(p)[0] ? <img src={fotosDe(p)[0]} alt="" /> : <span className="sinfoto mini" />}
                    <div className="item-texto">
                      <button className="enlace" onClick={() => { setPanel(null); setDetalle(p) }}>{p.nombre}</button>
                      <span className="precio">{cop(precioDe(p))}</span>
                    </div>
                    <div className="item-acciones">
                      <button className="principal chico" onClick={() => ((p.variantes || []).length ? (setPanel(null), setDetalle(p)) : agregar(p))}>Agregar</button>
                      <button className="icono corazon on" onClick={() => alternarFavorito(p.id)} aria-label={`Quitar ${p.nombre}`}><Corazon lleno /></button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {panel === 'carrito' && (
              <>
                {carrito.length === 0 && <p className="vacio">Tu carrito está vacío. Agrega productos para armar el pedido.</p>}
                {carrito.map((i) => (
                  <div className="item" key={i.clave}>
                    {i.imagen ? <img src={i.imagen} alt="" /> : <span className="sinfoto mini" />}
                    <div className="item-texto">
                      <span>{i.nombre}</span>
                      {i.color && <span className="suave">Color: {i.color}</span>}
                      <span className="suave">{i.cant} x {cop(i.precio)} = <strong className="precio">{cop(i.precio * i.cant)}</strong></span>
                    </div>
                    <span className="cant">
                      <button className="sec" onClick={() => cambiar(i.clave, -1)} aria-label="Quitar uno">−</button>
                      {i.cant}
                      <button className="sec" onClick={() => cambiar(i.clave, 1)} aria-label="Agregar uno">+</button>
                    </span>
                  </div>
                ))}
                {carrito.length > 0 && (
                  <div className="resumen">
                    <div className="linea sin-borde"><span>{unidades} {unidades === 1 ? 'artículo' : 'artículos'}</span><strong className="precio grande">Total {cop(total)}</strong></div>
                    <a className="btn-wa" href={linkPedido} target="_blank" rel="noreferrer"><WhatsApp /> Confirmar pedido por WhatsApp</a>
                    <button className="enlace vaciar" onClick={() => confirm('¿Vaciar el carrito?') && setCarrito([])}>Vaciar carrito</button>
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      )}
    </>
  )
}
