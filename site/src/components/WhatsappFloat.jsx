import { WhatsappIcon } from './icons.jsx'
import { WHATSAPP_LINK } from '../data.js'

export default function WhatsappFloat() {
  return (
    <a
      className="whatsapp-float"
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale no WhatsApp"
    >
      <WhatsappIcon size={26} />
    </a>
  )
}
