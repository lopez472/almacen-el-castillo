export const CATEGORIAS = [
  'Cocina', 'Tecnología', 'Electrodomésticos', 'Hogar y decoración',
  'Navidad y temporada', 'Ferretería', 'Organización y almacenamiento',
  'Accesorios', 'Otros productos'
]
export const cop = (n) =>
  '$' + Number(n || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })
