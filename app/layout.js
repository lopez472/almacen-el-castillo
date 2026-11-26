import './globals.css'
import { Archivo } from 'next/font/google'

const fuente = Archivo({ subsets: ['latin'], display: 'swap' })

const SITIO = 'https://almacen-el-castillo.netlify.app'
const DESCRIPCION =
  'Almacén El Castillo: hogar, cocina, tecnología, ferretería y Navidad. Mira el catálogo y pide por WhatsApp.'

export const metadata = {
  metadataBase: new URL(SITIO),
  title: {
    default: 'Almacén El Castillo · Hogar, cocina, tecnología y ferretería',
    template: '%s · Almacén El Castillo'
  },
  description: DESCRIPCION,
  applicationName: 'Almacén El Castillo',
  keywords: ['Almacén El Castillo', 'almacén', 'hogar', 'cocina', 'tecnología', 'ferretería', 'Navidad', 'variedades'],
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: SITIO,
    siteName: 'Almacén El Castillo',
    title: 'Almacén El Castillo',
    description: DESCRIPCION
  },
  // Pega aquí el código que te da Google Search Console (método "Etiqueta HTML"):
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICACION || undefined }
}

const datosNegocio = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Almacén El Castillo',
  alternateName: 'ALMACÉN EL CASTILLO',
  url: SITIO,
  telephone: '+57 310 368 5448',
  description: DESCRIPCION
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={fuente.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(datosNegocio) }}
        />
        {children}
      </body>
    </html>
  )
}
