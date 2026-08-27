import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys'
import qrcodeTerminal from 'qrcode-terminal'
import qrcode from 'qrcode'
import pino from 'pino'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUTH_DIR = path.join(__dirname, '../../.baileys-auth')
const QR_IMAGE_PATH = path.join(__dirname, '../../whatsapp-qr.png')

let sock = null
let messageHandler = null

/**
 * Números BR (55 + DDD + 9 dígitos) às vezes aparecem no WhatsApp sem o "9" extra
 * (55 + DDD + 8 dígitos) — o app guarda o número "cru" internamente. Gera as duas
 * variantes pra não perder o match por causa disso.
 */
function brVariants(digits) {
  const variants = new Set([digits])
  if (digits.length === 13 && digits.startsWith('55') && digits[4] === '9') {
    variants.add(digits.slice(0, 4) + digits.slice(5)) // remove o 9
  } else if (digits.length === 12 && digits.startsWith('55')) {
    variants.add(digits.slice(0, 4) + '9' + digits.slice(4)) // adiciona o 9
  }
  return variants
}

/**
 * Se WHATSAPP_TEST_ONLY_NUMBER estiver preenchido, só responde esse número — ignora todo o resto.
 * O WhatsApp às vezes manda o remetente como "@lid" (um ID interno, não o número de telefone) —
 * nesse caso o número de verdade vem em msg.key.senderPn, então checamos os dois.
 */
function isAllowedSender(jid, senderPn) {
  const testOnly = process.env.WHATSAPP_TEST_ONLY_NUMBER
  if (!testOnly) return true
  const allowed = brVariants(testOnly.replace(/\D/g, ''))
  const candidates = [jid, senderPn].filter(Boolean).map((j) => j.split('@')[0].replace(/\D/g, ''))
  return candidates.some((c) => allowed.has(c))
}

/** Registra a função chamada pra cada mensagem de texto recebida (jid, texto). */
export function onMessage(handler) {
  messageHandler = handler
}

export async function sendMessage(jid, text) {
  if (!sock) throw new Error('WhatsApp ainda não conectado')
  await sock.sendMessage(jid, { text })
}

export async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR)
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    auth: state,
    version,
    logger: pino({ level: 'silent' }),
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n📱 Escaneie esse QR code com o WhatsApp do número dedicado ao robô:\n')
      qrcodeTerminal.generate(qr, { small: true })
      qrcode.toFile(QR_IMAGE_PATH, qr, { width: 400 }).catch((err) => {
        console.error('[whatsapp] falha ao salvar QR como imagem:', err.message)
      })
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      if (shouldReconnect) {
        console.log('[whatsapp] conexão fechada, reconectando...')
        connect().catch((err) => console.error('[whatsapp] erro ao reconectar:', err.message))
      } else {
        console.log('[whatsapp] sessão deslogada — apague a pasta .baileys-auth e reinicie pra parear de novo.')
      }
    } else if (connection === 'open') {
      console.log('[whatsapp] conectado com sucesso!')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msg of messages) {
      if (msg.key.fromMe) continue
      if (msg.key.remoteJid?.endsWith('@g.us')) continue // ignora mensagens de grupo
      if (!msg.message) continue

      if (!isAllowedSender(msg.key.remoteJid, msg.key.senderPn)) {
        console.log(`[whatsapp] ignorando mensagem de ${msg.key.senderPn || msg.key.remoteJid} (fora do número de teste)`)
        continue
      }

      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || null
      if (!text) continue // ignora imagem/áudio/figurinha etc. por enquanto

      if (messageHandler) {
        try {
          await messageHandler(msg.key.remoteJid, text, msg.pushName || null)
        } catch (err) {
          console.error('[whatsapp] erro processando mensagem recebida:', err.message)
        }
      }
    }
  })

  return sock
}
