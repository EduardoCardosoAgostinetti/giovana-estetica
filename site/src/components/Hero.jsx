import { HeroMark, InstagramIcon } from './icons.jsx'
import Reveal from './Reveal.jsx'
import { CONTACT_LINK, INSTAGRAM_LINK, INSTAGRAM_HANDLE } from '../data.js'

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-decor" aria-hidden="true"></div>
      <div className="container hero-inner">
        <Reveal className="hero-copy">
          <p className="eyebrow">Esteticista &amp; Cosmetóloga · Biomedicina</p>
          <h1>
            Realce sua beleza <em>com naturalidade</em>
          </h1>
          <p className="lead">
            Cuidados faciais e corporais personalizados, com técnica e delicadeza, para você se
            sentir bem na sua própria pele.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={CONTACT_LINK} target="_blank" rel="noopener noreferrer">
              Agendar horário
            </a>
            <a className="btn btn-outline" href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer">
              <InstagramIcon />
              {INSTAGRAM_HANDLE}
            </a>
          </div>
          <div className="hero-stats">
            <div>
              <strong>5+</strong>
              <span>Especialidades</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Atendimento personalizado</span>
            </div>
            <div>
              <strong>⭐ 5.0</strong>
              <span>Clientes satisfeitas</span>
            </div>
          </div>
        </Reveal>
        <Reveal className="hero-visual">
          <div className="hero-frame">
            <HeroMark />
          </div>
          <span className="hero-badge">✨ Naturalidade</span>
          <span className="hero-badge hero-badge--2">🌿 Cuidado</span>
        </Reveal>
      </div>
    </section>
  )
}
