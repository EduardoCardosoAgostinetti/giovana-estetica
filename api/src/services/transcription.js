import OpenAI from 'openai'
import { toFile } from 'openai/uploads'

let client = null

function getClient() {
  if (!process.env.OPENAI_API_KEY) return null
  if (!client) client = new OpenAI()
  return client
}

export function isConfigured() {
  return Boolean(process.env.OPENAI_API_KEY)
}

/** Transcreve um áudio (buffer) recebido do WhatsApp. Retorna null se não configurado ou em erro. */
export async function transcribeAudio(buffer, filename = 'audio.ogg') {
  const openai = getClient()
  if (!openai) return null

  try {
    const file = await toFile(buffer, filename)
    const result = await openai.audio.transcriptions.create({
      file,
      model: 'gpt-4o-mini-transcribe',
      language: 'pt',
    })
    return result.text?.trim() || null
  } catch (err) {
    console.error('[transcription] falha ao transcrever áudio:', err.message)
    return null
  }
}
