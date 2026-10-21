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
import useOfficials from './hooks/useOfficials';

const PUBLIC_VERIFY_URL = 'https://mission17.vercel.app/public-verify';

function OfficialCard({ official, captain = false }) {
  const phone = typeof official.contact === 'string' && /^09\d{9}$/.test(official.contact) ? official.contact : null;
  const email = typeof official.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(official.email) ? official.email : null;
  return <article className={captain ? 'captain-card' : 'official-card'}>
    <div className={`official-avatar${captain ? ' official-avatar-captain' : ''}`}><UsersRound aria-hidden="true" /></div>
    <div className="official-information">
      <p className="official-role">{official.position}</p>
      <h3>{official.name}</h3>
      {official.committee && <p className="official-detail">{/^committee\s+on\b/i.test(official.committee) ? official.committee : `Committee on ${official.committee}`}</p>}
      {official.term && <p className="official-detail">Term: {official.term}</p>}
      {official.termNumber && <p className="official-detail">{official.termNumber}{/\bterm\b/i.test(official.termNumber) ? '' : ' Term'}</p>}
    </div>
    <div className="official-contact-links">
      {phone ? <a href={`tel:${phone}`} aria-label={`Call ${official.name} at ${phone}`}><Phone size={15} aria-hidden="true" /> {phone}</a> : <p className="official-detail">Contact number not available</p>}
      {email && <a href={`mailto:${email}`}><Mail size={15} aria-hidden="true" /> {email}</a>}
    </div>
  </article>;
}

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
  const { officials, loading: officialsLoading, error: officialsError, refresh: refreshOfficials } = useOfficials();
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
          <a href={PUBLIC_VERIFY_URL}>Verify report</a>
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
            <a href={PUBLIC_VERIFY_URL} onClick={closeMenu}>Verify report</a>
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
              <p>Current officials published by the barangay.</p>
              <button className="officials-refresh" type="button" onClick={refreshOfficials} disabled={officialsLoading} aria-label="Refresh officials">{officialsLoading ? 'Loading officials…' : 'Refresh officials'}</button>
            </div>
            {officialsLoading ? <p className="officials-state" role="status">Loading the current officials directory…</p>
              : officialsError ? <p className="officials-state" role="alert">{officialsError}</p>
                : officials.length === 0 ? <p className="officials-state" role="status">No active officials have been published yet.</p>
                  : <>
                    {officials.filter(row => row.position === 'Punong Barangay').map(official => <OfficialCard key={official._id} official={official} captain />)}
                    <div className="officials-grid">
                      {officials.filter(row => row.position !== 'Punong Barangay').map(official => <OfficialCard key={official._id} official={official} />)}
                    </div>
                  </>}
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
              <a href={PUBLIC_VERIFY_URL}><ShieldCheck size={16} aria-hidden="true" /> Verify a blotter report</a>
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
