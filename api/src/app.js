import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/message', (req, res) => {
  const { message } = req.body ?? {}

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message é obrigatório e deve ser um texto não vazio' })
  }

  res.json({ message })
})

export default app
