'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import FormularioProducto from './FormularioProducto'
import ListaProductos from './ListaProductos'
import Configuracion from './Configuracion'

export default function Admin() {
  const [sesion, setSesion] = useState(null)
  const [listo, setListo] = useState(false)
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [aviso, setAviso] = useState('')
  const [productos, setProductos] = useState([])
  const [editando, setEditando] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSesion(data.session); setListo(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSesion(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => { if (sesion) cargar() }, [sesion])

  async function cargar() {
    const { data } = await supabase.from('productos').select('*').order('creado', { ascending: false })
    setProductos(data || [])
  }

  async function entrar(e) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password: clave })
    setAviso(error ? 'Correo o contraseña incorrectos.' : '')
  }

  if (!listo) return <p className="contenedor">Cargando…</p>

  if (!sesion) {
    return (
      <main className="contenedor" style={{ maxWidth: 420 }}>
        <h1>Administrar tienda</h1>
        <form onSubmit={entrar} style={{ marginTop: '1rem' }}>
          <div className="campo"><label>Correo</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="campo"><label>Contraseña</label><input type="password" value={clave} onChange={(e) => setClave(e.target.value)} required /></div>
          <button type="submit">Entrar</button>
          {aviso && <p className="vacio">{aviso}</p>}
        </form>
      </main>
    )
  }

  return (
    <>
      <header className="barra">
        <h1>Administrar tienda</h1>
        <button onClick={() => supabase.auth.signOut()}>Salir</button>
      </header>
      <main className="contenedor">
        {aviso && <p className="caja">{aviso}</p>}
        <FormularioProducto
          editando={editando}
          setAviso={setAviso}
          alTerminar={() => { setEditando(null); cargar() }}
        />
        <ListaProductos
          productos={productos}
          alEditar={(p) => { setEditando(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          alCambiar={cargar}
        />
        <Configuracion setAviso={setAviso} />
      </main>
    </>
  )
}
