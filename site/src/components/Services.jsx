import { ServiceIcon } from './icons.jsx'
import Reveal from './Reveal.jsx'
import { CONTACT_LINK, SERVICES } from '../data.js'

export default function Services() {
  return (
    <section className="section services" id="servicos">
      <div className="container">
        <Reveal as="div" className="section-head">
          <p className="eyebrow">Serviços</p>
          <h2>O que eu ofereço para você</h2>
          <p className="section-sub">
            Protocolos faciais e corporais para cuidar da sua pele e realçar seu olhar, com
            naturalidade.
          </p>
        </Reveal>

        <div className="services-grid">
          {SERVICES.map((service) => (
            <Reveal as="article" className="service-card" key={service.id}>
              <div className="service-icon">
                <ServiceIcon name={service.icon} />
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </Reveal>
          ))}

          <Reveal as="article" className="service-card service-card--cta">
            <h3>Não sabe qual escolher?</h3>
            <p>Fale comigo e vamos definir juntas o melhor cuidado para você.</p>
            <a className="btn btn-primary btn-sm" href={CONTACT_LINK} target="_blank" rel="noopener noreferrer">
              Agendar horário
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
