// Cálculo de días y horas disponibles + formatos.
export const aMin = (h) => { if (!h) return null; const [a, b] = String(h).split(':').map(Number); return a * 60 + b }
export const aHora = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

export function fechaISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const hoyISO = () => fechaISO(new Date())
export function sumarDias(iso, n) { const [y, m, d] = iso.split('-').map(Number); return fechaISO(new Date(y, m - 1, d + n)) }
export function diaSemana(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).getDay() }

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DIAS_LARGO = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MESES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
export const nombreDia = (iso) => DIAS[diaSemana(iso)]
export const numeroDia = (iso) => Number(iso.split('-')[2])
export const mesCorto = (iso) => MESES[Number(iso.split('-')[1]) - 1]
export function fechaLarga(iso) {
  const [, m, d] = iso.split('-').map(Number)
  return `${DIAS_LARGO[diaSemana(iso)]} ${d} de ${MESES_LARGO[m - 1]}`
}
export function horaBonita(h) {
  const m = aMin(h); const hh = Math.floor(m / 60), mm = m % 60
  const sufijo = hh < 12 ? 'a. m.' : 'p. m.'; const h12 = ((hh + 11) % 12) + 1
  return `${h12}:${String(mm).padStart(2, '0')} ${sufijo}`
}
export const capitalizar = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t)
export const pesos = (n) => '$' + Math.round(Number(n) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')

// Próximos días con atención
export function diasDisponibles(config) {
  const n = Number(config?.dias_adelante) || 14; const abiertos = config?.dias || [1, 2, 3, 4, 5, 6]
  const hoy = hoyISO(); const out = []
  for (let i = 0; i < n; i++) { const f = sumarDias(hoy, i); out.push({ fecha: f, abierto: abiertos.includes(diaSemana(f)) }) }
  return out
}

// Horas libres para un servicio con cierta duración
export function horasLibres(config, fecha, duracion, ocupadas, ahora = new Date()) {
  const ap = aMin(config.apertura || '09:00'), ci = aMin(config.cierre || '20:00'), paso = Number(config.intervalo_min) || 30
  const di = aMin(config.descanso_inicio), df = aMin(config.descanso_fin)
  const minAhora = fecha === fechaISO(ahora) ? ahora.getHours() * 60 + ahora.getMinutes() + 15 : -1
  const occ = (ocupadas || []).map((o) => [aMin(o.hora), aMin(o.hora) + Number(o.duracion)])
  const libres = []
  for (let m = ap; m + duracion <= ci; m += paso) {
    if (m < minAhora) continue
    if (di != null && df != null && m < df && di < m + duracion) continue
    if (occ.some(([a, b]) => a < m + duracion && m < b)) continue
    libres.push(aHora(m))
  }
  return libres
}
