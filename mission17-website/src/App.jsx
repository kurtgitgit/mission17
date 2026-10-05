import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  FileText,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Smartphone,
  UsersRound,
  X,
} from 'lucide-react';

const OFFICIALS = [
  { name: 'Rogie B. Quillope', position: 'Punong Barangay', contact: '09544153509', term: '2023–2026' },
  { name: 'John Benedict B. Zarate', position: 'Barangay Kagawad', committee: 'Health & Sanitation', termNumber: '1st Term' },
  { name: 'Armando M. Quillope Jr.', position: 'Barangay Kagawad', committee: 'Appropriation', termNumber: 'Last Term' },
  { name: 'Juan C. Fontalba', position: 'Barangay Kagawad', committee: 'Infrastructure', termNumber: '1st Term' },
  { name: 'Jose A. Malinao', position: 'Barangay Kagawad', committee: 'Environmental Protection', termNumber: '1st Term' },
  { name: 'Joel F. Ramos', position: 'Barangay Kagawad', committee: 'Agricultural', termNumber: '2nd Term' },
  { name: 'Juanito R. Ramos', position: 'Barangay Kagawad', committee: 'Peace and Order', termNumber: '2nd Term' },
  { name: 'Kerubin C. Ramos', position: 'Barangay Kagawad', committee: 'Education', termNumber: '1st Term' },
  { name: 'Bhea Monique San Miguel', position: 'Barangay Secretary', contact: '09916982914', email: 'b.pag.asasj@gmail.com' },
  { name: 'Raymond Bautista', position: 'Chief Tanod', contact: '09336828737' },
  { name: 'Zenaida Velasco', position: 'BHW President', contact: '09074401517' },
];

const SERVICES = [
  {
    icon: <FileText aria-hidden="true" />,
    title: 'Document requests',
    description: 'Submit a request for barangay documents and follow its status through the BrgyLink app.',
  },
  {
    icon: <ShieldCheck aria-hidden="true" />,
    title: 'Blotter reporting',
    description: 'File an incident report with the location, date, time, narrative, and supporting evidence.',
  },
  {
    icon: <MessageCircle aria-hidden="true" />,
    title: 'Citizen feedback',
    description: 'Send concerns, inquiries, or suggestions directly to the barangay for review and response.',
  },
];

function FadeInSection({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const target = ref.current;
    if (!target) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12 });

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={`fade-in-section${isVisible ? ' is-visible' : ''}`}>{children}</div>;
}

function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>

      <div className="top-banner" role="status">
        <span className="top-banner-dot" aria-hidden="true" />
        Official digital portal of Barangay Bagong Pag-asa, San Jacinto, Pangasinan
      </div>

      <nav className={`site-nav${isScrolled ? ' site-nav-scrolled' : ''}`} aria-label="Primary navigation">
        <a className="site-brand" href="#home" onClick={closeMenu} aria-label="BrgyLink home">
          <img src="/logo.png" alt="BrgyLink logo" />
          <span>
            <strong>Barangay Bagong Pag-asa</strong>
            <small>BrgyLink digital portal</small>
          </span>
        </a>

        <div className="desktop-nav-links">
          <a href="#about">About</a>
          <a href="#services">Services</a>
          <a href="#officials">Officials</a>
          <a href="#contact">Contact</a>
          <a href="/infographic-manual.html?v=white" target="_blank" rel="noopener noreferrer">User Manual</a>
        </div>

        <a className="nav-download" href="/BrgyLink.apk" download="BrgyLink.apk">
          <Smartphone size={17} aria-hidden="true" /> Download app
        </a>

        <button
          type="button"
          className="mobile-menu-button"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        {isMenuOpen && (
          <div className="mobile-nav-panel">
            <a href="#about" onClick={closeMenu}>About</a>
            <a href="#services" onClick={closeMenu}>Services</a>
            <a href="#officials" onClick={closeMenu}>Officials</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
            <a href="/infographic-manual.html?v=white" target="_blank" rel="noopener noreferrer" onClick={closeMenu}>User Manual</a>
            <a className="mobile-download" href="/BrgyLink.apk" download="BrgyLink.apk" onClick={closeMenu}>
              <Smartphone size={18} aria-hidden="true" /> Download BrgyLink
            </a>
          </div>
        )}
      </nav>

      <main id="main-content">
        <header id="home" className="hero-section">
          <div className="hero-content">
            <p className="eyebrow eyebrow-light">Barangay services, closer to home</p>
            <h1>Connect with your barangay through <em>BrgyLink.</em></h1>
            <p className="hero-copy">
              Access barangay services, submit concerns, receive official updates, and take part in your community from one secure mobile app.
            </p>
            <div className="hero-actions">
              <a className="button button-gold" href="/BrgyLink.apk" download="BrgyLink.apk">
                <Smartphone size={20} aria-hidden="true" /> Download BrgyLink
              </a>
              <a className="button button-ghost" href="#services">
                Explore services <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
          </div>

          <aside className="hero-info-card" aria-label="Barangay contact details">
            <div className="hero-info-symbol"><MapPin aria-hidden="true" /></div>
            <p>Serving residents of</p>
            <strong>Barangay Bagong Pag-asa</strong>
            <span>San Jacinto, Pangasinan</span>
            <a href="tel:09916982914"><Phone size={16} aria-hidden="true" /> 0991 698 2914</a>
          </aside>
        </header>

        <section className="quick-access" aria-label="What you can do with BrgyLink">
          <div><FileText aria-hidden="true" /><span><strong>Request documents</strong><small>Track request updates</small></span></div>
          <div><ShieldCheck aria-hidden="true" /><span><strong>Report incidents</strong><small>File a blotter report</small></span></div>
          <div><MessageCircle aria-hidden="true" /><span><strong>Share feedback</strong><small>Reach your barangay</small></span></div>
        </section>

        <section id="about" className="section section-about">
          <FadeInSection>
            <div className="section-copy split-layout">
              <div>
                <p className="eyebrow">About BrgyLink</p>
                <h2>A clearer way to access local government services.</h2>
              </div>
              <div>
                <p>
                  BrgyLink is the digital portal of Barangay Bagong Pag-asa. It helps residents communicate with the barangay, request services, receive official announcements, and participate in community initiatives.
                </p>
                <p>
                  The platform supports transparent, organized service delivery while keeping resident records and official actions within role-based workflows.
                </p>
              </div>
            </div>
          </FadeInSection>
        </section>

        <section id="services" className="section section-services">
          <FadeInSection>
            <div className="section-heading">
              <p className="eyebrow">Resident services</p>
              <h2>One app for everyday barangay needs.</h2>
              <p>Designed for simple requests, clear updates, and better communication between residents and barangay staff.</p>
            </div>
            <div className="services-grid">
              {SERVICES.map((service) => (
                <article className="service-card" key={service.title}>
                  <div className="service-icon">{service.icon}</div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </article>
              ))}
            </div>
          </FadeInSection>
        </section>

        <section className="section how-it-works-section">
          <FadeInSection>
            <div className="section-heading centered-heading">
              <p className="eyebrow">Getting started</p>
              <h2>Simple steps for residents.</h2>
            </div>
            <ol className="steps-list">
              <li><span>01</span><div><h3>Download BrgyLink</h3><p>Install the Android app from this website.</p></div></li>
              <li><span>02</span><div><h3>Create and verify your account</h3><p>Provide accurate resident details and verify your email address.</p></div></li>
              <li><span>03</span><div><h3>Use barangay services</h3><p>Submit requests, receive updates, and keep track of your activity.</p></div></li>
            </ol>
          </FadeInSection>
        </section>

        <section id="officials" className="section section-officials">
          <FadeInSection>
            <div className="section-heading centered-heading">
              <p className="eyebrow">Barangay leadership</p>
              <h2>Barangay Officials &amp; Council</h2>
              <p>Current council roster for the 2023–2026 term.</p>
            </div>

            <div className="captain-card">
              <div className="official-avatar official-avatar-captain"><UsersRound aria-hidden="true" /></div>
              <div>
                <p className="official-role">Punong Barangay</p>
                <h3>Rogie B. Quillope</h3>
                <p>Term: 2023–2026</p>
              </div>
              <a href="tel:09544153509"><Phone size={17} aria-hidden="true" /> 0954 415 3509</a>
            </div>

            <div className="officials-grid">
              {OFFICIALS.filter(({ position }) => position !== 'Punong Barangay').map((official) => (
                <article className="official-card" key={official.name}>
                  <div className="official-avatar"><UsersRound aria-hidden="true" /></div>
                  <p className="official-role">{official.position}</p>
                  <h3>{official.name}</h3>
                  {official.committee && <p className="official-detail">Committee on {official.committee}</p>}
                  {official.termNumber && <p className="official-detail">{official.termNumber} · Term 2023–2026</p>}
                  {official.contact && <a href={`tel:${official.contact}`}><Phone size={15} aria-hidden="true" /> {official.contact}</a>}
                  {official.email && <a href={`mailto:${official.email}`}><Mail size={15} aria-hidden="true" /> {official.email}</a>}
                </article>
              ))}
            </div>
          </FadeInSection>
        </section>
      </main>

      <footer id="contact" className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/logo.png" alt="BrgyLink logo" />
            <div>
              <strong>BrgyLink</strong>
              <p>Official digital portal of Barangay Bagong Pag-asa.</p>
            </div>
          </div>
          <div>
            <p className="footer-label">Contact the barangay</p>
            <a href="tel:09916982914"><Phone size={16} aria-hidden="true" /> 0991 698 2914</a>
            <a href="mailto:b.pag.asasj@gmail.com"><Mail size={16} aria-hidden="true" /> b.pag.asasj@gmail.com</a>
          </div>
          <div>
            <p className="footer-label">Office location</p>
            <p><MapPin size={16} aria-hidden="true" /> Barangay Bagong Pag-asa, San Jacinto, Pangasinan</p>
            <p>Monday–Saturday · 8:00 AM–5:00 PM</p>
          </div>
        </div>
        <div className="footer-bottom">© 2026 Barangay Bagong Pag-asa · BrgyLink Project</div>
      </footer>
    </div>
  );
}

export default App;
