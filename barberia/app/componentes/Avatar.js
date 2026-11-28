export default function Avatar({ barbero }) {
  return <div className="avatar">{barbero?.foto ? <img src={barbero.foto} alt="" /> : (barbero?.nombre || '?').slice(0, 1).toUpperCase()}</div>
}
