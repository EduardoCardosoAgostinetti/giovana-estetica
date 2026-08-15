const ITEMS = 'Facial ✦ Cílios ✦ Corporal ✦ Lash Lifting ✦ Brow Lamination ✦ '.repeat(5)

export default function Marquee() {
  return (
    <section className="marquee" aria-hidden="true">
      <div className="marquee-track">
        <span>{ITEMS}</span>
        <span>{ITEMS}</span>
      </div>
    </section>
  )
}
