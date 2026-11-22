import './globals.css'
import { Archivo } from 'next/font/google'

const fuente = Archivo({ subsets: ['latin'], display: 'swap' })

export const metadata = {
  title: 'ALMACÉN EL CASTILLO',
  description: 'Hogar, cocina, tecnología, ferretería y Navidad. Pide por WhatsApp.'
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={fuente.className}>{children}</body>
    </html>
  )
}
