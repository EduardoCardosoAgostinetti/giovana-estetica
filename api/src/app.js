import express from 'express'
import cors from 'cors'
import crypto from 'crypto'
import { handleMessage } from './services/conversationEngine.js'
import { listAppointments } from './services/googleCalendar.js'
import { WHATSAPP_LINK } from './data/business.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

function requireAdminPassword(req, res, next) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) {
    return res.status(503).json({ error: 'admin_nao_configurado' })
  }

  const provided = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  const match = a.length === b.length && crypto.timingSafeEqual(a, b)

  if (!match) {
    return res.status(401).json({ error: 'senha_incorreta' })
  }

  next()
}

app.get('/api/admin/appointments', requireAdminPassword, async (req, res) => {
  const daysAhead = Number(req.query.days) || 14
  const appointments = await listAppointments({ daysAhead })
  res.json({ appointments })
})

app.post('/api/message', async (req, res) => {
  const { message, conversationId } = req.body ?? {}

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message é obrigatório e deve ser um texto não vazio' })
  }

  if (typeof conversationId !== 'string' || !conversationId.trim()) {
    return res.status(400).json({ error: 'conversationId é obrigatório (ex: número de telefone da cliente)' })
  }

  const result = await handleMessage(conversationId, message)
  if (result) {
    return res.json({ reply: result.reply, source: 'ia' })
  }

  res.status(503).json({
    error: 'ia_indisponivel',
    reply: `No momento não consigo responder automaticamente. Fala comigo direto no WhatsApp: ${WHATSAPP_LINK}`,
  })
})

export default app
