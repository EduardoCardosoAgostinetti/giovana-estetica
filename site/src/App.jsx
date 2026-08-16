import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import Marquee from './components/Marquee.jsx'
import About from './components/About.jsx'
import Services from './components/Services.jsx'
import Gallery from './components/Gallery.jsx'
import Testimonials from './components/Testimonials.jsx'
import CtaBand from './components/CtaBand.jsx'
import Footer from './components/Footer.jsx'
import WhatsappFloat from './components/WhatsappFloat.jsx'

export default function App() {
  return (
    <>
      <div className="topbar">
        <p>✨ Agende seu horário e realce sua beleza com naturalidade ✨</p>
      </div>

      <Header />

      <main id="top">
        <Hero />
        <Marquee />
        <About />
        <Services />
        <Gallery />
        <Testimonials />
        <CtaBand />
      </main>

      <Footer />
      <WhatsappFloat />
    </>
  )
}
