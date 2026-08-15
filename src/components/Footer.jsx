import { LogoMark, InstagramIcon, WhatsappIcon } from './icons.jsx'
import { INSTAGRAM_LINK, WHATSAPP_LINK, NAV_LINKS } from '../data.js'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <a href="#top" className="brand brand--footer">
          <span className="brand-mark" aria-hidden="true">
            <LogoMark size={36} />
          </span>
          <span className="brand-text">
            <strong>Giovana Gusmão</strong>
            <em>Estética</em>
          </span>
        </a>
        <nav className="footer-nav">
          {NAV_LINKS.filter((l) => l.href !== '#depoimentos').map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="footer-social">
          <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <InstagramIcon size={20} />
          </a>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            <WhatsappIcon size={20} />
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} Giovana Gusmão Estética. Todos os direitos reservados.</p>
      </div>
    </footer>
  )
}
