import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, ArrowRight, FileText, CheckCircle, MessageCircle, MapPin, X, Cpu, ShieldCheck, Award } from 'lucide-react';

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Official Gov Header Bar */}
      <div style={{ background: 'var(--primary-blue)', color: 'white', padding: '8px 5%', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>Republic of the Philippines</span>
        <span>Barangay Pantal e-Governance</span>
      </div>

      {/* Main Navigation */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 1000,
        background: 'white',
        borderBottom: '1px solid var(--border-light)',
        padding: '0.75rem 5%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: isScrolled ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
        transition: 'all 0.3s'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Mission 17 Logo" style={{ height: '50px', width: 'auto' }} />
          <div>
            <h1 style={{ fontSize: '1.2rem', color: 'var(--primary-blue)', margin: 0, lineHeight: 1.2 }}>MISSION 17</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>e-Gov Super App</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="#services" style={{ color: 'var(--text-dark)', fontWeight: 500 }}>Services</a>
          <a href="#ai" style={{ color: 'var(--text-dark)', fontWeight: 500 }}>AI Engine</a>
          <a href="#sdgs" style={{ color: 'var(--text-dark)', fontWeight: 500 }}>SDGs</a>
          <button className="btn-primary">Admin Portal</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-gradient" style={{ padding: '8rem 5% 12rem', position: 'relative', overflow: 'hidden' }}>
        <FadeInSection>
          <div style={{ maxWidth: '700px', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.2)' }}>
              <CheckCircle size={14} color="var(--accent-yellow)" /> Official Barangay System
            </div>
            <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
              Public Service<br />in a Click.
            </h2>
            <p style={{ fontSize: '1.15rem', opacity: 0.9, marginBottom: '2.5rem', maxWidth: '550px' }}>
              A bridge between Barangay Pantal and the people. Report incidents, request documents, and participate in civic tasks—all from your smartphone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', color: 'var(--primary-blue)', fontSize: '1.1rem', padding: '14px 32px' }}>
                <Smartphone size={22} /> Download App
              </button>
            </div>
          </div>
        </FadeInSection>
        
        {/* Floating Abstract Shapes */}
        <div className="floating-shape" style={{ position: 'absolute', right: '5%', top: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%', zIndex: 1 }} />
        <div className="floating-shape" style={{ position: 'absolute', right: '25%', bottom: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(252, 209, 22, 0.15) 0%, transparent 70%)', borderRadius: '50%', zIndex: 1, animationDelay: '2s' }} />
      </header>

      {/* Impact Stats Banner */}
      <div style={{ padding: '0 5%' }}>
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

      {/* Services Section */}
      <section id="services" style={{ padding: '6rem 5% 4rem', background: 'var(--bg-light)' }}>
        <FadeInSection>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h3 style={{ fontSize: '2.5rem', color: 'var(--primary-blue)', marginBottom: '1rem', fontWeight: 800 }}>Core Services</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>Streamlining civic engagement through digital transformation.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {[
              { icon: <FileText size={36}/>, title: "Blotter & Reports", desc: "Submit official incident reports securely from your device with real-time tracking." },
              { icon: <MapPin size={36}/>, title: "Civic Tasks", desc: "Engage in community activities aligned with the UN SDGs to earn blockchain rewards." },
              { icon: <Cpu size={36}/>, title: "AI Verification", desc: "Automated photo validation to ensure the authenticity of task submissions using our Python engine." },
              { icon: <MessageCircle size={36}/>, title: "Smart Chatbot", desc: "Multilingual AI assistant ready to answer local inquiries in Pangasinan and Tagalog." }
            ].map((srv, idx) => (
              <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ color: 'var(--bright-blue)', marginBottom: '1.5rem', background: 'rgba(11, 94, 215, 0.1)', padding: '16px', borderRadius: '50%' }}>{srv.icon}</div>
                <h4 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', color: 'var(--text-dark)' }}>{srv.title}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5 }}>{srv.desc}</p>
              </div>
            ))}
          </div>
        </FadeInSection>
      </section>

      {/* AI Engine Flowchart Section */}
      <section id="ai" style={{ padding: '6rem 5%', background: 'white', borderTop: '1px solid var(--border-light)' }}>
        <FadeInSection>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'center' }}>
            <div style={{ flex: '1 1 500px' }}>
              <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', background: 'rgba(206, 17, 38, 0.1)', color: 'var(--accent-red)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>
                Powered by Python & TensorFlow
              </div>
              <h3 style={{ fontSize: '2.5rem', color: 'var(--primary-blue)', marginBottom: '1.5rem', fontWeight: 800 }}>Intelligent Verification Engine</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem' }}>
                Mission 17 uses a custom-trained AI model to automatically review civic task submissions. This prevents fraud and ensures that blockchain tokens are only awarded to genuine participants.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ minWidth: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>User Uploads Photo</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Citizen completes a coastal cleanup and uploads a photo proof via the mobile app.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ minWidth: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-yellow)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>AI Model Analysis</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Our Flask server processes the image through an EfficientNet model to classify the activity.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ minWidth: '40px', height: '40px', borderRadius: '50%', background: 'var(--bright-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Smart Contract Execution</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>If validated, SDG tokens are minted on the blockchain and sent to the user's wallet.</p>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '400px', aspectRatio: '3/4', background: 'var(--bg-light)', borderRadius: '24px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                <ShieldCheck size={80} color="var(--primary-blue)" style={{ marginBottom: '2rem' }} />
                <h4 style={{ fontSize: '1.5rem', color: 'var(--primary-blue)', marginBottom: '1rem' }}>System Architecture</h4>
                <div style={{ width: '100%', height: '8px', background: 'rgba(11, 94, 215, 0.1)', borderRadius: '4px', marginBottom: '1rem' }}>
                   <div style={{ width: '60%', height: '100%', background: 'var(--bright-blue)', borderRadius: '4px' }}></div>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(11, 94, 215, 0.1)', borderRadius: '4px', marginBottom: '1rem' }}>
                   <div style={{ width: '80%', height: '100%', background: 'var(--accent-yellow)', borderRadius: '4px' }}></div>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(11, 94, 215, 0.1)', borderRadius: '4px' }}>
                   <div style={{ width: '40%', height: '100%', background: 'var(--accent-red)', borderRadius: '4px' }}></div>
                </div>
              </div>
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* Interactive SDG Showcase */}
      <section id="sdgs" style={{ padding: '6rem 5%', background: 'var(--bg-light)', borderTop: '1px solid var(--border-light)' }}>
        <FadeInSection>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 16px', borderRadius: '20px', color: 'var(--bright-blue)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid var(--border-light)' }}>
                <Award size={16} /> Gamified Rewards
              </div>
              <h3 style={{ fontSize: '2.5rem', color: 'var(--primary-blue)', marginBottom: '1rem', fontWeight: 800 }}>The 17 Sustainable Development Goals</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto', fontSize: '1.1rem' }}>
                Mission 17 gamifies civic engagement. By completing tasks related to these UN Goals, residents earn blockchain-verified reward points. Click a goal to learn more!
              </p>
            </div>
            
            <div className="sdg-grid">
              {sdgData.map((sdg) => {
                const numStr = sdg.id.toString().padStart(2, '0');
                const imagePath = `/sdg/sdg${numStr}.png`;
                return (
                  <div key={sdg.id} className="sdg-card" onClick={() => setSelectedSdg(sdg)} title={`Click to read about ${sdg.title}`}>
                    <img src={imagePath} alt={`SDG ${sdg.id}: ${sdg.title}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </FadeInSection>
      </section>

      {/* Footer */}
      <footer style={{ background: 'white', padding: '4rem 5% 2rem', borderTop: '1px solid var(--border-light)', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <img src="/logo.png" alt="Mission 17 Logo" style={{ height: '40px', width: 'auto', filter: 'grayscale(100%) opacity(70%)' }} />
              <h4 style={{ fontSize: '1.1rem', color: 'var(--primary-blue)', margin: 0 }}>MISSION 17</h4>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '300px' }}>
              Empowering Barangay Pantal through AI-driven e-Governance and Sustainable Development Goals.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>&copy; 2026 Mission 17 Project Team.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Republic of the Philippines.</p>
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
                style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '8px' }} 
              />
              <div>
                <h4 style={{ color: 'var(--primary-blue)', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase' }}>Goal {selectedSdg.id}</h4>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--text-dark)' }}>{selectedSdg.title}</h3>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>{selectedSdg.desc}</p>
            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
              <button className="btn-primary" onClick={() => setSelectedSdg(null)} style={{ padding: '8px 20px' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
