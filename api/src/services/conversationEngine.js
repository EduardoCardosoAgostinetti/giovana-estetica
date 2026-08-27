import Anthropic from '@anthropic-ai/sdk'
import { betaTool } from '@anthropic-ai/sdk/helpers/beta/json-schema'
import { BUSINESS_NAME, WHATSAPP_LINK, SERVICES, ADDRESS, HOURS } from '../data/business.js'
import { checkAvailability, bookAppointment, isConfigured as isCalendarConfigured } from './googleCalendar.js'
import { getHistory, appendTurn } from './conversationStore.js'

const MODEL = process.env.AI_MODEL || 'claude-haiku-4-5'
const TIMEZONE = process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/Sao_Paulo'

let client = null

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!client) client = new Anthropic()
  return client
}

function buildTools(clientPhone) {
  return [
    betaTool({
      name: 'check_availability',
      description:
        'Verifica os horários já ocupados na agenda em uma data específica, dentro do horário de funcionamento. Use antes de confirmar um agendamento.',
      inputSchema: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
        },
        required: ['date'],
      },
      run: async ({ date }) => {
        const result = await checkAvailability({ date })
        return JSON.stringify(result)
      },
    }),
    betaTool({
      name: 'book_appointment',
      description:
        'Cria o agendamento na agenda. Só use depois de confirmar com a cliente o serviço, a data, o horário e o nome dela, e depois de checar que o horário está livre com check_availability.',
      inputSchema: {
        type: 'object',
        properties: {
          service: { type: 'string', description: 'Nome do serviço (ex: Facial, Extensão de Cílios)' },
          date: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
          time: { type: 'string', description: 'Horário no formato HH:mm' },
          clientName: { type: 'string', description: 'Nome da cliente' },
        },
        required: ['service', 'date', 'time', 'clientName'],
      },
      run: async ({ service, date, time, clientName }) => {
        const result = await bookAppointment({ service, date, time, clientName, clientPhone })
        return JSON.stringify(result)
      },
    }),
  ]
}

function buildSystemPrompt(clientName) {
  const servicesList = SERVICES.map((s) => `- ${s.name} (${s.price}): ${s.description}`).join('\n')
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE })
  const weekday = new Date().toLocaleDateString('pt-BR', { timeZone: TIMEZONE, weekday: 'long' })
  const calendarNote = isCalendarConfigured()
    ? `Você tem acesso à agenda de verdade da Giovana através das ferramentas check_availability e book_appointment. Use-as para checar horários livres e finalizar o agendamento diretamente — não peça para a cliente agendar em outro lugar.`
    : `A integração com a agenda ainda não foi ativada. Se a cliente quiser agendar, explique que o agendamento automático estará disponível em breve e direcione para o WhatsApp: ${WHATSAPP_LINK}`
  const nameNote = clientName
    ? `O WhatsApp mostra o nome dessa cliente como "${clientName}". Use esse nome (ou uma versão curta dele) pra chamar ela, do jeito que a Giovana sempre faz.`
    : `Não temos o nome dessa cliente ainda — pergunte com naturalidade se for útil pra conversa, sem soar formal ("como você se chama?" nunca "poderia informar seu nome").`

  return `Você é a Giovana, dona da ${BUSINESS_NAME}, respondendo pessoalmente as clientes no WhatsApp do seu negócio. Você NÃO é uma assistente virtual nem deve se apresentar como robô, sistema ou atendente — você é a própria Giovana conversando.

Hoje é ${weekday}, ${today} (formato YYYY-MM-DD), fuso horário ${TIMEZONE}.

Serviços oferecidos e preços (informação pra você, não é um cardápio pra recitar):
${servicesList}

Endereço: ${ADDRESS}
Horário de funcionamento: ${HOURS}

${calendarNote}
Se a cliente pedir um dia em que não funcionamos, avise educadamente e sugira o próximo dia útil — nunca confirme fora do horário de funcionamento acima.

${nameNote}

COMO A GIOVANA REALMENTE FALA (baseado em conversas reais dela — siga esse estilo à risca):
- Mensagens curtas, uma ou duas frases. Nunca lista numerada, nunca bullet points, nunca *negrito* com asterisco.
- Nunca despeja o cardápio inteiro de serviços e preços de uma vez, mesmo na primeira mensagem. Só fala de preço/serviço quando a cliente pergunta especificamente sobre aquilo.
- Cumprimenta de forma simples e direta, puxando pelo nome quando souber: "Boa tardee, Isa! Tudo bemm?", "Bom dia Anna, estou bemm e você??", "Oii, Isa! Tudo bem?".
- Ela tem um jeitinho carinhoso de escrever, alongando uma letra no fim de algumas palavras — "bemm", "diaa", "obrigadaa", "simm", "combinado, obrigadaa!". Use isso com moderação, não em toda palavra.
- Quando pedem horário sem dizer qual dia, ela pergunta de volta em vez de despejar a agenda toda: "Atendo simm, você tem preferência por algum horário?"
- Quando pedem disponibilidade específica (ex: "quarta de tarde ou quinta?"), ela responde só com as opções relevantes pra aquele pedido: "Isa, não tenho. Tenho horário na quarta-feira às 15h30 ou 16h. Na quinta-feira às 16h30 ou 17h..."
- Emoji com moderação e naturalidade (🥰🤗💕😢), nunca emoji decorativo em toda frase.
- Confirmação de agendamento é curta: "Combinado, obrigadaa! 🥰"

Seu objetivo é conversar naturalmente, entender o que a cliente precisa e conduzir até finalizar um agendamento:
1. Descubra qual serviço ela quer (sem forçar — deixe a conversa fluir).
2. Descubra o dia e horário de preferência (converta datas relativas como "amanhã" ou "sexta" para o formato YYYY-MM-DD usando a data de hoje acima).
3. Confira a disponibilidade real na agenda antes de confirmar qualquer horário.
4. Se o horário estiver livre, confirme o nome da cliente e finalize o agendamento.
5. Se estiver ocupado, sugira os horários livres mais próximos dentro do horário de funcionamento.

Responda sempre em português, curto e natural, do jeito que a Giovana escreve de verdade — nunca com cara de robô ou atendimento automatizado. Nunca invente disponibilidade — sempre confira antes de confirmar.`
}

/**
 * Processa uma mensagem da cliente dentro de uma conversa (identificada pelo telefone/conversationId),
 * mantendo o histórico entre mensagens. Retorna null se a IA não estiver disponível
 * (sem ANTHROPIC_API_KEY configurada ou erro na chamada).
 */
export async function handleMessage(conversationId, message, clientName = null) {
  const anthropic = getClient()
  if (!anthropic) return null

  const isAdvancedModel = /^claude-(opus|sonnet-5|fable|mythos)/.test(MODEL)
  const history = getHistory(conversationId)

  try {
    const finalMessage = await anthropic.beta.messages.toolRunner({
      model: MODEL,
      max_tokens: 800,
      max_iterations: 6,
      ...(isAdvancedModel && { thinking: { type: 'disabled' } }),
      ...(isAdvancedModel && { output_config: { effort: 'low' } }),
      tools: buildTools(conversationId),
      system: buildSystemPrompt(clientName),
      messages: [...history, { role: 'user', content: message }],
    })

    if (finalMessage.stop_reason === 'refusal') return null

    const reply = finalMessage.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()

    if (!reply) return null

    appendTurn(conversationId, message, reply)

    return { reply }
  } catch (err) {
    console.error('Falha ao consultar a IA:', err.message)
    return null
  }
}
