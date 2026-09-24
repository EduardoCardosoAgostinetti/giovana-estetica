// Lembrete automático 2h antes do horário — a Giovana já fazia isso manualmente
// ("Estou passando pra lembrar do seu horário..."), aqui só automatizamos.
import { findAppointmentsNeedingReminder, markReminded, isConfigured } from './googleCalendar.js'
import { appendTurn } from './conversationStore.js'

const CHECK_INTERVAL_MS = 5 * 60 * 1000 // 5 min — cobre a janela de 10min (1h55-2h05) sem furos

function buildReminderText(clientName, service, time) {
  const name = clientName ? clientName.split(' ')[0] : null
  const greeting = name ? `Oii, ${name}!` : 'Oii!'
  return `${greeting} Tudo bem? Só passando pra lembrar do seu horário hoje às ${time.replace(':', 'h')} pra ${service}. Posso confirmar? 🥰`
}

/** Inicia o job que checa a cada 5min se tem agendamento chegando em ~2h e manda lembrete. */
export function startReminderLoop(sendMessage) {
  if (!isConfigured()) return

  setInterval(async () => {
    try {
      const appointments = await findAppointmentsNeedingReminder()
      for (const appt of appointments) {
        if (!appt.clientPhone) continue
        const text = buildReminderText(appt.clientName, appt.service, appt.time)
        try {
          await sendMessage(appt.clientPhone, text)
          appendTurn(appt.clientPhone, '[sistema] hora de enviar lembrete automático do agendamento', text)
          await markReminded(appt.eventId)
          console.log(`[lembrete] enviado pra ${appt.clientPhone} (agendamento ${appt.eventId})`)
        } catch (err) {
          console.error(`[lembrete] falha ao enviar pra ${appt.clientPhone}:`, err.message)
        }
      }
    } catch (err) {
      console.error('[lembrete] erro checando agendamentos:', err.message)
    }
  }, CHECK_INTERVAL_MS).unref()
}
