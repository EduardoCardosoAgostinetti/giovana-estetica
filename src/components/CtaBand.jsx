import { WhatsappIcon } from './icons.jsx'
import Reveal from './Reveal.jsx'
import { CONTACT_LINK, WHATSAPP_LINK } from '../data.js'

export default function CtaBand() {
  return (
    <section className="section cta-band" id="contato">
      <Reveal as="div" className="container cta-band-inner">
        <div>
          <p className="eyebrow eyebrow--light">Vamos cuidar da sua pele?</p>
          <h2>Agende seu horário e venha se cuidar</h2>
          <p className="section-sub section-sub--light">
            Atendimento com hora marcada. Fale comigo pelo WhatsApp ou pela plataforma de
            agendamento.
          </p>
        </div>
        <div className="cta-band-actions">
          <a className="btn btn-light" href={CONTACT_LINK} target="_blank" rel="noopener noreferrer">
            Agendar horário
          </a>
          <a className="btn btn-outline-light" href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
            <WhatsappIcon />
            WhatsApp
          </a>
        </div>
      </Reveal>
    </section>
  )
}
