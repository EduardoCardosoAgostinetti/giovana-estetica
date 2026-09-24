import { google } from 'googleapis'

const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID
const TIMEZONE = process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/Sao_Paulo'

export const HOURS_START = process.env.BUSINESS_HOURS_START || '09:00'
export const HOURS_END = process.env.BUSINESS_HOURS_END || '19:00'
const DEFAULT_DURATION_MINUTES = Number(process.env.DEFAULT_APPOINTMENT_DURATION_MINUTES) || 60

const LUNCH_START = process.env.BUSINESS_LUNCH_START || null
const LUNCH_END = process.env.BUSINESS_LUNCH_END || null

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// Confere se um horário (com duração) invade a pausa de almoço configurada.
function overlapsLunch(time, durationMinutes) {
  if (!LUNCH_START || !LUNCH_END) return false
  const start = timeToMinutes(time)
  const end = start + durationMinutes
  return start < timeToMinutes(LUNCH_END) && end > timeToMinutes(LUNCH_START)
}

// Dias da semana abertos, no padrão JS (0=domingo ... 6=sábado). Padrão: segunda a sábado.
const OPEN_DAYS = (process.env.BUSINESS_OPEN_DAYS || '1,2,3,4,5,6')
  .split(',')
  .map((d) => Number(d.trim()))

function isOpenOnDate(date) {
  // Ancora ao meio-dia pra evitar que o fuso horário do servidor jogue a data
  // pro dia anterior/seguinte só por causa da hora.
  const weekday = new Date(`${date}T12:00:00`).getDay()
  return OPEN_DAYS.includes(weekday)
}

export function isConfigured() {
  return Boolean(SERVICE_ACCOUNT_EMAIL && PRIVATE_KEY && CALENDAR_ID)
}

let calendarClient = null

function getCalendar() {
  if (!isConfigured()) return null
  if (!calendarClient) {
    const auth = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    })
    calendarClient = google.calendar({ version: 'v3', auth })
  }
  return calendarClient
}

function addMinutesToTime(time, minutesToAdd) {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutesToAdd
  const endH = Math.floor(total / 60) % 24
  const endM = total % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

// A API de freebusy exige timeMin/timeMax como RFC3339 completo (com offset),
// diferente de events.insert (que aceita dateTime + timeZone separados).
function getUtcOffsetString(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' }).formatToParts(date)
  const tzName = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0'
  const match = tzName.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
  if (!match) return '+00:00'
  const [, sign, hh, mm = '00'] = match
  return `${sign}${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`
}

/**
 * Consulta os horários ocupados na agenda em uma data específica, dentro do horário
 * de funcionamento. A IA usa isso pra descobrir o que está livre.
 */
export async function checkAvailability({ date }) {
  const calendar = getCalendar()
  if (!calendar) {
    return { configured: false, message: 'A integração com a agenda ainda não foi configurada.' }
  }

  if (!isOpenOnDate(date)) {
    return { configured: true, date, closed: true, message: 'Fechado nesse dia da semana.' }
  }

  const offset = getUtcOffsetString(new Date(`${date}T12:00:00`), TIMEZONE)
  const timeMin = `${date}T${HOURS_START}:00${offset}`
  const timeMax = `${date}T${HOURS_END}:00${offset}`

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: TIMEZONE,
      items: [{ id: CALENDAR_ID }],
    },
  })

  const busy = response.data.calendars?.[CALENDAR_ID]?.busy ?? []

  if (LUNCH_START && LUNCH_END) {
    busy.push({
      start: `${date}T${LUNCH_START}:00${offset}`,
      end: `${date}T${LUNCH_END}:00${offset}`,
    })
  }

  return {
    configured: true,
    date,
    businessHours: { start: HOURS_START, end: HOURS_END },
    lunchBreak: LUNCH_START && LUNCH_END ? { start: LUNCH_START, end: LUNCH_END } : null,
    busy: busy.map((b) => ({ start: b.start, end: b.end })),
  }
}

/**
 * Cria o agendamento na agenda. Só deve ser chamado depois que a IA confirmou
 * serviço, data, horário e nome da cliente.
 */
export async function bookAppointment({ service, date, time, durationMinutes, clientName, clientPhone }) {
  const calendar = getCalendar()
  if (!calendar) {
    return { success: false, error: 'A integração com a agenda ainda não foi configurada.' }
  }

  if (!isOpenOnDate(date)) {
    return { success: false, error: 'Fechado nesse dia da semana — não é possível agendar.' }
  }

  const duration = durationMinutes || DEFAULT_DURATION_MINUTES

  if (overlapsLunch(time, duration)) {
    return { success: false, error: `Esse horário invade a pausa de almoço (${LUNCH_START}–${LUNCH_END}) — não é possível agendar.` }
  }

  const endTime = addMinutesToTime(time, duration)

  const event = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    requestBody: {
      summary: `${service} — ${clientName}`,
      description: `Agendado via robô de WhatsApp.\nCliente: ${clientName}\nTelefone: ${clientPhone}\nServiço: ${service}`,
      start: { dateTime: `${date}T${time}:00`, timeZone: TIMEZONE },
      end: { dateTime: `${date}T${endTime}:00`, timeZone: TIMEZONE },
      extendedProperties: {
        private: { clientPhone, clientName, service, reminded: 'false' },
      },
    },
  })

  return {
    success: true,
    eventId: event.data.id,
    eventLink: event.data.htmlLink,
    date,
    time,
    endTime,
  }
}

/**
 * Lista os agendamentos dos próximos N dias, pra tela de admin do site
 * (agenda + status do lembrete de cada cliente).
 */
export async function listAppointments({ daysAhead = 14 } = {}) {
  const calendar = getCalendar()
  if (!calendar) return []

  const response = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: new Date().toISOString(),
    timeMax: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  })

  return (response.data.items ?? []).map((e) => ({
    eventId: e.id,
    date: e.start?.dateTime?.slice(0, 10),
    time: e.start?.dateTime?.slice(11, 16),
    endTime: e.end?.dateTime?.slice(11, 16),
    service: e.extendedProperties?.private?.service ?? e.summary,
    clientName: e.extendedProperties?.private?.clientName ?? null,
    reminded: e.extendedProperties?.private?.reminded === 'true',
  }))
}

/**
 * Busca os próximos agendamentos futuros dessa cliente (pelo telefone). Usado quando
 * ela quer remarcar ou desmarcar, pra IA saber qual agendamento mexer sem perguntar o eventId.
 */
export async function findUpcomingAppointments({ clientPhone }) {
  const calendar = getCalendar()
  if (!calendar) {
    return { configured: false, message: 'A integração com a agenda ainda não foi configurada.' }
  }

  const response = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: new Date().toISOString(),
    privateExtendedProperty: [`clientPhone=${clientPhone}`],
    singleEvents: true,
    orderBy: 'startTime',
  })

  const appointments = (response.data.items ?? []).map((e) => ({
    eventId: e.id,
    service: e.extendedProperties?.private?.service ?? e.summary,
    date: e.start?.dateTime?.slice(0, 10),
    time: e.start?.dateTime?.slice(11, 16),
  }))

  return { configured: true, appointments }
}

/**
 * Move um agendamento existente pra outra data/horário. Sempre tentar isso primeiro
 * quando a cliente quiser desmarcar, antes de cancelar de vez.
 */
export async function rescheduleAppointment({ eventId, date, time, durationMinutes }) {
  const calendar = getCalendar()
  if (!calendar) {
    return { success: false, error: 'A integração com a agenda ainda não foi configurada.' }
  }

  if (!isOpenOnDate(date)) {
    return { success: false, error: 'Fechado nesse dia da semana — não é possível remarcar pra essa data.' }
  }

  const duration = durationMinutes || DEFAULT_DURATION_MINUTES

  if (overlapsLunch(time, duration)) {
    return { success: false, error: `Esse horário invade a pausa de almoço (${LUNCH_START}–${LUNCH_END}) — não é possível remarcar pra esse horário.` }
  }

  const endTime = addMinutesToTime(time, duration)

  const existing = await calendar.events.get({ calendarId: CALENDAR_ID, eventId })
  const privateProps = { ...existing.data.extendedProperties?.private, reminded: 'false' }

  const event = await calendar.events.patch({
    calendarId: CALENDAR_ID,
    eventId,
    requestBody: {
      start: { dateTime: `${date}T${time}:00`, timeZone: TIMEZONE },
      end: { dateTime: `${date}T${endTime}:00`, timeZone: TIMEZONE },
      extendedProperties: { private: privateProps },
    },
  })

  return { success: true, eventId: event.data.id, date, time, endTime }
}

/**
 * Cancela um agendamento de vez. Só deve ser chamado depois que a IA ofereceu remarcar
 * pra outro dia/horário e a cliente confirmou que não quer mais nenhum horário.
 */
export async function cancelAppointment({ eventId }) {
  const calendar = getCalendar()
  if (!calendar) {
    return { success: false, error: 'A integração com a agenda ainda não foi configurada.' }
  }

  await calendar.events.delete({ calendarId: CALENDAR_ID, eventId })
  return { success: true }
}

/**
 * Busca agendamentos que começam daqui a ~2h e ainda não receberam lembrete —
 * usado pelo job de lembrete automático.
 */
export async function findAppointmentsNeedingReminder() {
  const calendar = getCalendar()
  if (!calendar) return []

  const now = Date.now()
  const windowStart = new Date(now + 115 * 60 * 1000).toISOString()
  const windowEnd = new Date(now + 125 * 60 * 1000).toISOString()

  const response = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: windowStart,
    timeMax: windowEnd,
    privateExtendedProperty: ['reminded=false'],
    singleEvents: true,
    orderBy: 'startTime',
  })

  return (response.data.items ?? []).map((e) => ({
    eventId: e.id,
    clientPhone: e.extendedProperties?.private?.clientPhone,
    clientName: e.extendedProperties?.private?.clientName,
    service: e.extendedProperties?.private?.service ?? e.summary,
    date: e.start?.dateTime?.slice(0, 10),
    time: e.start?.dateTime?.slice(11, 16),
  }))
}

/** Marca um agendamento como já lembrado, pra não mandar o lembrete duas vezes. */
export async function markReminded(eventId) {
  const calendar = getCalendar()
  if (!calendar) return
  const existing = await calendar.events.get({ calendarId: CALENDAR_ID, eventId })
  const privateProps = { ...existing.data.extendedProperties?.private, reminded: 'true' }
  await calendar.events.patch({
    calendarId: CALENDAR_ID,
    eventId,
    requestBody: { extendedProperties: { private: privateProps } },
  })
}
