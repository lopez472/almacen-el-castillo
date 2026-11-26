import { linkWhatsApp } from '../../lib/util'
import { WhatsApp } from './Iconos'

const Estrellas = ({ n }) => {
  const v = Math.max(0, Math.min(5, Math.round(Number(n) || 0)))
  return (
    <span className="estrellas" aria-label={`${v} de 5 estrellas`}>
      {'★'.repeat(v)}<span className="apagadas">{'★'.repeat(5 - v)}</span>
    </span>
  )
}

export default function PiePagina({ config }) {
  const direccion = (config.direccion || '').trim()
  const enlaceMaps = (config.enlace_maps || '').trim()
  // Google entiende mejor "Calle 15 # 27-10, San Marcos, Sucre, Colombia" que "Calle15 #27-10"
  const paraBuscar = direccion
    .replace(/\b(calle|carrera|cra|cr|cl|kr|diagonal|transversal|avenida|av)\.?\s*(\d)/gi, '$1 $2')
    .replace(/#\s*/g, '# ')
  const conPais = /colombia/i.test(paraBuscar) ? paraBuscar : `${paraBuscar}, Colombia`
  const busqueda = encodeURIComponent(direccion ? conPais : '')
  // Con el enlace del negocio en Maps se abre la ficha exacta (y ahí está "Cómo llegar")
  const comoLlegar = enlaceMaps || (direccion ? `https://www.google.com/maps/dir/?api=1&destination=${busqueda}` : '')
  const verMapa = enlaceMaps || (direccion ? `https://www.google.com/maps/search/?api=1&query=${busqueda}` : '')
  const resenas = (Array.isArray(config.resenas) ? config.resenas : []).filter((r) => r && r.texto)
  const promedio = resenas.length ? resenas.reduce((s, r) => s + (Number(r.estrellas) || 0), 0) / resenas.length : 0

  return (
    <footer className="pie">
      {resenas.length > 0 && (
        <section className="resenas" aria-labelledby="titulo-resenas">
          <div className="linea sin-borde">
            <h2 id="titulo-resenas">Lo que dicen nuestros clientes</h2>
            <span className="promedio"><strong>{promedio.toFixed(1)}</strong> <Estrellas n={promedio} /></span>
          </div>
          <div className="fila-scroll">
            {resenas.map((r, i) => (
              <figure className="resena" key={i}>
                <Estrellas n={r.estrellas} />
                <blockquote>“{r.texto}”</blockquote>
                <figcaption>{r.nombre || 'Cliente'}</figcaption>
              </figure>
            ))}
          </div>
          {verMapa && (
            <a className="enlace-suave" href={verMapa} target="_blank" rel="noreferrer">Ver más reseñas en Google</a>
          )}
        </section>
      )}

      <section className="ubicacion" aria-labelledby="titulo-ubicacion">
        <h2 id="titulo-ubicacion">Visítanos</h2>
        {direccion && <p className="direccion">📍 {direccion}</p>}
        {config.horarios && <p>🕒 {config.horarios}</p>}

        {direccion && (
          <iframe
            className="mapa"
            title={`Mapa de ${config.nombre}`}
            src={`https://www.google.com/maps?q=${busqueda}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}

        <div className="acciones-pie">
          {comoLlegar && (
            <a className="btn-marca" href={comoLlegar} target="_blank" rel="noreferrer">Cómo llegar</a>
          )}
          <a className="btn-borde" href={linkWhatsApp(config.whatsapp, `Hola 👋, quiero información sobre ${config.nombre}.`)} target="_blank" rel="noreferrer">
            <WhatsApp /> Escríbenos
          </a>
        </div>
      </section>

      <p className="creditos">© {new Date().getFullYear()} {config.nombre} · ¡Lo mejor para ti!</p>
    </footer>
  )
}
