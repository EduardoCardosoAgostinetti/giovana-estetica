import Reveal from './Reveal.jsx'
import { ABOUT_POINTS } from '../data.js'
import giovanaPhoto from '../assets/giovana.jpg'

export default function About() {
  return (
    <section className="section about" id="sobre">
      <div className="container about-inner">
        <Reveal className="about-visual">
          <div className="about-photo">
            <img src={giovanaPhoto} alt="Giovana Gusmão" />
          </div>
          <div className="about-photo-tag">Esteticista &amp; Cosmetóloga</div>
        </Reveal>
        <Reveal className="about-copy">
          <p className="eyebrow">Sobre</p>
          <h2>Cuidado técnico, resultado natural</h2>
          <p>
            Sou Giovana Gusmão, esteticista e cosmetóloga formada em Biomedicina. Acredito que a
            verdadeira beleza está no equilíbrio entre técnica, ciência e respeito às
            características de cada pele.
          </p>
          <p>
            Meu trabalho é pensado para realçar o que já existe de bonito em você — sem exageros,
            com resultados naturais e duradouros.
          </p>
          <ul className="about-list">
            {ABOUT_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
