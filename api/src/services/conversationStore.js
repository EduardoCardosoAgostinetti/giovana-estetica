// Memória de conversa em memória (por número de telefone/conversationId).
// Não persiste em disco de propósito: a agenda do Google é a fonte da verdade
// pros agendamentos, então perder o histórico de conversa num restart só
// significa que a IA "esquece" o contexto — não perde nenhum agendamento real.

const CONVERSATION_TTL_MS = 30 * 60 * 1000 // 30 minutos de inatividade

const conversations = new Map()

function isExpired(conversation) {
  return Date.now() - conversation.updatedAt > CONVERSATION_TTL_MS
}

export function getHistory(conversationId) {
  const conversation = conversations.get(conversationId)
  if (!conversation || isExpired(conversation)) return []
  return conversation.messages
}

export function appendTurn(conversationId, userMessage, assistantReply) {
  const history = getHistory(conversationId)
  const messages = [
    ...history,
    { role: 'user', content: userMessage },
    { role: 'assistant', content: assistantReply },
  ]
  conversations.set(conversationId, { messages, updatedAt: Date.now() })
}

// Limpeza periódica das conversas expiradas, pra não crescer sem limite.
setInterval(() => {
  for (const [id, conversation] of conversations) {
    if (isExpired(conversation)) conversations.delete(id)
  }
}, 5 * 60 * 1000).unref()
