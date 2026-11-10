import { InstagramIcon } from './icons.jsx'
import Reveal from './Reveal.jsx'
import { INSTAGRAM_LINK, INSTAGRAM_HANDLE } from '../data.js'

const IMAGES = Object.entries(
  import.meta.glob('../assets/gallery/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' })
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url)

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
          {IMAGES.map((src, i) => (
            <Reveal as="div" key={src} className="gallery-item">
              <img src={src} alt={`Trabalho de estética ${i + 1}`} loading="lazy" />
            </Reveal>
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
