'use client'
import { useMemo, useState } from 'react'
import { cop, precioDe, fotosDe } from '../../lib/util'

// Arma un combo de productos distintos que quepa en el presupuesto,
// empezando por el más caro que cabe y variando de categoría.
function armarCombo(productos, presupuesto) {
  const ordenados = [...productos].sort((a, b) => precioDe(b) - precioDe(a))
  const combo = []
  let resto = presupuesto
  const categorias = new Set()
  for (const pasada of [true, false]) {
    for (const p of ordenados) {
      if (combo.length >= 5) break
      if (combo.includes(p) || precioDe(p) > resto) continue
      if (pasada && categorias.has(p.categoria)) continue
      combo.push(p); categorias.add(p.categoria); resto -= precioDe(p)
    }
  }
  return combo
}

export default function Presupuesto({ productos, abrir, agregar }) {
  const [texto, setTexto] = useState('')
  const valor = Number(texto.replace(/\D/g, '')) || 0

  const alcanza = useMemo(
    () => productos.filter((p) => precioDe(p) <= valor).sort((a, b) => precioDe(b) - precioDe(a)),
    [productos, valor]
  )
  const combo = useMemo(() => armarCombo(alcanza, valor), [alcanza, valor])
  const totalCombo = combo.reduce((s, p) => s + precioDe(p), 0)

  return (
    <section className="presupuesto" aria-labelledby="titulo-presupuesto">
      <h2 id="titulo-presupuesto">¿Cuánto quieres gastar?</h2>
      <p className="suave">Escribe tu presupuesto y te mostramos lo que puedes llevar.</p>
      <label className="campo-dinero">
        <span>$</span>
        <input inputMode="numeric" placeholder="Ej: 50.000" aria-label="Tu presupuesto en pesos"
          value={valor ? valor.toLocaleString('es-CO') : ''}
          onChange={(e) => setTexto(e.target.value)} />
        {valor > 0 && <button type="button" className="enlace" onClick={() => setTexto('')}>Borrar</button>}
      </label>

      {valor > 0 && alcanza.length === 0 && (
        <p className="suave">Con {cop(valor)} todavía no alcanza para ningún producto. Prueba con un valor un poco más alto.</p>
      )}

      {combo.length > 1 && (
        <div className="combo">
          <h3>Combo para tu presupuesto</h3>
          {combo.map((p) => (
            <div className="combo-item" key={p.id}>
              {fotosDe(p)[0] ? <img src={fotosDe(p)[0]} alt="" /> : <span className="sinfoto mini" />}
              <button className="enlace" onClick={() => abrir(p)}>{p.nombre}</button>
              <strong>{cop(precioDe(p))}</strong>
            </div>
          ))}
          <div className="linea sin-borde">
            <span>Total {cop(totalCombo)}</span>
            <span className="suave">Te sobran {cop(valor - totalCombo)}</span>
          </div>
          <button className="secundario" onClick={() => combo.forEach((p) => agregar(p, (p.variantes || [])[0]?.nombre || ''))}>
            Agregar combo al carrito
          </button>
        </div>
      )}

      {alcanza.length > 0 && (
        <>
          <h3 className="subtitulo">Puedes comprar ({alcanza.length})</h3>
          <div className="fila-scroll">
            {alcanza.slice(0, 12).map((p) => (
              <button key={p.id} className="mini-tarjeta" onClick={() => abrir(p)}>
                {fotosDe(p)[0] ? <img src={fotosDe(p)[0]} alt="" /> : <span className="sinfoto" />}
                <span className="nombre">{p.nombre}</span>
                <strong>{cop(precioDe(p))}</strong>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
