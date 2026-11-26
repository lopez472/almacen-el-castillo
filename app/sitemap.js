const SITIO = 'https://almacen-el-castillo.netlify.app'

export default function sitemap() {
  return [{ url: SITIO, lastModified: new Date(), changeFrequency: 'daily', priority: 1 }]
}
