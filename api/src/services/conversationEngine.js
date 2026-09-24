import Anthropic from '@anthropic-ai/sdk'
import { betaTool } from '@anthropic-ai/sdk/helpers/beta/json-schema'
import { BUSINESS_NAME, WHATSAPP_LINK, SERVICES, ADDRESS, HOURS } from '../data/business.js'
import {
  checkAvailability,
  bookAppointment,
  findUpcomingAppointments,
  rescheduleAppointment,
  cancelAppointment,
  isConfigured as isCalendarConfigured,
} from './googleCalendar.js'
import { getHistory, appendTurn } from './conversationStore.js'

const MODEL = process.env.AI_MODEL || 'claude-haiku-4-5'
const TIMEZONE = process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/Sao_Paulo'

let client = null

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!client) client = new Anthropic()
  return client
}

function findServiceDuration(service) {
  const matched = SERVICES.find((s) => s.name.toLowerCase() === service.toLowerCase())
    || SERVICES.find((s) => service.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(service.toLowerCase()))
  return matched?.durationMinutes
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
        const durationMinutes = findServiceDuration(service)
        const result = await bookAppointment({ service, date, time, durationMinutes, clientName, clientPhone })
        return JSON.stringify(result)
      },
    }),
    betaTool({
      name: 'find_my_appointments',
      description:
        'Busca os agendamentos futuros dessa cliente (pelo telefone da conversa). Use isso sempre que ela quiser remarcar ou desmarcar, antes de mexer em qualquer coisa — não pergunte o eventId pra ela, é interno.',
      inputSchema: { type: 'object', properties: {} },
      run: async () => {
        const result = await findUpcomingAppointments({ clientPhone })
        return JSON.stringify(result)
      },
    }),
    betaTool({
      name: 'reschedule_appointment',
      description:
        'Move um agendamento existente pra outro dia/horário. Use check_availability antes pra confirmar que o novo horário está livre. Sempre ofereça remarcar primeiro quando a cliente quiser desmarcar — só chame cancel_appointment se ela não quiser nenhum outro horário.',
      inputSchema: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'ID do agendamento, vindo de find_my_appointments' },
          service: { type: 'string', description: 'Nome do serviço desse agendamento, vindo de find_my_appointments (usado pra calcular a duração certa)' },
          date: { type: 'string', description: 'Nova data no formato YYYY-MM-DD' },
          time: { type: 'string', description: 'Novo horário no formato HH:mm' },
        },
        required: ['eventId', 'service', 'date', 'time'],
      },
      run: async ({ eventId, service, date, time }) => {
        const durationMinutes = findServiceDuration(service)
        const result = await rescheduleAppointment({ eventId, date, time, durationMinutes })
        return JSON.stringify(result)
      },
    }),
    betaTool({
      name: 'cancel_appointment',
      description:
        'Cancela um agendamento de vez, sem remarcar. Só use depois de ter oferecido remarcar pra outro dia/horário (via reschedule_appointment) e a cliente confirmar que não quer nenhum outro horário.',
      inputSchema: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'ID do agendamento, vindo de find_my_appointments' },
        },
        required: ['eventId'],
      },
      run: async ({ eventId }) => {
        const result = await cancelAppointment({ eventId })
        return JSON.stringify(result)
      },
    }),
  ]
}

function buildSystemPrompt(clientName) {
  const servicesList = SERVICES.map((s) => `- ${s.name} (${s.price}, dura ${s.durationMinutes} min): ${s.description}`).join('\n')
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE })
  const weekday = new Date().toLocaleDateString('pt-BR', { timeZone: TIMEZONE, weekday: 'long' })
  const calendarNote = isCalendarConfigured()
    ? `Você tem acesso à agenda de verdade da Giovana através das ferramentas check_availability e book_appointment. Use-as para checar horários livres e finalizar o agendamento diretamente — não peça para a cliente agendar em outro lugar.`
    : `A integração com a agenda ainda não foi ativada. Se a cliente quiser agendar, explique que o agendamento automático estará disponível em breve e direcione para o WhatsApp: ${WHATSAPP_LINK}`
  const nameNote = clientName
    ? `NOME DA CLIENTE (já resolvido pelo sistema, não precisa confirmar): "${clientName}". Isso é o nome DELA, mesmo que pareça igual ou parecido com "Giovana" ou com o nome do negócio — é só coincidência de nome, não é você. NUNCA pergunte o nome nesta conversa. Ao chamar a ferramenta book_appointment, use clientName="${clientName}" (ou uma versão curta/primeiro nome dele) direto, sem perguntar nada antes. Só pergunte o nome de verdade se a própria cliente disser que é outra pessoa que vai ao atendimento (ex: "é pra minha mãe").`
    : `Não temos o nome dessa cliente ainda — pergunte com naturalidade se for útil pra conversa, sem soar formal ("como você se chama?" nunca "poderia informar seu nome").`

  return `Você é a Giovana, dona da ${BUSINESS_NAME}, respondendo pessoalmente as clientes no WhatsApp do seu negócio. Você NÃO é uma assistente virtual nem deve se apresentar como robô, sistema ou atendente — você é a própria Giovana conversando.

${nameNote}

Hoje é ${weekday}, ${today} (formato YYYY-MM-DD), fuso horário ${TIMEZONE}.

Serviços oferecidos e preços (informação pra você, não é um cardápio pra recitar):
${servicesList}

Endereço: ${ADDRESS}
Horário de funcionamento: ${HOURS}

${calendarNote}
Se a cliente pedir um dia em que não funcionamos, avise educadamente e sugira o próximo dia útil — nunca confirme fora do horário de funcionamento acima.

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
4. Se o horário estiver livre, finalize o agendamento (use o nome que você já tem — não peça de novo se já souber).
5. Se estiver ocupado, sugira os horários livres mais próximos dentro do horário de funcionamento.

Se a cliente quiser desmarcar ou remarcar um agendamento existente:
1. Use find_my_appointments pra descobrir qual agendamento é (nunca peça o eventId pra ela).
2. SEMPRE ofereça remarcar pra outro dia/horário primeiro — confira disponibilidade com check_availability e use reschedule_appointment.
3. Só cancele de vez com cancel_appointment se a cliente disser claramente que não quer remarcar, que não vai poder ir de jeito nenhum, ou algo do tipo.

A Giovana não cobra sinal/depósito pra confirmar agendamento — nunca mencione isso.

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
      // cache_control cacheia as tools + o prompt de sistema (que não muda entre as mensagens
      // da mesma conversa/dia) — evita pagar esses tokens de novo a cada turno.
      system: [{ type: 'text', text: buildSystemPrompt(clientName), cache_control: { type: 'ephemeral' } }],
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
