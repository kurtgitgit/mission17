import express from 'express';
import rateLimit from 'express-rate-limit';
import { BARANGAY_INFO } from '../config/barangayInfo.js';

const router = express.Router();
const MAX_MESSAGE_LENGTH = 1_200;
const CHATBOT_REQUEST_TIMEOUT_MS = 20_000;
const LANGUAGE_TOPIC_PATTERN = /\b(pangasinan|ilocano|ilokano|tagalog|filipino|wika|salita|pagsasao)\b/i;

export const detectLanguage = (message) => {
  const text = message.toLowerCase();
  if (/\b(pangasinan|antoy|saray|diad|makatalos|nangan|onla|tua)\b/i.test(text)) return 'pangasinan';
  if (/\b(ilocano|ilokano|ania|dagiti|iti|wen|mabalin|agkiddaw|kasano|agyaman)\b/i.test(text)) return 'ilocano';
  if (/\b(tagalog|filipino|kumusta|kamusta|paano|saan|bakit|salamat|ako|ang|mga)\b/i.test(text)) return 'tagalog';
  return 'english';
};

const languageCapabilityReply = (language) => {
  if (language === 'pangasinan') return 'On, makatalos ak na Pangasinan. Makatulong ak ed saray serbisyo na Barangay Bagong Pag-asa tan BrgyLink app.';
  if (language === 'ilocano') return 'Wen, makaawatak iti Ilocano. Makatulongak kadagiti serbisyo ti Barangay Bagong Pag-asa ken BrgyLink app.';
  if (language === 'tagalog') return 'Oo, nakakaunawa ako ng Tagalog. Makakatulong ako sa mga serbisyo ng Barangay Bagong Pag-asa at BrgyLink app.';
  return 'Yes, I can assist in English, Tagalog, Pangasinan, and Ilocano with Barangay Bagong Pag-asa and BrgyLink questions.';
};

const contactOfficeReply = (language) => {
  const details = `${BARANGAY_INFO.mobileDisplay}, ${BARANGAY_INFO.email}, ${BARANGAY_INFO.officeDays} ${BARANGAY_INFO.officeHours}`;
  if (language === 'pangasinan') return `Say beripikado ya contact na opisyal ya barangay office na ${BARANGAY_INFO.name}: ${details}. Contact person: ${BARANGAY_INFO.contactPerson}.`;
  if (language === 'ilocano') return `Ti napasingkedan a contact ti opisial a barangay office ti ${BARANGAY_INFO.name}: ${details}. Contact person: ${BARANGAY_INFO.contactPerson}.`;
  if (language === 'tagalog') return `Makipag-ugnayan sa opisyal na barangay office ng ${BARANGAY_INFO.name}: ${details}. Contact person: ${BARANGAY_INFO.contactPerson}.`;
  return `Contact the official barangay office of ${BARANGAY_INFO.name}: ${details}. Contact person: ${BARANGAY_INFO.contactPerson}.`;
};

export const getControlledFaq = (message) => {
  const text = message.toLowerCase();
  const language = detectLanguage(message);
  if (LANGUAGE_TOPIC_PATTERN.test(message)) {
    return languageCapabilityReply(language);
  }
  if (/contact|phone|telephone|mobile|number|email|address|office\s+hours|oras\s+ng\s+opisina|barangay\s+hall/i.test(text)) {
    return contactOfficeReply(language);
  }
  if (/barangay\s+clearance|clearance/i.test(text)) {
    if (language === 'ilocano') return "Tapno agkiddaw iti Barangay Clearance, lukatam ti 'Document Requests' iti BrgyLink, piliem ti 'Barangay Clearance', ket punuem ti form. Para kadagiti kasapulan, bayad, oras, wenno panangala, kitaem ti Announcements wenno agdamag iti opisial a barangay office.";
    if (language === 'tagalog') return "Para humiling ng Barangay Clearance, buksan ang 'Document Requests' sa BrgyLink, piliin ang 'Barangay Clearance', at kumpletuhin ang form. Para sa kasalukuyang requirements, bayad, oras, o pagkuha, tingnan ang Announcements o magtanong sa opisyal na barangay office.";
    if (language === 'pangasinan') return "Para mangikeddeng na Barangay Clearance, buksan so 'Document Requests' ed BrgyLink, piliyen so 'Barangay Clearance', tan punan so form. Para ed kasapulan, bayad, oras, odino panangala, pakisilip so Announcements odino pakaammo ed opisyal ya barangay office.";
    return "To request a Barangay Clearance, open 'Document Requests' in BrgyLink, select 'Barangay Clearance', and complete the form. For current requirements, fees, hours, or collection instructions, check Announcements or contact the official barangay office.";
  }
  if (/blotter|incident\s+report|reklamo/i.test(text)) {
    if (language === 'tagalog') return "Para maghain ng blotter o reklamo, buksan ang 'Blotter Reports' sa BrgyLink at piliin ang 'File New Report'. Ilagay ang tamang detalye ng insidente at subaybayan ang report sa 'My Blotter Reports'. Para sa emergency, tumawag sa 911.";
    if (language === 'ilocano') return "Tapno mangipasa iti blotter wenno reklamo, lukatam ti 'Blotter Reports' iti BrgyLink ket piliem ti 'File New Report'. Para iti emergency, tawagam ti 911.";
    if (language === 'pangasinan') return "Para mangipasa na blotter odino reklamo, buksan so 'Blotter Reports' ed BrgyLink tan piliyen so 'File New Report'. Para ed emergency, tawagan so 911.";
    return "To file a blotter report or complaint, open 'Blotter Reports' in BrgyLink and select 'File New Report'. For an emergency, call 911.";
  }
  return null;
};

const UNVERIFIED_DETAIL_PATTERN = /(?:[₱]\s*\d|\bphp\s*\d|\b\d+\s*(?:days?|araw|oras|hours?)\b|\bpdf\b|\bqr\s*code\b|\bconfirmation\s*(?:number|code)\b)/i;

export const guardModelReply = (message, reply) => (
  UNVERIFIED_DETAIL_PATTERN.test(reply) ? contactOfficeReply(detectLanguage(message)) : reply
);

export const isInScope = (message) => (
  /\b(barangay|brgy|bagong\s+pag-asa|san\s+jacinto|mission\s*17|brgylink|document|clearance|certificate|request|blotter|report|complaint|announcement|official|civic|service|permit|resident|verification|otp|profile|account|notification|sdg|mission|event|government|public\s+service|pamahalaan|gobyerno|serbisyo|tulong|kasapulan|dokument|agkiddaw)\b/i.test(message)
  || /^\s*(hi|hello|hey|good\s+(morning|afternoon|evening)|kumusta|kamusta|mabuhay|maong|kablaaw|naragsak)\b/i.test(message)
  || LANGUAGE_TOPIC_PATTERN.test(message)
);

export const outOfScopeReply = (message) => {
  const language = detectLanguage(message);
  if (LANGUAGE_TOPIC_PATTERN.test(message)) return languageCapabilityReply(language);
  if (language === 'pangasinan') return 'Makatulong ak ed saray serbisyo na Barangay Bagong Pag-asa tan BrgyLink app.';
  if (language === 'ilocano') return 'Makatulongak kadagiti serbisyo ti Barangay Bagong Pag-asa ken BrgyLink app.';
  if (language === 'tagalog') return 'Makakatulong ako sa mga serbisyo ng Barangay Bagong Pag-asa at BrgyLink app.';
  return 'I can help with Barangay Bagong Pag-asa services and BrgyLink app questions.';
};

export const getMockReply = (message) => {
  const controlledReply = getControlledFaq(message);
  if (controlledReply) return controlledReply;
  return outOfScopeReply(message);
};

export const getChatbotAiUrl = (
  configuredChatbotUrl = process.env.CHATBOT_AI_URL,
  verificationUrl = process.env.AI_SERVER_URL || 'https://kurtgitgit-mission17-ai.hf.space/predict',
) => {
  if (typeof configuredChatbotUrl === 'string' && configuredChatbotUrl.trim()) return configuredChatbotUrl.trim();
  const normalizedVerificationUrl = verificationUrl.replace(/\/+$/, '');
  return /\/predict$/i.test(normalizedVerificationUrl)
    ? normalizedVerificationUrl.replace(/\/predict$/i, '/chat')
    : `${normalizedVerificationUrl}/chat`;
};

export const requestChatbotAi = async (
  message,
  {
    fetchImpl = fetch,
    url = getChatbotAiUrl(),
    serviceToken = process.env.AI_SERVICE_TOKEN,
    timeoutMs = CHATBOT_REQUEST_TIMEOUT_MS,
  } = {},
) => {
  if (!serviceToken) throw new Error('AI_SERVICE_TOKEN is not configured for the chatbot gateway.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceToken}`,
      },
      // Never forward resident history, IDs, tokens, submissions, or account data.
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || typeof payload.response !== 'string' || !payload.response.trim()) {
      throw new Error(`Chatbot AI request failed with status ${response.status}.`);
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
};

const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { reply: 'Too many chatbot requests. Please wait a moment and try again.' },
});

router.post('/', chatbotLimiter, async (req, res) => {
  const { message } = req.body;
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ reply: 'Please provide a message.' });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ reply: `Please keep messages under ${MAX_MESSAGE_LENGTH} characters.` });
  }

  try {
    const aiReply = await requestChatbotAi(message);
    return res.json({ reply: aiReply.response, source: 'brgylink-ai-classifier' });
  } catch (error) {
    console.error('Chatbot AI gateway error:', error.message);
    return res.json({ reply: getMockReply(message), source: 'safe-local-fallback' });
  }
});

export default router;
