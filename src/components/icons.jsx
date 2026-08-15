import logo from '../assets/logo.jpg'

export function LogoMark({ size = 42 }) {
  return (
    <img
      src={logo}
      alt="Giovana Gusmão Estética"
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: '22%', display: 'block', objectFit: 'cover' }}
    />
  )
}

export function HeroMark() {
  return (
    <img
      src={logo}
      alt="Giovana Gusmão Estética"
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  )
}

export function InstagramIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" />
    </svg>
  )
}

export function WhatsappIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.4-.4.1-.1.2-.2.2-.4.1-.1 0-.3 0-.4-.1-.1-.5-1.3-.7-1.8-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 3.9 3.4.5.2 1 .4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z" />
    </svg>
  )
}

const SERVICE_ICON_PATHS = {
  facial: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 13c1 1.5 2.5 2 4 2s3-.5 4-2" />
      <circle cx="9" cy="10" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  lashes: (
    <>
      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  body: <path d="M12 3c4 3 7 7 7 11a7 7 0 1 1-14 0c0-4 3-8 7-11z" />,
  lift: (
    <>
      <path d="M3 13c3-6 7-8 9-8s6 2 9 8" />
      <path d="M6 12.5c1.5-2.5 4-3.5 6-3.5s4.5 1 6 3.5" />
    </>
  ),
  brow: (
    <>
      <path d="M4 15c2-6 5-9 8-9s6 3 8 9" />
      <path d="M4 15h16" />
    </>
  ),
}

export function ServiceIcon({ name, size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      {SERVICE_ICON_PATHS[name]}
    </svg>
  )
}
