export const CATEGORIAS = [
  'Cocina', 'Tecnología', 'Electrodomésticos', 'Hogar y decoración',
  'Navidad y temporada', 'Ferretería', 'Organización y almacenamiento',
  'Accesorios', 'Otros productos'
]

export const WHATSAPP = '573103685448'

export const cop = (n) =>
  '$' + Number(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })

export const precioDe = (p) => (p.precio_oferta ? Number(p.precio_oferta) : Number(p.precio))

// Acepta "3103685448", "57 310 368 5448", etc. y devuelve "573103685448"
export const numeroWhatsApp = (n) => {
  const d = String(n || '').replace(/\D/g, '')
  if (!d) return WHATSAPP
  return d.length === 10 ? '57' + d : d
}

export const linkWhatsApp = (numero, texto) =>
  `https://wa.me/${numeroWhatsApp(numero)}${texto ? '?text=' + encodeURIComponent(texto) : ''}`

export const fotosDe = (p) => {
  const fotos = [...(p.imagenes || [])]
  for (const v of p.variantes || []) if (v.imagen && !fotos.includes(v.imagen)) fotos.push(v.imagen)
  return fotos
}
