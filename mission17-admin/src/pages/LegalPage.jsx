import React from 'react';
import { Link } from 'react-router-dom';
import LegalFooter from '../components/LegalFooter';
import '../styles/Legal.css';

const prototypeNotice = 'Subject to Barangay Bagong Pag-asa review and approval before official public deployment.';

const pages = {
  privacy: {
    title: 'Privacy Notice',
    filipinoTitle: 'Buod sa Filipino',
    filipino: 'Ang BrgyLink ay capstone prototype. Kinokolekta lamang nito ang impormasyong kailangan para sa account, mga kahilingan, ulat, at iba pang serbisyong ginagamit sa app. Ang opisyal na contact at retention period ay kailangan pang italaga at aprubahan ng Barangay Bagong Pag-asa.',
    sections: [
      ['Purpose and status', 'BrgyLink is a capstone prototype for Barangay Bagong Pag-asa services. This notice describes the current prototype and is not a statement that the system has been formally adopted or is fully legally compliant.'],
      ['Information processed', 'The system may process account and profile details, contact details, valid-ID uploads, document requests, blotter reports and related evidence, civic-mission proof, suggestions or feedback, notification tokens, and security or audit records. Camera or location data are used only when a resident chooses a feature that requests them.'],
      ['Why information is used', 'Information is used to create and verify accounts, process resident requests, allow authorized staff to review submissions, send service updates, secure the system, and operate the AI advisory features described in the AI Disclosure.'],
      ['Service providers and access', 'Current prototype services may include Firebase Authentication, a MongoDB database deployment, Cloudinary for uploads, AWS Lightsail for backend hosting, Expo for push-notification delivery, Ollama Cloud for the chatbot, and a configured AI image-verification service. Access should be limited to authorized users and service operations.'],
      ['Retention, contact, and changes', 'A final retention/deletion schedule and official privacy contact or Data Protection Officer have not yet been designated. For this prototype, contact the Barangay Bagong Pag-asa Office; official privacy contact pending designation. Material policy changes should be versioned and announced before official deployment.']
    ]
  },
  terms: {
    title: 'Terms of Use',
    filipinoTitle: 'Buod sa Filipino',
    filipino: 'Gamitin ang BrgyLink nang tapat at may paggalang. Huwag magsumite ng maling ulat o pekeng ebidensiya, manggulo, magbahagi ng account, o subukang lampasan ang pagsusuri. Ang barangay administrator ang may huling pasya sa mga request at proof.',
    sections: [
      ['Using BrgyLink', 'Residents may use BrgyLink to access available prototype services. Services, forms, and availability may change while the project is under review.'],
      ['Resident responsibilities', 'Do not submit false reports, fraudulent mission proof, abusive or harassing content, or another person’s information without authority. Do not share accounts or attempt to bypass account, document, or administrator review.'],
      ['Review and decisions', 'Authorized administrators review accounts, reports, requests, and proof. System messages and AI results are advisory only and do not replace an administrator’s final decision.'],
      ['Availability and appropriate use', 'The prototype may be unavailable, incomplete, or changed without notice during testing. Do not rely on BrgyLink for emergency response; use official emergency channels for urgent concerns.'],
      ['Consequences', 'The Barangay Bagong Pag-asa Office may reject, suspend, or refer misuse for review when appropriate, subject to the office’s future approved procedures.']
    ]
  },
  accessibility: {
    title: 'Accessibility Statement',
    filipinoTitle: 'Buod sa Filipino',
    filipino: 'May mga keyboard-accessible na link at button ang legal pages, malinaw na focus indicator, at controls para sa larger text at high contrast. May mga limitasyon pa rin ang prototype at kailangan pa ng device testing kasama ang mga residente.',
    sections: [
      ['Current support', 'This website provides semantic headings, keyboard-reachable links and buttons, visible focus indicators, and controls for larger text and high contrast. The selected text and contrast options are stored only in the browser so the preference can be remembered.'],
      ['Known limitations', 'This prototype has not completed a formal accessibility audit, screen-reader audit, or testing with every device, browser, assistive technology, and resident age group. Some uploaded documents, third-party pages, images, and mobile-device features may have limitations.'],
      ['Feedback and assistance', 'For help using the prototype, contact the Barangay Bagong Pag-asa Office. Official accessibility and privacy contact pending designation. Feedback should be reviewed before official deployment.']
    ]
  },
  ai: {
    title: 'AI Disclosure',
    filipinoTitle: 'Buod sa Filipino',
    filipino: 'Ang chatbot at image verification ay pantulong lamang. Hindi nito awtomatikong inaaprubahan o tinatanggihan ang resident account, mission proof, o iba pang request. Ang awtorisadong administrator ang gumagawa ng huling desisyon.',
    sections: [
      ['How AI is used', 'BrgyLink may use a chatbot to provide general navigation and public-service guidance, and an image-verification service to provide an advisory verdict about submitted proof.'],
      ['Human decision required', 'AI does not automatically approve or reject accounts, documents, blotter reports, mission proof, or benefits. An authorized administrator must make the final decision.'],
      ['Limitations', 'AI can be inaccurate, incomplete, biased, unavailable, or unable to understand a message. It must not be treated as truth detection, legal advice, an emergency service, or a source of unverified fees, schedules, requirements, or eligibility decisions.'],
      ['Safe use', 'If the system lacks verified details, residents should contact the Barangay Bagong Pag-asa Office. Administrators should review context and source records before acting on an AI advisory result.']
    ]
  },
  storage: {
    title: 'Cookie & Browser Storage Notice',
    filipinoTitle: 'Buod sa Filipino',
    filipino: 'Sa prototype na ito, browser storage lang na mahalaga sa secure Firebase sign-in, legal-notice acknowledgment, at accessibility preference ang ginagamit. Walang advertising o analytics cookies na ipinapahayag o idinadagdag sa notice na ito.',
    sections: [
      ['What is used now', 'The website uses essential browser storage for Firebase authentication persistence, the browser-storage notice acknowledgment, and accessibility preferences such as larger text and high contrast.'],
      ['What is not claimed', 'This prototype does not claim to use advertising, profiling, or analytics cookies. If analytics or other non-essential technology is introduced later, this notice and the consent approach must be reviewed before release.'],
      ['Your browser controls', 'You can clear browser storage using your browser settings. Clearing essential storage may sign you out or reset your notice and accessibility preferences.'],
      ['Reset this notice', 'To view the essential-storage acknowledgment again, clear the BrgyLink site data in your browser.']
    ]
  }
};

const LegalPage = ({ type }) => {
  const page = pages[type];
  return (
    <div className="legal-page-shell">
      <main className="legal-page" id="main-content" tabIndex="-1">
        <Link className="legal-back-link" to="/">← Back to sign in</Link>
        <p className="legal-eyebrow">BrgyLink capstone prototype</p>
        <h1>{page.title}</h1>
        <p className="legal-prototype-notice">{prototypeNotice}</p>
        <section className="legal-summary" aria-labelledby={`${type}-filipino-summary`}>
          <h2 id={`${type}-filipino-summary`}>{page.filipinoTitle}</h2>
          <p>{page.filipino}</p>
        </section>
        {page.sections.map(([heading, body]) => <section key={heading} className="legal-section"><h2>{heading}</h2><p>{body}</p></section>)}
        <section className="legal-section"><h2>Responsible office</h2><p>Barangay Bagong Pag-asa Office. Official privacy and accessibility contact pending designation.</p></section>
      </main>
      <LegalFooter />
    </div>
  );
};

export default LegalPage;
