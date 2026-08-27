import express from 'express'
import cors from 'cors'
import { handleMessage } from './services/conversationEngine.js'
import { sendMessage, verifySignature, extractIncomingTextMessage } from './services/whatsapp.js'
import { WHATSAPP_LINK } from './data/business.js'

const app = express()

app.use(cors())
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf
    },
  }),
)

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

// Verificação do webhook: a Meta chama esse endpoint uma vez, na hora de configurar,
// pra confirmar que o dono do endpoint é quem diz ser.
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge)
  }

  res.sendStatus(403)
})

// Recebe as mensagens que chegam no WhatsApp da Giovana.
app.post('/webhook/whatsapp', async (req, res) => {
  const signature = req.get('x-hub-signature-256')

  if (!verifySignature(req.rawBody, signature)) {
    return res.sendStatus(401)
  }

  // Responde rápido pra Meta não reenviar o mesmo evento; o processamento continua depois.
  res.sendStatus(200)

  try {
    const incoming = extractIncomingTextMessage(req.body)
    if (!incoming) return // ignora status de entrega, mídia, etc. por enquanto

    const result = await handleMessage(incoming.from, incoming.text)
    const reply = result
      ? result.reply
      : `No momento não consigo responder automaticamente. Fala comigo direto: ${WHATSAPP_LINK}`

    await sendMessage(incoming.from, reply)
  } catch (err) {
    console.error('Erro processando webhook do WhatsApp:', err.message)
  }
})

export default app
