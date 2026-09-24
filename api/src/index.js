import 'dotenv/config'
import app from './app.js'
import { connect, sendMessage, onMessage } from './services/whatsappBaileys.js'
import { enqueueMessage } from './services/messageDebouncer.js'
import { handleMessage } from './services/conversationEngine.js'
import { startReminderLoop } from './services/reminderScheduler.js'

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`)
})

if (process.env.WHATSAPP_ENABLED === 'true') {
  onMessage((jid, text, pushName) => {
    console.log(`[whatsapp] mensagem recebida de ${jid} (${pushName || 'sem nome'}): "${text}" — aguardando o delay pra responder`)

    enqueueMessage(jid, text, async (combinedText, clientName) => {
      console.log(`[whatsapp] processando conversa com ${jid} agora`)
      const result = await handleMessage(jid, combinedText, clientName)
      if (result) {
        await sendMessage(jid, result.reply)
        console.log(`[whatsapp] resposta enviada pra ${jid}`)
      } else {
        console.log(`[whatsapp] IA indisponível — não respondeu pra ${jid}`)
      }
    }, pushName)
  })

  connect().catch((err) => console.error('[whatsapp] erro ao conectar:', err.message))
  startReminderLoop(sendMessage)
}
