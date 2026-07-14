import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, ArrowRight, FileText, CheckCircle, MessageCircle, MapPin, X, Cpu, ShieldCheck, Award, User, Phone, Menu } from 'lucide-react';

const sdgData = [
  { id: 1, title: 'No Poverty', desc: 'End poverty in all its forms everywhere.' },
  { id: 2, title: 'Zero Hunger', desc: 'End hunger, achieve food security and improved nutrition and promote sustainable agriculture.' },
  { id: 3, title: 'Good Health and Well-being', desc: 'Ensure healthy lives and promote well-being for all at all ages.' },
  { id: 4, title: 'Quality Education', desc: 'Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all.' },
  { id: 5, title: 'Gender Equality', desc: 'Achieve gender equality and empower all women and girls.' },
  { id: 6, title: 'Clean Water and Sanitation', desc: 'Ensure availability and sustainable management of water and sanitation for all.' },
  { id: 7, title: 'Affordable and Clean Energy', desc: 'Ensure access to affordable, reliable, sustainable and modern energy for all.' },
  { id: 8, title: 'Decent Work and Economic Growth', desc: 'Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all.' },
  { id: 9, title: 'Industry, Innovation and Infrastructure', desc: 'Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation.' },
  { id: 10, title: 'Reduced Inequality', desc: 'Reduce inequality within and among countries.' },
  { id: 11, title: 'Sustainable Cities and Communities', desc: 'Make cities and human settlements inclusive, safe, resilient and sustainable.' },
  { id: 12, title: 'Responsible Consumption and Production', desc: 'Ensure sustainable consumption and production patterns.' },
  { id: 13, title: 'Climate Action', desc: 'Take urgent action to combat climate change and its impacts.' },
  { id: 14, title: 'Life Below Water', desc: 'Conserve and sustainably use the oceans, seas and marine resources for sustainable development.' },
  { id: 15, title: 'Life on Land', desc: 'Protect, restore and promote sustainable use of terrestrial ecosystems, sustainably manage forests, combat desertification, and halt and reverse land degradation and halt biodiversity loss.' },
  { id: 16, title: 'Peace and Justice Strong Institutions', desc: 'Promote peaceful and inclusive societies for sustainable development, provide access to justice for all and build effective, accountable and inclusive institutions at all levels.' },
  { id: 17, title: 'Partnerships to achieve the Goal', desc: 'Strengthen the means of implementation and revitalize the global partnership for sustainable development.' }
];

function FadeInSection(props) {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      });
    }, { threshold: 0.1 });
    
    if (domRef.current) observer.observe(domRef.current);
    return () => {
      if (domRef.current) observer.unobserve(domRef.current);
    };
  }, []);

  return (
    <div className={`fade-in-section ${isVisible ? 'is-visible' : ''}`} ref={domRef}>
      {props.children}
    </div>
  );
}

function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedSdg, setSelectedSdg] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* Top Banner */}
      <div className="top-banner-text" style={{ background: 'var(--primary-blue)', color: 'white', padding: '10px 5%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.85rem' }}>
        <span>Welcome to the Official <span className="text-gold font-serif" style={{ fontStyle: 'italic', fontWeight: 600 }}>Mission 17</span> Website — connecting barangays digitally.</span>
      </div>

      {/* Main Navigation */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 1000,
        background: 'white',
        borderBottom: '1px solid var(--border-light)',
        padding: '1rem 5%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: isScrolled ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
        transition: 'all 0.3s'
      }}>
        <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Mission 17 Logo" style={{ height: '45px', width: 'auto' }} />
          <div>
            <h1 style={{ fontSize: '1.25rem', color: 'var(--primary-blue)', margin: 0, lineHeight: 1.2, fontWeight: 800 }}>Barangay Pantal</h1>
          </div>
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="#services" style={{ color: 'var(--text-dark)', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>Home</a>
          <a href="#about" style={{ color: 'var(--text-dark)', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>About Us</a>
          <a href="#services" style={{ color: 'var(--text-dark)', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>Services</a>
          <a href="#officials" style={{ color: 'var(--text-dark)', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>Officials</a>
          <a href="#news" style={{ color: 'var(--text-dark)', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>Barangay Bulletin</a>

        </div>
        
        {/* Hamburger Icon (Mobile Only) */}
        <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={28} color="var(--primary-blue)" /> : <Menu size={28} color="var(--primary-blue)" />}
        </button>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="mobile-dropdown" style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: 'white', borderBottom: '1px solid var(--border-light)',
            padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)', zIndex: 1000
          }}>
            <a href="#services" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--text-dark)', fontWeight: 600, textDecoration: 'none', fontSize: '1.1rem' }}>Home</a>
            <a href="#about" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--text-dark)', fontWeight: 600, textDecoration: 'none', fontSize: '1.1rem' }}>About Us</a>
            <a href="#services" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--text-dark)', fontWeight: 600, textDecoration: 'none', fontSize: '1.1rem' }}>Services</a>
            <a href="#officials" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--text-dark)', fontWeight: 600, textDecoration: 'none', fontSize: '1.1rem' }}>Officials</a>
            <a href="#news" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--text-dark)', fontWeight: 600, textDecoration: 'none', fontSize: '1.1rem' }}>Barangay Bulletin</a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="hero-container" style={{ 
        padding: '8rem 5% 10rem', 
        background: 'linear-gradient(to right, rgba(0, 43, 127, 0.95) 0%, rgba(0, 43, 127, 0.7) 40%, rgba(0, 43, 127, 0.2) 100%), url("/bridge_bg.jpg") center/cover no-repeat',
        position: 'relative',
        borderBottom: '4px solid var(--accent-gold)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '4rem'
      }}>
        <div className="hero-text-block" style={{ flex: '1 1 500px', maxWidth: '650px', animation: 'heroSlideLeft 0.8s ease forwards', zIndex: 2 }}>
          <h1 className="heading-hero" style={{ color: 'white' }}>
            Welcome to the <br />
            <span className="font-serif text-gold" style={{ fontStyle: 'italic' }}>Mission 17</span> Portal
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', marginBottom: '2.5rem', lineHeight: 1.7, maxWidth: '550px' }}>
            This platform serves as the official website of the Barangay that will connect, inform, and empower local leaders and communities. Experience transparent, secure, and gamified digital governance.
          </p>
          <div className="hero-buttons" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a 
              className="btn-primary" 
              style={{ background: 'var(--accent-gold)', color: 'var(--primary-blue)' }}
              href="https://expo.dev/artifacts/eas/rEMUXHRxXb9H1FUEHg86bIZWB3A23gBWDJt9mNBDvKw.apk"
              download
            >
              <Smartphone size={20} /> Download App
            </a>
            <button className="btn-outline" style={{ borderColor: 'white', color: 'white' }}>
              Learn More About Us
            </button>
          </div>
        </div>
      </header>

      {/* Impact Stats Banner */}
      <div style={{ padding: '0' }}>
        <FadeInSection>
          <div className="stats-banner">
            <div className="stat-item">
              <div className="stat-number">15,000+</div>
              <div className="stat-label">Registered Citizens</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">2,400+</div>
              <div className="stat-label">SDG Tasks Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">99.8%</div>
              <div className="stat-label">AI Verification Accuracy</div>
            </div>
          </div>
        </FadeInSection>
      </div>

      {/* Features Section */}
      <section id="services" style={{ padding: '6rem 5%', background: 'var(--bg-light)' }}>
        <FadeInSection>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '4rem' }}>
            <div className="section-label">Core Features</div>
            <h3 style={{ fontSize: '2.4rem', color: 'var(--primary-blue)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '1.5rem' }}>
              Complete <span className="font-serif text-gold" style={{ fontStyle: 'italic' }}>Ecosystem</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '1.1rem', lineHeight: 1.7 }}>
              A fully integrated digital governance and community engagement platform built to serve the citizens of Barangay Pantal efficiently.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {[
              { icon: <FileText size={32}/>, title: "Blotter & Reports", desc: "Submit official incident reports securely with real-time tracking and push notifications." },
              { icon: <FileText size={32}/>, title: "Document Requests", desc: "Request Barangay Clearances, IDs, and Certificates directly from the app." },
              { icon: <MapPin size={32}/>, title: "Civic Tasks & SDGs", desc: "Engage in community activities aligned with the UN SDGs to earn verified rewards." },
              { icon: <Cpu size={32}/>, title: "AI Verification", desc: "Automated image validation (Python/TensorFlow) to verify task submissions instantly." },
              { icon: <Award size={32}/>, title: "Blockchain Rewards", desc: "Earn secure, verifiable digital tokens on the blockchain for helping the community." },
              { icon: <MessageCircle size={32}/>, title: "Multilingual Chatbot", desc: "AI assistant that answers inquiries in English, Tagalog, Pangasinan, and Ilocano." },
              { icon: <Smartphone size={32}/>, title: "Mobile & Web Portal", desc: "Cross-platform mobile app for residents and a powerful React dashboard for Admins." },
              { icon: <ShieldCheck size={32}/>, title: "Role-Based Access", desc: "Secure authentication with Two-Factor Auth (2FA) and detailed audit logs." }
            ].map((srv, idx) => (
              <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '2rem 1.5rem', border: 'none', boxShadow: '0 10px 30px rgba(0,43,127,0.06)' }}>
                <div style={{ color: 'white', marginBottom: '1.5rem', background: 'var(--primary-blue)', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px' }}>{srv.icon}</div>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--text-dark)', fontWeight: 700 }}>{srv.title}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>{srv.desc}</p>
              </div>
            ))}
          </div>
        </FadeInSection>
      </section>

      {/* News & Announcements Section */}
      <section id="news" style={{ padding: '6rem 5%', background: 'var(--bg-white)' }}>
        <FadeInSection>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="section-title-wrapper" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
              <div style={{ maxWidth: '600px' }}>
                <div className="section-label">Barangay Bulletin</div>
                <h3 style={{ fontSize: '2.4rem', color: 'var(--primary-blue)', fontWeight: 800, letterSpacing: '-0.5px' }}>
                  Latest <span className="font-serif text-gold" style={{ fontStyle: 'italic' }}>News</span>
                </h3>
              </div>
              <button className="btn-outline" style={{ marginBottom: '0.5rem' }}>View All News</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              {[
                { title: 'Upcoming Coastal Cleanup Drive', date: 'Oct 15, 2026', desc: 'Join us at the Pantal River for our monthly cleanup drive. Earn SDG points via the Mission 17 App.' },
                { title: 'New Barangay ID System Rollout', date: 'Oct 10, 2026', desc: 'Request your new PVC Barangay ID directly through the mobile app Document Request feature.' },
                { title: 'Barangay Assembly Meeting', date: 'Oct 05, 2026', desc: 'All residents are invited to the bi-annual barangay assembly at the covered court.' }
              ].map((news, idx) => (
                <div key={idx} className="card" style={{ padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 10px 30px rgba(0,43,127,0.08)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '160px', background: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={48} color="var(--text-muted)" opacity={0.2} />
                  </div>
                  <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'inline-block', padding: '4px 10px', background: 'rgba(252, 209, 22, 0.2)', color: '#b39500', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem', alignSelf: 'flex-start' }}>Advisory</div>
                    <h4 style={{ fontSize: '1.2rem', color: 'var(--text-dark)', marginBottom: '0.75rem', lineHeight: 1.4, fontWeight: 700 }}>{news.title}</h4>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, flex: 1, fontSize: '0.95rem' }}>{news.desc}</p>
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{news.date}</span>
                      <a href="#" style={{ color: 'var(--primary-blue)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>Read More <ArrowRight size={14}/></a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* AI Engine Flowchart Section */}
      <section id="ai" style={{ padding: '6rem 5%', background: 'var(--bg-white)', borderTop: '1px solid var(--border-light)' }}>
        <FadeInSection>
          <div className="ai-engine-container" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
            <div className="ai-engine-block" style={{ flex: '1 1 500px' }}>
              <div className="section-label">Smart Governance</div>
              <h3 style={{ fontSize: '2.4rem', color: 'var(--primary-blue)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '1.5rem' }}>
                Intelligent <span className="font-serif text-gold" style={{ fontStyle: 'italic' }}>Verification Engine</span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                Mission 17 uses a custom-trained AI model to automatically review civic task submissions. This prevents fraud and ensures that blockchain tokens are only awarded to genuine participants.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ minWidth: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>1</div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--primary-blue)' }}>User Uploads Photo</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>Citizen completes a coastal cleanup and uploads a photo proof via the mobile app.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ minWidth: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-gold)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>2</div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--primary-blue)' }}>AI Model Analysis</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>Our Python server processes the image through an EfficientNet model to classify the activity.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ minWidth: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-light)', border: '2px solid var(--primary-blue)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>3</div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--primary-blue)' }}>Smart Contract Execution</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>If validated, SDG tokens are minted on the blockchain and sent to the user's wallet.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="ai-engine-block" style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '350px', aspectRatio: '3/4', background: 'var(--bg-light)', borderRadius: '24px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', boxShadow: '0 20px 40px rgba(0,43,127,0.08)' }}>
                <Cpu size={60} color="var(--primary-blue)" style={{ marginBottom: '1.5rem' }} />
                <h4 style={{ fontSize: '1.3rem', color: 'var(--primary-blue)', marginBottom: '1.5rem', fontWeight: 700 }}>System Architecture</h4>
                <div style={{ width: '100%', height: '8px', background: 'rgba(0, 43, 127, 0.1)', borderRadius: '4px', marginBottom: '1.5rem' }}>
                   <div style={{ width: '60%', height: '100%', background: 'var(--primary-blue)', borderRadius: '4px' }}></div>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(0, 43, 127, 0.1)', borderRadius: '4px', marginBottom: '1.5rem' }}>
                   <div style={{ width: '80%', height: '100%', background: 'var(--accent-gold)', borderRadius: '4px' }}></div>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(0, 43, 127, 0.1)', borderRadius: '4px' }}>
                   <div style={{ width: '40%', height: '100%', background: 'var(--bright-blue)', borderRadius: '4px' }}></div>
                </div>
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-white)', padding: '4rem 5% 2rem', borderTop: '1px solid var(--border-light)', marginTop: 'auto' }}>
        <div className="footer-container" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '3rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <img src="/logo.png" alt="Mission 17 Logo" style={{ height: '40px', width: 'auto' }} />
              <h4 style={{ fontSize: '1.1rem', color: 'var(--primary-blue)', margin: 0, fontWeight: 800 }}>MISSION 17</h4>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '300px', lineHeight: 1.5 }}>
              Empowering Barangay Pantal through AI-driven e-Governance, gamified civic tasks, and Sustainable Development Goals.
            </p>
          </div>
          <div className="footer-right" style={{ textAlign: 'right' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--primary-blue)', marginBottom: '1rem', fontWeight: 700 }}>Contact Us</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Barangay Hall, Pantal, Dagupan City</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>contact@mission17.gov.ph</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1.5rem' }}>&copy; 2026 Mission 17 Project. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Interactive Modal for SDG */}
      {selectedSdg && (
        <div className="modal-overlay" onClick={() => setSelectedSdg(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedSdg(null)}><X size={24} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <img 
                src={`/sdg/sdg${selectedSdg.id.toString().padStart(2, '0')}.png`} 
                alt={`SDG ${selectedSdg.id}`} 
                style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '6px' }} 
              />
              <div>
                <h4 style={{ color: 'var(--primary-blue)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>Goal {selectedSdg.id}</h4>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-dark)' }}>{selectedSdg.title}</h3>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>{selectedSdg.desc}</p>
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button className="btn-primary" onClick={() => setSelectedSdg(null)} style={{ padding: '6px 16px' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
