const SITIO = 'https://almacen-el-castillo.netlify.app'

export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/admin' },
    sitemap: `${SITIO}/sitemap.xml`
  }
}
