// Capa de datos: usa Supabase si hay llaves; si no, un modo demo que guarda en el navegador.
import { createClient } from '@supabase/supabase-js'

const URL_SB = process.env.NEXT_PUBLIC_SUPABASE_URL
const LLAVE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
export const MODO_DEMO = !URL_SB || !LLAVE
const sb = MODO_DEMO ? null : createClient(URL_SB, LLAVE)

const ERRORES = {
  HORA_OCUPADA: 'Esa hora acaba de ser tomada. Elige otra, por favor.',
  FECHA_PASADA: 'Esa fecha ya pasó.',
  DATOS_INCOMPLETOS: 'Revisa tu nombre, apellido y número.',
  NO_DISPONIBLE: 'Ese corte o barbero ya no está disponible.'
}
const mensaje = (e) => {
  const k = Object.keys(ERRORES).find((x) => String(e?.message || e).includes(x))
  return k ? ERRORES[k] : 'No se pudo completar. Intenta de nuevo.'
}
const comprobar = ({ data, error }) => { if (error) throw new Error(mensaje(error)); return data }

// ---------------- modo demo ----------------
const CLAVE_DEMO = 'barberia-demo-v1'
const id = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2))
function semilla() {
  const b1 = id(), b2 = id(), s1 = id(), s2 = id(), s3 = id(), s4 = id()
  return {
    configuracion: { id: 1, nombre: 'BARBERÍA', eslogan: 'Agenda tu cita en menos de un minuto', whatsapp: '', direccion: '', apertura: '09:00', cierre: '20:00', intervalo_min: 30, dias: [1, 2, 3, 4, 5, 6], descanso_inicio: '', descanso_fin: '', dias_adelante: 14 },
    servicios: [
      { id: s1, nombre: 'Corte clásico', descripcion: 'Tijera y máquina, acabado limpio', precio: 20000, duracion_min: 30, activo: true, orden: 1 },
      { id: s2, nombre: 'Fade / Degradado', descripcion: 'Degradado bajo, medio o alto', precio: 25000, duracion_min: 40, activo: true, orden: 2 },
      { id: s3, nombre: 'Corte + Barba', descripcion: 'Corte completo y perfilado de barba', precio: 35000, duracion_min: 60, activo: true, orden: 3 },
      { id: s4, nombre: 'Barba', descripcion: 'Perfilado con navaja y toalla caliente', precio: 15000, duracion_min: 20, activo: true, orden: 4 }
    ],
    barberos: [
      { id: b1, nombre: 'Andrés', especialidad: 'Fades y diseños', foto: '', activo: true, orden: 1 },
      { id: b2, nombre: 'Camilo', especialidad: 'Barba y clásicos', foto: '', activo: true, orden: 2 }
    ],
    citas: []
  }
}
let memoria = null // respaldo si el navegador no deja guardar
function leerDemo() {
  if (typeof window === 'undefined') return semilla()
  try { const d = JSON.parse(localStorage.getItem(CLAVE_DEMO)); if (d) return (memoria = d) } catch {}
  if (memoria) return memoria
  const d = semilla(); guardarDemo(d); return d
}
function guardarDemo(d) { memoria = d; try { localStorage.setItem(CLAVE_DEMO, JSON.stringify(d)) } catch {} }
export function reiniciarDemo() { memoria = null; try { localStorage.removeItem(CLAVE_DEMO); localStorage.removeItem('barberia-demo-sesion'); localStorage.removeItem('barberia-cliente') } catch {} }
let sesionDemo = false
const aMin = (h) => { const [a, b] = String(h).split(':').map(Number); return a * 60 + b }
const ordenar = (l) => [...l].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || String(a.nombre).localeCompare(b.nombre))

// ---------------- API ----------------
export async function obtenerConfig() {
  if (MODO_DEMO) return leerDemo().configuracion
  return comprobar(await sb.from('configuracion').select('*').eq('id', 1).single())
}
export async function guardarConfig(c) {
  if (MODO_DEMO) { const d = leerDemo(); d.configuracion = { ...d.configuracion, ...c }; guardarDemo(d); return }
  const limpio = { ...c, descanso_inicio: c.descanso_inicio || null, descanso_fin: c.descanso_fin || null }
  comprobar(await sb.from('configuracion').update(limpio).eq('id', 1))
}

export async function listarServicios({ todos = false } = {}) {
  if (MODO_DEMO) return ordenar(leerDemo().servicios.filter((s) => todos || s.activo))
  let q = sb.from('servicios').select('*').order('orden').order('nombre')
  if (!todos) q = q.eq('activo', true)
  return comprobar(await q)
}
export async function guardarServicio(s) {
  const fila = { nombre: s.nombre, descripcion: s.descripcion || '', precio: Number(s.precio) || 0, duracion_min: Number(s.duracion_min) || 30, activo: !!s.activo, orden: Number(s.orden) || 0 }
  if (MODO_DEMO) {
    const d = leerDemo()
    if (s.id) d.servicios = d.servicios.map((x) => (x.id === s.id ? { ...x, ...fila } : x))
    else d.servicios.push({ id: id(), ...fila })
    guardarDemo(d); return
  }
  comprobar(s.id ? await sb.from('servicios').update(fila).eq('id', s.id) : await sb.from('servicios').insert(fila))
}
export async function borrarServicio(idS) {
  if (MODO_DEMO) { const d = leerDemo(); d.servicios = d.servicios.filter((x) => x.id !== idS); guardarDemo(d); return }
  comprobar(await sb.from('servicios').delete().eq('id', idS))
}

export async function listarBarberos({ todos = false } = {}) {
  if (MODO_DEMO) return ordenar(leerDemo().barberos.filter((b) => todos || b.activo))
  let q = sb.from('barberos').select('*').order('orden').order('nombre')
  if (!todos) q = q.eq('activo', true)
  return comprobar(await q)
}
export async function guardarBarbero(b) {
  const fila = { nombre: b.nombre, especialidad: b.especialidad || '', foto: b.foto || '', activo: !!b.activo, orden: Number(b.orden) || 0 }
  if (MODO_DEMO) {
    const d = leerDemo()
    if (b.id) d.barberos = d.barberos.map((x) => (x.id === b.id ? { ...x, ...fila } : x))
    else d.barberos.push({ id: id(), ...fila })
    guardarDemo(d); return
  }
  comprobar(b.id ? await sb.from('barberos').update(fila).eq('id', b.id) : await sb.from('barberos').insert(fila))
}
export async function borrarBarbero(idB) {
  if (MODO_DEMO) { const d = leerDemo(); d.barberos = d.barberos.filter((x) => x.id !== idB); guardarDemo(d); return }
  comprobar(await sb.from('barberos').delete().eq('id', idB))
}

export async function horasOcupadas(barberoId, fecha) {
  if (MODO_DEMO) {
    return leerDemo().citas.filter((c) => c.barbero_id === barberoId && c.fecha === fecha && c.estado !== 'cancelada')
      .map((c) => ({ hora: c.hora, duracion: c.duracion_min }))
  }
  return comprobar(await sb.rpc('horas_ocupadas', { p_barbero: barberoId, p_fecha: fecha })) || []
}

export async function agendarCita({ nombre, apellido, telefono, servicio, barbero, fecha, hora }) {
  if (MODO_DEMO) {
    const d = leerDemo()
    const choca = d.citas.some((c) => c.barbero_id === barbero.id && c.fecha === fecha && c.estado !== 'cancelada' &&
      aMin(c.hora) < aMin(hora) + servicio.duracion_min && aMin(hora) < aMin(c.hora) + c.duracion_min)
    if (choca) throw new Error(ERRORES.HORA_OCUPADA)
    const cita = { id: id(), creado: new Date().toISOString(), nombre: nombre.trim(), apellido: apellido.trim(), telefono: telefono.replace(/\D/g, ''),
      servicio_id: servicio.id, servicio_nombre: servicio.nombre, precio: servicio.precio, duracion_min: servicio.duracion_min,
      barbero_id: barbero.id, barbero_nombre: barbero.nombre, fecha, hora, estado: 'pendiente', nota: '' }
    d.citas.push(cita); guardarDemo(d); return cita.id
  }
  return comprobar(await sb.rpc('agendar_cita', { p_nombre: nombre, p_apellido: apellido, p_telefono: telefono,
    p_servicio: servicio.id, p_barbero: barbero.id, p_fecha: fecha, p_hora: hora }))
}

export async function listarCitas({ desde, hasta }) {
  if (MODO_DEMO) {
    return leerDemo().citas.filter((c) => c.fecha >= desde && (!hasta || c.fecha <= hasta))
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))
  }
  let q = sb.from('citas').select('*').gte('fecha', desde).order('fecha').order('hora')
  if (hasta) q = q.lte('fecha', hasta)
  return comprobar(await q)
}
export async function actualizarCita(idC, cambios) {
  if (MODO_DEMO) { const d = leerDemo(); d.citas = d.citas.map((c) => (c.id === idC ? { ...c, ...cambios } : c)); guardarDemo(d); return }
  comprobar(await sb.from('citas').update(cambios).eq('id', idC))
}

// ---------------- sesión del panel ----------------
export async function sesionActual() {
  if (MODO_DEMO) { try { if (localStorage.getItem('barberia-demo-sesion')) return { demo: true } } catch {} return sesionDemo ? { demo: true } : null }
  const { data } = await sb.auth.getSession(); return data.session
}
export function alCambiarSesion(cb) {
  if (MODO_DEMO) return () => {}
  const { data } = sb.auth.onAuthStateChange((_e, s) => cb(s)); return () => data.subscription.unsubscribe()
}
export async function entrar(email, clave) {
  if (MODO_DEMO) { sesionDemo = true; try { localStorage.setItem('barberia-demo-sesion', '1') } catch {} return { demo: true } }
  const { data, error } = await sb.auth.signInWithPassword({ email, password: clave })
  if (error) throw new Error('Correo o contraseña incorrectos.')
  return data.session
}
export async function salir() {
  if (MODO_DEMO) { sesionDemo = false; try { localStorage.removeItem('barberia-demo-sesion') } catch {} return }
  await sb.auth.signOut()
}

// ---------------- fotos ----------------
export async function subirFoto(archivo) {
  const reducida = await reducirImagen(archivo, 600)
  if (MODO_DEMO) return reducida
  const blob = await (await fetch(reducida)).blob()
  const ruta = `barberos/${id()}.jpg`
  comprobar(await sb.storage.from('fotos').upload(ruta, blob, { contentType: 'image/jpeg' }))
  return sb.storage.from('fotos').getPublicUrl(ruta).data.publicUrl
}
function reducirImagen(archivo, max) {
  return new Promise((ok, mal) => {
    const img = new Image(); const url = URL.createObjectURL(archivo)
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url)
      ok(c.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = mal; img.src = url
  })
}
