export const BUSINESS_NAME = 'Giovana Gusmão Estética'

export const CONTACT_LINK = 'https://www.contate.me/5543988164197'
export const WHATSAPP_LINK = 'https://wa.me/5543988164197'
export const INSTAGRAM_LINK = 'https://www.instagram.com/giovanaaestetica'

// Endereço, horário e preços vêm do .env — troque lá pelos valores reais quando tiver.
export const ADDRESS = process.env.BUSINESS_ADDRESS || 'Endereço não configurado'
export const HOURS = process.env.BUSINESS_HOURS || 'Horário não configurado'

const BASE_SERVICES = [
  { id: 'facial', name: 'Facial', description: 'Limpeza de pele, hidratação e protocolos personalizados para cada tipo de pele.' },
  { id: 'cilios', name: 'Extensão de Cílios', description: 'Técnicas fio a fio e volume para um olhar marcante e natural.' },
  { id: 'corporal', name: 'Corporal', description: 'Tratamentos corporais que cuidam da pele e do bem-estar.' },
  { id: 'lash-lifting', name: 'Lash Lifting', description: 'Curvatura e volume nos cílios naturais, com efeito duradouro.' },
  { id: 'brow', name: 'Brow Lamination', description: 'Sobrancelhas alinhadas e volumosas, com aspecto natural.' },
]

function priceEnvVar(id) {
  return `PRICE_${id.toUpperCase().replace(/-/g, '_')}`
}

export const SERVICES = BASE_SERVICES.map((service) => ({
  ...service,
  price: process.env[priceEnvVar(service.id)] || 'sob consulta',
}))
