import { InstagramIcon } from './icons.jsx'
import Reveal from './Reveal.jsx'
import { INSTAGRAM_LINK, INSTAGRAM_HANDLE } from '../data.js'

const TILES = Array.from({ length: 7 }, (_, i) => (i % 2 === 0 ? '' : 'alt'))

export default function Gallery() {
  return (
    <section className="section gallery" id="galeria">
      <div className="container">
        <Reveal as="div" className="section-head">
          <p className="eyebrow">Galeria</p>
          <h2>Um pouco do meu trabalho</h2>
          <p className="section-sub">
            Acompanhe mais fotos, vídeos e novidades no Instagram{' '}
            <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer">
              {INSTAGRAM_HANDLE}
            </a>
            .
          </p>
        </Reveal>
        <div className="gallery-grid">
          {TILES.map((variant, i) => (
            <Reveal as="div" key={i} className={`gallery-item ${variant}`.trim()} />
          ))}
          <Reveal
            as="a"
            className="gallery-item gallery-item--cta"
            href={INSTAGRAM_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            <InstagramIcon size={26} />
            <span>Ver no Instagram</span>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
