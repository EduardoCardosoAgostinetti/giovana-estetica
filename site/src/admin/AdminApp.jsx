import { useEffect, useState } from 'react'
import './admin.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const STORAGE_KEY = 'giovana_admin_password'

function formatDate(dateStr) {
  const date = new Date(`${dateStr}T12:00:00`)
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

export default function AdminApp() {
  const [password, setPassword] = useState(() => sessionStorage.getItem(STORAGE_KEY) || '')
  const [passwordInput, setPasswordInput] = useState('')
  const [appointments, setAppointments] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function loadAppointments(pwd) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/appointments?days=14`, {
        headers: { Authorization: `Bearer ${pwd}` },
      })
      if (res.status === 401) {
        sessionStorage.removeItem(STORAGE_KEY)
        setPassword('')
        setError('Senha incorreta.')
        return
      }
      if (!res.ok) {
        setError('Não consegui carregar a agenda agora.')
        return
      }
      const data = await res.json()
      setAppointments(data.appointments)
      sessionStorage.setItem(STORAGE_KEY, pwd)
    } catch {
      setError('Não consegui conectar com a API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (password) loadAppointments(password)
  }, [])

  function handleLogin(e) {
    e.preventDefault()
    setPassword(passwordInput)
    loadAppointments(passwordInput)
  }

  if (!password || (error === 'Senha incorreta.' && !appointments)) {
    return (
      <div className="admin-login">
        <form onSubmit={handleLogin}>
          <h1>Admin</h1>
          <input
            type="password"
            placeholder="Senha"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            autoFocus
          />
          <button type="submit">Entrar</button>
          {error && <p className="admin-error">{error}</p>}
        </form>
      </div>
    )
  }

  const grouped = (appointments || []).reduce((acc, appt) => {
    (acc[appt.date] ||= []).push(appt)
    return acc
  }, {})

  return (
    <div className="admin-page">
      <header>
        <h1>Agenda — próximos 14 dias</h1>
        <button onClick={() => loadAppointments(password)} disabled={loading}>
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </header>

      {error && <p className="admin-error">{error}</p>}

      {appointments && appointments.length === 0 && <p className="admin-empty">Nenhum agendamento nos próximos 14 dias.</p>}

      {Object.entries(grouped).map(([date, items]) => (
        <section key={date} className="admin-day">
          <h2>{formatDate(date)}</h2>
          <table>
            <thead>
              <tr>
                <th>Horário</th>
                <th>Serviço</th>
                <th>Cliente</th>
                <th>Lembrete</th>
              </tr>
            </thead>
            <tbody>
              {items.map((appt) => (
                <tr key={appt.eventId}>
                  <td>{appt.time} – {appt.endTime}</td>
                  <td>{appt.service}</td>
                  <td>{appt.clientName || '—'}</td>
                  <td>
                    <span className={appt.reminded ? 'tag tag-done' : 'tag tag-pending'}>
                      {appt.reminded ? 'Enviado' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}
