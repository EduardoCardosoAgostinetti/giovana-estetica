import express from 'express'
import cors from 'cors'
import { handleMessage } from './services/conversationEngine.js'
import { WHATSAPP_LINK } from './data/business.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
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
