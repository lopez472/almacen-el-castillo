'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cop, precioDe, fotosDe } from '../../lib/util'
import { Cerrar, Corazon, Flecha } from './Iconos'

export default function DetalleProducto({ producto: p, productos, esFavorito, alternarFavorito, agregar, abrir, cerrar }) {
  const fotos = useMemo(() => fotosDe(p), [p])
  const variantes = p.variantes || []
  const [idx, setIdx] = useState(0)
  const [color, setColor] = useState(variantes[0]?.nombre || '')
  const carrusel = useRef(null)

  useEffect(() => {
    setIdx(0); setColor((p.variantes || [])[0]?.nombre || '')
    carrusel.current?.scrollTo({ left: 0 })
  }, [p])

  useEffect(() => {
    const salir = (e) => e.key === 'Escape' && cerrar()
    window.addEventListener('keydown', salir)
    return () => window.removeEventListener('keydown', salir)
  }, [cerrar])

  const irA = (i) => {
    const el = carrusel.current
    if (!el) return
    const n = (i + fotos.length) % fotos.length
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' })
    setIdx(n)
  }
  const alDesplazar = () => {
    const el = carrusel.current
    if (el) setIdx(Math.round(el.scrollLeft / el.clientWidth))
  }
  const elegirColor = (v) => {
    setColor(v.nombre)
    const i = fotos.indexOf(v.imagen)
    if (i >= 0) irA(i)
  }

  // Combo: los relacionados que eligió el administrador; si no hay, otros de la misma categoría
  const combo = useMemo(() => {
    const elegidos = (p.relacionados || []).map((id) => productos.find((x) => x.id === id)).filter(Boolean)
    const lista = elegidos.length
      ? elegidos
      : productos.filter((x) => x.id !== p.id && x.categoria === p.categoria).slice(0, 2)
    return lista.slice(0, 3)
  }, [p, productos])
  const totalCombo = precioDe(p) + combo.reduce((s, x) => s + precioDe(x), 0)

  const fotoColor = variantes.find((v) => v.nombre === color)?.imagen

  return (
    <div className="fondo" onClick={cerrar}>
      <section className="detalle" role="dialog" aria-modal="true" aria-label={p.nombre} onClick={(e) => e.stopPropagation()}>
        <button className="icono cerrar" onClick={cerrar} aria-label="Cerrar"><Cerrar /></button>

        <div className="galeria">
          {fotos.length ? (
            <div className="carrusel" ref={carrusel} onScroll={alDesplazar}>
              {fotos.map((u, i) => <img key={u} src={u} alt={`${p.nombre} – foto ${i + 1}`} />)}
            </div>
          ) : <div className="sinfoto" />}
          {fotos.length > 1 && (
            <>
              <button className="icono flecha izq" onClick={() => irA(idx - 1)} aria-label="Foto anterior"><Flecha izquierda /></button>
              <button className="icono flecha der" onClick={() => irA(idx + 1)} aria-label="Foto siguiente"><Flecha /></button>
              <div className="puntos">{fotos.map((u, i) => <span key={u} className={i === idx ? 'on' : ''} />)}</div>
            </>
          )}
        </div>
        {fotos.length > 1 && (
          <div className="miniaturas tienda">
            {fotos.map((u, i) => (
              <button key={u} className={i === idx ? 'on' : ''} onClick={() => irA(i)} aria-label={`Ver foto ${i + 1}`}>
                <img src={u} alt="" />
              </button>
            ))}
          </div>
        )}

        <div className="detalle-info">
          <div className="linea sin-borde">
            <h2>{p.nombre}</h2>
            <button className={'icono corazon' + (esFavorito ? ' on' : '')} onClick={() => alternarFavorito(p.id)}
              aria-label={esFavorito ? 'Quitar de me gusta' : 'Me gusta'} aria-pressed={esFavorito}>
              <Corazon lleno={esFavorito} />
            </button>
          </div>
          <p className="precio grande">
            {cop(precioDe(p))}
            {p.precio_oferta ? <span className="tachado">{cop(p.precio)}</span> : null}
          </p>
          {p.descripcion && <p className="descripcion">{p.descripcion}</p>}

          {variantes.length > 0 && (
            <div className="colores">
              <p><strong>Color:</strong> {color}</p>
              <div className="fila">
                {variantes.map((v) => (
                  <button key={v.nombre} className={'chip' + (v.nombre === color ? ' on' : '')} onClick={() => elegirColor(v)}>
                    {v.imagen && <img src={v.imagen} alt="" />}{v.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button className="principal" onClick={() => { agregar(p, color, fotoColor); cerrar() }}>
            Agregar al carrito
          </button>

          {combo.length > 0 && (
            <div className="combo">
              <h3>Arma tu combo</h3>
              <p className="suave">Lleva este producto junto con:</p>
              {[p, ...combo].map((x) => (
                <div className="combo-item" key={x.id}>
                  {fotosDe(x)[0] ? <img src={fotosDe(x)[0]} alt="" /> : <span className="sinfoto mini" />}
                  {x.id === p.id
                    ? <span>{x.nombre}</span>
                    : <button className="enlace" onClick={() => abrir(x)}>{x.nombre}</button>}
                  <strong>{cop(precioDe(x))}</strong>
                </div>
              ))}
              <div className="linea sin-borde"><span>Total del combo</span><strong className="precio">{cop(totalCombo)}</strong></div>
              <button className="secundario" onClick={() => {
                agregar(p, color, fotoColor)
                combo.forEach((x) => agregar(x, (x.variantes || [])[0]?.nombre || ''))
                cerrar()
              }}>Agregar combo al carrito</button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
