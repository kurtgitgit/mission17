import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Legal.css';

const LegalFooter = () => (
  <footer className="legal-footer" aria-label="Legal information">
    <nav>
      <Link to="/privacy">Privacy Notice</Link>
      <Link to="/terms">Terms of Use</Link>
      <Link to="/accessibility">Accessibility</Link>
      <Link to="/ai-disclosure">AI Disclosure</Link>
      <Link to="/browser-storage">Browser Storage</Link>
    </nav>
    <p>Capstone prototype — subject to Barangay Bagong Pag-asa review and approval before official public deployment.</p>
  </footer>
);

export default LegalFooter;
