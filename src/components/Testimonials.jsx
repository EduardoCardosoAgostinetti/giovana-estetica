import Reveal from './Reveal.jsx'
import { TESTIMONIALS } from '../data.js'

export default function Testimonials() {
  return (
    <section className="section testimonials" id="depoimentos">
      <div className="container">
        <Reveal as="div" className="section-head">
          <p className="eyebrow">Depoimentos</p>
          <h2>Quem já se cuidou comigo</h2>
        </Reveal>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t) => (
            <Reveal as="blockquote" className="testimonial-card" key={t.id}>
              <p>“{t.quote}”</p>
              <cite>{t.author}</cite>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
