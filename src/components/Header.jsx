import { useEffect, useState } from 'react'
import { LogoMark } from './icons.jsx'
import { CONTACT_LINK, NAV_LINKS } from '../data.js'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="site-header"
      id="header"
      style={{ boxShadow: isScrolled ? '0 8px 20px -12px rgba(62,46,40,0.25)' : 'none' }}
    >
      <div className="container header-inner">
        <a href="#top" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <LogoMark size={42} />
          </span>
          <span className="brand-text">
            <strong>Giovana Gusmão</strong>
            <em>Estética</em>
          </span>
        </a>

        <nav className={`nav${isOpen ? ' is-open' : ''}`} id="nav">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <a className="btn btn-primary" href={CONTACT_LINK} target="_blank" rel="noopener noreferrer">
            Agendar horário
          </a>
          <button
            className="nav-toggle"
            aria-label="Abrir menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((v) => !v)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  )
}
