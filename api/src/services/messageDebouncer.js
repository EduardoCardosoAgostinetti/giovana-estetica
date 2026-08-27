// Junta mensagens picadas da cliente numa só, e espera um tempo aleatório antes
// de responder — evita responder instantâneo (sinal clássico de robô) e dá tempo
// da cliente terminar de digitar tudo antes da IA processar o contexto completo.

const MIN_DELAY_MS = Number(process.env.WHATSAPP_MIN_DELAY_MS) || 2 * 60 * 1000 // 2 min
const MAX_DELAY_MS = Number(process.env.WHATSAPP_MAX_DELAY_MS) || 10 * 60 * 1000 // 10 min
const MAX_TOTAL_WAIT_MS = Number(process.env.WHATSAPP_MAX_TOTAL_WAIT_MS) || 15 * 60 * 1000 // teto

const pending = new Map()

function randomDelay() {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)
}

/**
 * Acumula uma mensagem pra uma conversa. Reinicia o timer a cada nova mensagem
 * (a cliente ainda pode estar digitando), mas nunca espera mais que MAX_TOTAL_WAIT_MS
 * desde a primeira mensagem do lote — garante que sempre responde em algum momento.
 */
export function enqueueMessage(conversationId, text, onReady, clientName) {
  const now = Date.now()
  let entry = pending.get(conversationId)

  if (!entry) {
    entry = { messages: [], firstMessageAt: now, timer: null, clientName: null }
    pending.set(conversationId, entry)
  }

  entry.messages.push(text)
  if (clientName) entry.clientName = clientName
  if (entry.timer) clearTimeout(entry.timer)

  const elapsed = now - entry.firstMessageAt
  const remainingCap = Math.max(MAX_TOTAL_WAIT_MS - elapsed, 0)
  const delay = Math.min(randomDelay(), remainingCap)

  entry.timer = setTimeout(() => {
    pending.delete(conversationId)
    onReady(entry.messages.join('\n'), entry.clientName)
  }, delay)
}
