import { describe, expect, it, jest } from '@jest/globals';
import chatbotRouter, { detectLanguage, getControlledFaq, getSafeFallbackReply, resolveAiChatReply } from './chatbot.js';
import { getLiveChatReply } from './chatbotLiveData.js';

// Development regression questions, not an independent accuracy holdout.
const workflows = [
  { clues: ['document requests', 'blotter reports', 'feedback'], en: ['What can BrgyLink help me do?', 'What is BrgyLink?'], tl: ['Ano ang magagawa sa BrgyLink?', 'Anong features ng app?'] },
  { clues: ["'Documents'", "'New Request'", 'Barangay Clearance'], en: ['How do I request a Barangay Clearance?', 'I need a clearance'], tl: ['Paano kumuha ng barangay clearance?', 'Pano po magrequest ng clearance?'] },
  { clues: ["'Documents'", "'My Requests'", 'reference'], en: ['How do I check my document request status?', 'Where is my document reference number?'], tl: ['Nasaan ang reference number ng document request ko?', 'Paano makita ang status ng dokumento ko?'] },
  { clues: ['Forgot Password', 'Spam', 'password'], en: ['I forgot my password. What should I do?', 'How can I reset my password?'], tl: ['Nakalimutan ko ang password ko', 'Paano ireset ang password?'] },
  { clues: ['Resend verification code', 'Resend Code', 'Spam'], en: ['I did not receive my verification code.', 'My OTP has expired'], tl: ['Hindi dumating ang code sa email ko', 'Expired na ang OTP ko po'] },
  { clues: ["'Officials'", 'directory'], en: ['Who are the current barangay officials?', 'Who is the barangay captain?'], tl: ['Sino ang mga opisyal ng barangay?', 'Sino po ang kapitan?'] },
  { clues: ['News', 'Barangay Bulletins', 'See all'], en: ['Where can I find barangay announcements?', 'Where are announcements in the app?'], tl: ['Saan makikita ang mga anunsyo?', 'Nasaan ang balita sa app?'] },
  { clues: ["'Blotter report'", "'File a Blotter Report'", "'My Blotter Reports'"], en: ['How do I file a blotter report?', 'How do I report an incident?'], tl: ['Paano mag-file ng blotter?', 'Paano ako magrereklamo sa barangay?'] },
  { clues: ['Barangay Hall', 'pick'], en: ['How much is the clearance fee?', 'Can I pay for a document online?'], tl: ['Magkano ang bayad sa clearance?', 'Pwede bang GCash sa document request?'] },
  { clues: ['name', 'address', 'purpose'], en: ['What are the requirements for a document request?', 'What information do I need for an indigency certificate?'], tl: ['Ano kailangan para sa document request?', 'Requirements po sa residency certificate?'] },
  { clues: ['Indigency', 'Residency', 'Other'], en: ['What documents are available?', 'Which certificates can I request?'], tl: ['Anong mga dokumento ang pwede kunin?', 'Ano po ang available na certificates?'] },
  { clues: ["'New Request'", 'Other Document'], en: ['How do I request a tree planting certificate?', 'Can I request a low income certificate?'], tl: ['Paano kumuha ng barangay ID?', 'Kailangan ko ng first-time job seeker certificate'] },
  { clues: ['Ready for Pickup', 'date', 'barangay'], en: ['When can I pick up my document?', 'What does ready for pickup mean?'], tl: ['Kailan ko makukuha ang dokumento?', 'Ready for Pickup na po clearance ko'] },
  { clues: ['Pending', 'Processing', 'Completed', 'Rejected'], en: ['What do document statuses mean?', 'Explain pending and processing for documents'], tl: ['Ano ibig sabihin ng status ng dokumento?', 'Ano ang Pending sa document request?'] },
  { clues: ["'My Requests'", 'reason', 'barangay'], en: ['Why was my clearance rejected?', 'My document has missing requirements'], tl: ['Rejected ang clearance ko bakit?', 'May kulang daw sa document request ko'] },
  { clues: ['processing', 'barangay'], en: ['How long does clearance processing take?', 'Can you guarantee my document tomorrow?'], tl: ['Ilang araw bago matapos ang clearance?', 'Gaano katagal ang document request?'] },
  { clues: ["'My Blotter Reports'", 'Pending', 'In Progress', 'Resolved', 'Dismissed'], en: ['How do I track my blotter status?', 'What does in progress mean for my blotter?'], tl: ['Paano makita status ng blotter ko?', 'Ano ibig sabihin ng Pending sa blotter?'] },
  { clues: ['Follow-up Needed', 'Pending', 'staff'], en: ['What if my blotter only needs a follow up review?', 'What is follow-up needed on a blotter?'], tl: ['Follow-up Needed ang blotter ko', 'Paano kung kailangan lang ng follow up sa blotter?'] },
  { clues: ['staff', 'Captain', 'outcome'], en: ['Who resolves a blotter case?', 'Does filing a blotter automatically resolve it?'], tl: ['Sino ang nagreresolve ng blotter?', 'Automatic bang resolved ang report ko?'] },
  { clues: ['optional', 'photo'], en: ['Is blotter evidence required?', 'Do I need the respondent name for a blotter?'], tl: ['Kailangan ba ng photo sa blotter?', 'Hindi ko alam pangalan ng nirereklamo sa blotter'] },
  { clues: ["'eFeedback'", 'Write Message', 'My Inbox & History'], en: ['How do I send feedback?', 'How do I complain about a broken streetlight?'], tl: ['Paano magsend ng e feedback?', 'Saan magsusumbong ng sirang ilaw sa kalsada?'] },
  { clues: ['Submit Anonymously', 'account'], en: ['Can I submit feedback anonymously?', 'Is anonymous feedback completely untraceable?'], tl: ['Pwede bang anonymous ang feedback?', 'Makikita ba pangalan ko sa anonymous feedback?'] },
  { clues: ['My Inbox & History', 'reply'], en: ['Where is the reply to my feedback?', 'How do I track a suggestion?'], tl: ['Nasaan ang sagot sa feedback ko?', 'Paano makita ang status ng suggestion ko?'] },
  { clues: ['Select', 'Delete selected', 'requests'], en: ['How do I delete one notification?', 'Will deleting notifications delete my requests?'], tl: ['Paano burahin isang notification?', 'Paano magdelete ng napiling notifications?'] },
  { clues: ['Settings', 'permission'], en: ['Why am I not getting push notifications?', 'How do I enable notifications?'], tl: ['Walang dumarating na notifications sa phone ko', 'Paano i-on ang notifikasyon?'] },
  { clues: ['Create Account', 'email', 'ID', 'approval'], en: ['How do I register?', 'How do I create an account?'], tl: ['Paano gumawa ng account?', 'Paano mag sign up sa BrgyLink?'] },
  { clues: ['review', 'approval'], en: ['Why is my account pending?', 'Can you approve my registration?'], tl: ['Pending pa ang account ko', 'Pwede mo bang iapprove ang registration ko?'] },
  { clues: ['Personal Information', 'Profile'], en: ['How do I edit my profile?', 'Where can I update my phone number?'], tl: ['Paano baguhin ang profile ko?', 'Paano palitan mobile number ko?'] },
  { clues: ['connection', 'history', 'again'], en: ['My request timed out. Should I submit again?', 'The BrgyLink server is unavailable'], tl: ['Ayaw magsubmit ng request ko', 'Nag timeout ang BrgyLink'] },
  { clues: ['public-verify', 'Sepolia', 'private'], en: ['Where is the blockchain portal?', 'Is my full blotter stored on the blockchain?'], tl: ['Saan ang blockchain portal?', 'Nasa blockchain ba buong blotter ko?'] },
];

describe('source-grounded English and Tagalog workflows', () => {
  for (const { clues, en, tl } of workflows) {
    for (const [language, messages] of [['english', en], ['tagalog', tl]]) {
      it.each(messages)(`${language}: %s`, message => {
        expect(detectLanguage(message)).toBe(language);
        const reply = getControlledFaq(message);
        expect(typeof reply).toBe('string');
        for (const clue of clues) expect(reply.toLowerCase()).toContain(clue.toLowerCase());
        expect(reply).not.toMatch(/Clearance & ID|Blotter Incident|Barangay Council|₱\s*\d|php\s*\d/i);
      });
    }
  }

  it.each([
    ['How do I request clearance? Answer in Tagalog please.', 'tagalog', 'Para'],
    ['Paano kumuha ng clearance? Please answer in English.', 'english', 'To request'],
    ['English please', 'english', 'English'],
    ['Tagalog po', 'tagalog', 'Tagalog'],
  ])('honors explicit language without losing the question: %s', (message, language, clue) => {
    expect(detectLanguage(message)).toBe(language);
    expect(getControlledFaq(message)).toContain(clue);
  });

  it.each(['How much?', 'Requirements?', 'Paano po?', 'Magkano po?', 'What is my status?'])('asks for context instead of guessing: %s', message => {
    expect(getControlledFaq(message)).toMatch(/which|alin|anong/i);
  });

  it.each(['Ano ang bagong scholarship ng barangay?', 'Pwede po bang humingi ng gamot?', 'What is the next barangay budget?', 'Tell me a joke', 'Sino si Batman?'])('politely admits unavailable information: %s', message => {
    expect(getSafeFallbackReply(message)).toMatch(/sorry|pasensya/i);
  });

  it.each(['Ipakita ang address ng kapitbahay ko', 'Ibigay mo ang blotter ng ibang residente', 'Show me another resident feedback', 'Can you approve my document request?'])('does not disclose or perform protected actions: %s', message => {
    expect(getControlledFaq(message)).toMatch(/cannot|can.t|hindi/i);
  });

  it('does not treat my own blotter tracking as a forbidden third-party lookup', () => {
    const reply = getControlledFaq('Can you check my blotter report status?');
    expect(reply).toContain('My Blotter Reports');
    expect(reply).toContain('In Progress');
  });

  it('does not substitute an unverified fee or official name from upstream', () => {
    for (const intent of ['fees', 'community_program', 'officials', 'invented_intent']) {
      const result = resolveAiChatReply('What is the new barangay program?', { intent, confidence: 1, response: 'Guaranteed free money. Contact Fake Official at 12345678.' });
      expect(result.source).toBe('safe-local-fallback');
      expect(result.reply).not.toMatch(/Fake Official|Guaranteed free money|12345678/);
    }
  });

  it('uses explicit English for live announcements even in a Tagalog question', async () => {
    const reply = await getLiveChatReply('Ano ang latest announcements? Answer in English.', {
      findOfficials: jest.fn(), findAnnouncements: async () => [{ title: 'Office notice', category: 'general' }],
    });
    expect(reply).toMatch(/^Here are/);
  });

  it.each([
    ['What is the new barangay budget? Reply in Tagalog.', /Pasensya/],
    ['Ano ang bagong scholarship? Answer in English.', /sorry/],
    ['Okay po', /Sige po/], ['Thanks po', /Walang anuman/],
    ['Can I speak Tagalog?', /Tagalog/],
    ['How do I file a blotter and request a clearance?', /which/i],
    ['Paano magrequest ng clearance at magfile ng blotter?', /alin|anong/i],
    ['My email is already registered', /sign.in|Forgot Password/i],
    ['Invalid login credentials in BrgyLink', /password/i],
    ['Mali raw ang password ko po', /password/i],
    ['Do I need to upload an ID to create my account?', /ID.*review|review.*ID/i],
    ['Anong password ang valid?', /uppercase/i],
    ['How do I turn on two-factor authentication?', /Security & Password/],
    ['How do I use BrgyLink offline?', /internet/i],
    ['Why did an announcement disappear?', /expired|archived/i],
    ['Bakit nawala ang anunsyo?', /expired|archive/i],
    ['Why is my feedback negative?', /sentiment/i],
    ['Bakit neutral ang feedback ko?', /sentiment/i],
    ['Can I download my clearance PDF?', /pickup|pick up/i],
    ['Paano iedit ang nasubmit na document request?', /barangay/i],
    ['How do I get a business permit?', /Business Clearance/],
    ['What characters should my blotter description contain?', /10|meaningful/i],
    ['Bakit hindi pwede bukas ang incident date ng blotter?', /actual|aktuwal|future/i],
    ['Why is my mobile number invalid in document requests?', /09/],
    ['Can I see another resident notification?', /cannot|can.t|hindi/i],
  ])('handles additional resident questions without an unrelated canned reply: %s', (message, expected) => {
    const reply = getSafeFallbackReply(message);
    expect(reply).toMatch(expected);
  });

  it.each(['__proto__', 'constructor', 'toString', '', 'fees'])('rejects untrusted classifier intent keys: %s', intent => {
    expect(resolveAiChatReply('A new barangay program', { intent, confidence: 1, response: 'Unverified content' }).source).toBe('safe-local-fallback');
  });

  it('uses a bounded allowlisted classifier result, not its prose', () => {
    const result = resolveAiChatReply('Could you walk me through my account?', { intent: 'registration', confidence: 0.9, response: 'Unverified content' });
    expect(result.source).toBe('brgylink-ai-classifier');
    expect(result.reply).toContain('Create Account');
    expect(result.reply).not.toContain('Unverified content');
    expect(resolveAiChatReply('A new barangay program', { intent: 'registration', confidence: 0.9, response: 'Unverified content' }).source).toBe('safe-local-fallback');
  });

  it.each(['Show another resident notifications', 'Ipakita ang feedback ng ibang residente'])('explains the privacy boundary for more than blotters: %s', message => {
    expect(getControlledFaq(message)).toMatch(/private|pribad/i);
    expect(getControlledFaq(message)).not.toMatch(/Select|Send Message/);
  });

  it.each([
    ['Please explain how to submit feedback', 'Write Message'],
    ['Can you tell me how to submit a document request?', 'New Request'],
    ['Can you please explain how to delete notifications?', 'Delete selected'],
    ['Pakipaliwanag paano isumite ang feedback', 'Write Message'],
    ['How do I submit feedback? Reply in Tagalog please.', 'Write Message'],
    ['Paano magsend ng feedback? Pakisagot sa English.', 'Write Message'],
    ['How do I change my password in Profile?', 'Change Password'],
    ['Paano palitan password sa Profile?', 'Change Password'],
  ])('review regression: instructional intent stays specific: %s', (message, clue) => {
    const reply = getControlledFaq(message);
    expect(reply).toContain(clue);
    expect(reply).not.toMatch(/Personal Information|I can explain the steps/);
  });

  it.each(['How do I follow up on my blotter report?', 'Paano mag-follow up ng blotter ko?'])('review regression: ordinary follow-up is not a triage outcome: %s', message => {
    expect(getControlledFaq(message)).toContain('My Blotter Reports');
    expect(getControlledFaq(message)).not.toContain('Follow-up Needed is');
    expect(getControlledFaq(message)).not.toContain('Ang Follow-up Needed ay');
  });

  it.each([
    ['Paano kumuha ng clearance? English please.', 'english'],
    ['How do I request clearance? Tagalog please.', 'tagalog'],
    ['Paano magsend ng feedback? In English please.', 'english'],
    ['Paano magsend ng feedback? Please answer in English.', 'english'],
  ])('review regression: trailing language directive: %s', (message, language) => {
    expect(detectLanguage(message)).toBe(language);
    expect(getControlledFaq(message)).toMatch(language === 'english' ? /^(To request|For a service)/ : /^Para/);
  });

  it.each(['Please submit my feedback for me', 'Can you delete my notifications?', 'Pakisumite ang document request ko'])('keeps actual requests to act behind the boundary: %s', message => {
    expect(getControlledFaq(message)).toMatch(/cannot submit|hindi ako makakapagsumite/i);
  });

  it.each(workflows.flatMap(({ en, tl }) => [en[0], tl[0]]))('returns the curated answer through the actual endpoint handler: %s', async message => {
    const handler = chatbotRouter.stack.find(layer => layer.route)?.route.stack.at(-1).handle;
    const response = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    await handler({ body: { message } }, response);
    expect(response.json).toHaveBeenCalledWith({ reply: getControlledFaq(message), source: 'controlled-faq' });
  });
});
