import crypto from 'crypto'

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const APP_SECRET = process.env.WHATSAPP_APP_SECRET
const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0'

export function isConfigured() {
  return Boolean(ACCESS_TOKEN && PHONE_NUMBER_ID)
}

/**
 * Manda uma mensagem de texto pra cliente via WhatsApp Cloud API.
 * Se as credenciais não estiverem configuradas, só loga um aviso (não quebra).
 */
export async function sendMessage(to, text) {
  if (!isConfigured()) {
    console.warn('[whatsapp] credenciais não configuradas — mensagem não enviada:', text)
    return null
  }

  const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Falha ao enviar mensagem pro WhatsApp: ${response.status} ${errorBody}`)
  }

  return response.json()
}

/**
 * Confere a assinatura X-Hub-Signature-256 que a Meta manda em cada webhook,
 * pra garantir que a requisição realmente veio da Meta e não foi forjada.
 * Se WHATSAPP_APP_SECRET não estiver configurado, deixa passar (com aviso) —
 * bom pra testar rápido, mas OBRIGATÓRIO configurar antes de ir pra produção.
 */
export function verifySignature(rawBody, signatureHeader) {
  if (!APP_SECRET) {
    console.warn('[whatsapp] WHATSAPP_APP_SECRET não configurado — assinatura do webhook não verificada')
    return true
  }

  if (!signatureHeader || !rawBody) return false

  const expected = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex')
  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(signatureHeader)

  if (expectedBuffer.length !== receivedBuffer.length) return false
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
}

/**
 * Extrai a mensagem de texto recebida (se houver) de um payload de webhook da Meta.
 * Retorna null para outros tipos de evento (status de entrega, mídia, etc).
 */
export function extractIncomingTextMessage(webhookBody) {
  const value = webhookBody?.entry?.[0]?.changes?.[0]?.value
  const message = value?.messages?.[0]

  if (!message || message.type !== 'text') return null

  return {
    from: message.from,
    text: message.text.body,
    contactName: value?.contacts?.[0]?.profile?.name ?? null,
  }
}
