import express from 'express';
import rateLimit from 'express-rate-limit';
import { BARANGAY_INFO } from '../config/barangayInfo.js';
import Announcement from '../models/Announcement.js';
import Official from '../models/Official.js';
import { getLiveChatReply } from './chatbotLiveData.js';

const router = express.Router();
const MAX_MESSAGE_LENGTH = 1_200;
const CHATBOT_REQUEST_TIMEOUT_MS = 12_000;
const LANGUAGE_TOPIC_PATTERN = /\b(pangasinan|ilocano|ilokano|tagalog|filipino|wika|salita|pagsasao)\b/i;
const EMERGENCY_PATTERN = /\b(911|emergency|sunog|fire|ambulance|aksidente|cannot\s*breathe|can['’]?t\s+breathe|unable\s+to\s+breathe|trouble\s+(?:with\s+)?breathing|shortness\s+of\s+breath|difficulty\s+breathing|hirap\s*(?:na\s*)?huminga|(?:hindi|di)\s+(?:na\s+)?(?:(?:ako|siya|kami|tayo|sila|ka|kayo)\s+)?(?:na\s*)?makahinga|abuse|violence|threat|banta|medical|sakit|fever|lagnat)\b/i;
const GREETING_PATTERN = /^\s*(hi|hello|hey|good\s+(morning|afternoon|evening)|kumusta|kamusta|mabuhay|maong|kablaaw|naragsak)[!.,?\s]*$/i;
// The directory is the resident-facing source of approved roster details.
// Do not disclose individual officials' personal contact details in chat.
const OFFICIAL_DIRECTORY_PATTERN = /\b(?:punong\s+barangay|barangay\s+captain|kapitan|barangay\s+kagawad|kagawad|barangay\s+officials?|officials?\s+(?:of|information|contact)|official\s+(?:directory|details?|phone|number|email|contact)|council(?:\s+members?)?)\b/i;

const normalizeMessage = (message) => message.trim().replace(/\s+/g, ' ');

export const detectLanguage = (message) => {
  const text = message.toLowerCase();
  if (/\b(pangasinan|antoy|saray|diad|makatalos|nangan|onla|tua)\b/i.test(text)) return 'pangasinan';
  if (/\b(ilocano|ilokano|ania|dagiti|iti|wen|mabalin|agkiddaw|kasano|agyaman)\b/i.test(text)) return 'ilocano';
  if (/\b(tagalog|filipino|kumusta|kamusta|paano|saan|bakit|salamat|ako|siya|hindi|di|sunog|hirap|makahinga|ang|mga|may|kailangan|mag-file|maghain)\b/i.test(text)) return 'tagalog';
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

const officialDirectoryReply = (language) => {
  if (language === 'tagalog') return "Para sa pangalan, tungkulin, o aprubadong impormasyon ng Punong Barangay at mga opisyal, buksan ang Barangay E-Services sa BrgyLink at piliin ang 'Barangay Council'. Para sa contact o agarang concern, makipag-ugnayan sa opisyal na barangay office.";
  if (language === 'pangasinan') return "Para ed ngaran, katungkulan, odino aprubado ya impormasyon na Punong Barangay tan saray opisyal, buksan so Barangay E-Services ed BrgyLink tan piliyen so 'Barangay Council'. Para ed contact odino agarang concern, pakaammo ed opisyal ya barangay office.";
  if (language === 'ilocano') return "Para iti nagan, katungdan, wenno naaprubaran nga impormasyon ti Punong Barangay ken dagiti opisial, lukatam ti Barangay E-Services iti BrgyLink ken piliem ti 'Barangay Council'. Para iti contact wenno napardas a concern, makipag-ugnay iti opisial a barangay office.";
  return "For the name, role, or approved information of the Punong Barangay and other officials, open Barangay E-Services in BrgyLink and select 'Barangay Council'. For contact or an urgent concern, contact the official barangay office.";
};

const emergencyReply = (language) => {
  if (language === 'tagalog') return 'Kung may agarang panganib o emergency, tumawag agad sa 911 at ibigay ang eksaktong lokasyon. Hindi emergency-response service ang BrgyLink. Kapag ligtas na, maaari mong gamitin ang Blotter Reports para sa naaangkop na non-emergency report.';
  if (language === 'pangasinan') return 'No wala so agarang peligro odino emergency, tawagan dayon so 911 tan ibaga so eksakto ya lugar. Aliwan emergency-response service so BrgyLink. No ligtas la, mabalin ya gamit so Blotter Reports para ed anggapo ya emergency report.';
  if (language === 'ilocano') return 'No adda dagus a peggad wenno emergency, tawagam dagus ti 911 ken ibagam ti eksakto a lugar. Saan a emergency-response service ti BrgyLink. No natalgeden, mabalin nga usaren ti Blotter Reports para iti non-emergency a report.';
  return 'If there is immediate danger or an emergency, call 911 now and provide the exact location. BrgyLink is not an emergency-response service. When it is safe, you can use Blotter Reports for an appropriate non-emergency report.';
};

const knowledgeGapReply = (language) => {
  if (language === 'tagalog') return 'Wala pa akong verified na sagot para rito. Maaari mong tingnan ang Announcements o makipag-ugnayan sa opisyal na barangay office para sa kumpirmadong impormasyon.';
  if (language === 'pangasinan') return 'Awan ak ni say beripikado ya sungbat ed saya. Pakisilip so Announcements odino pakaammo ed opisyal ya barangay office para ed kumpirmado ya impormasyon.';
  if (language === 'ilocano') return 'Awan pay ti napasingkedan a sungbatko maipapan iti daytoy. Kitaem ti Announcements wenno makipag-ugnay iti opisial a barangay office para iti napasingkedan nga impormasyon.';
  return 'I do not have verified information for that yet. Please check Announcements or contact the official barangay office for confirmed information.';
};

const greetingReply = (language) => {
  if (language === 'tagalog') return 'Mabuhay! Makakatulong ako sa document requests, blotter reports, announcements, at serbisyo ng Barangay Bagong Pag-asa. Ano ang kailangan mo?';
  if (language === 'pangasinan') return 'Mabuhay! Makatulong ak ed document requests, blotter reports, announcements, tan serbisyo na Barangay Bagong Pag-asa. Anto so kailangan mo?';
  if (language === 'ilocano') return 'Mabuhay! Makatulongak kadagiti document requests, blotter reports, announcements, ken serbisio ti Barangay Bagong Pag-asa. Ania ti kayatmo nga maammuan?';
  return 'Hello! I can help with document requests, blotter reports, announcements, and Barangay Bagong Pag-asa services. What do you need?';
};

export const getControlledFaq = (message) => {
  const text = message.toLowerCase();
  const language = detectLanguage(message);
  if (EMERGENCY_PATTERN.test(message)) return emergencyReply(language);
  if (GREETING_PATTERN.test(message)) return greetingReply(language);
  if (OFFICIAL_DIRECTORY_PATTERN.test(text)) return officialDirectoryReply(language);
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
  /\b(barangay|brgy|bagong\s+pag-asa|san\s+jacinto|brgylink|document|clearance|certificate|request|blotter|report|complaint|announcement|official|service|permit|resident|verification|otp|profile|account|notification|government|public\s+service|pamahalaan|gobyerno|serbisyo|tulong|kasapulan|dokument|agkiddaw)\b/i.test(message)
  || /^\s*(hi|hello|hey|good\s+(morning|afternoon|evening)|kumusta|kamusta|mabuhay|maong|kablaaw|naragsak)\b/i.test(message)
  || LANGUAGE_TOPIC_PATTERN.test(message)
);

export const outOfScopeReply = (message) => {
  const language = detectLanguage(message);
  if (LANGUAGE_TOPIC_PATTERN.test(message)) return languageCapabilityReply(language);
  if (language === 'pangasinan') return 'Makatulong ak ed saray serbisyo na Barangay Bagong Pag-asa tan BrgyLink app. Subok mo itanong: “Paano ako mangikeddeng na clearance?”, “Paano ako mangipasa na blotter?”, odino “Anto so latest announcements?”';
  if (language === 'ilocano') return 'Makatulongak kadagiti serbisyo ti Barangay Bagong Pag-asa ken BrgyLink app. Padasem nga agdamag: “Kasano nga agkiddaw iti clearance?”, “Kasano nga agpasa iti blotter?”, wenno “Ania ti latest announcements?”';
  if (language === 'tagalog') return 'Makakatulong ako sa mga serbisyo ng Barangay Bagong Pag-asa at BrgyLink app. Subukang itanong: “Paano ako hihingi ng clearance?”, “Paano ako magfa-file ng blotter?”, o “Ano ang latest announcements?”';
  return 'I can help with Barangay Bagong Pag-asa services and BrgyLink app questions. Try asking: “How do I request a clearance?”, “How do I file a blotter report?”, or “What are the latest announcements?”';
};

export const getMockReply = (message) => {
  const controlledReply = getControlledFaq(message);
  if (controlledReply) return controlledReply;
  return outOfScopeReply(message);
};

export const getSafeFallbackReply = (message) => {
  const controlledReply = getControlledFaq(message);
  if (controlledReply) return controlledReply;
  return isInScope(message) ? knowledgeGapReply(detectLanguage(message)) : outOfScopeReply(message);
};

export const getChatbotAiUrl = (
  configuredChatbotUrl = process.env.CHATBOT_AI_URL,
  verificationUrl = process.env.AI_SERVER_URL || 'https://kurtgitgit-mission17-ai.hf.space/predict',
) => {
  if (typeof configuredChatbotUrl === 'string' && configuredChatbotUrl.trim()) return configuredChatbotUrl.trim();
  const normalizedVerificationUrl = verificationUrl.trim().replace(/\/+$/, '');
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

export const requestLiveChatReply = (message) => getLiveChatReply(message, {
  findOfficials: () => Official.find({ isArchived: { $ne: true } })
    .sort({ order: 1, position: 1, createdAt: -1 })
    .select('name position')
    .limit(3)
    .lean(),
  findAnnouncements: () => Announcement.find({ isActive: true })
    .sort({ isUrgent: -1, isPinned: -1, createdAt: -1 })
    .select('title category isUrgent')
    .limit(3)
    .lean(),
});

const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { reply: 'Too many chatbot requests. Please wait a moment and try again.' },
});

router.post('/', chatbotLimiter, async (req, res) => {
  const { message } = req.body;
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ reply: 'Please provide a message.' });
  }
  const normalizedMessage = normalizeMessage(message);
  if (normalizedMessage.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ reply: `Please keep messages under ${MAX_MESSAGE_LENGTH} characters.` });
  }

  const controlledReply = getControlledFaq(normalizedMessage);
  if (controlledReply) return res.json({ reply: controlledReply, source: 'controlled-faq' });

  if (!isInScope(normalizedMessage)) {
    return res.json({ reply: outOfScopeReply(normalizedMessage), source: 'safe-local-fallback' });
  }

  try {
    const liveReply = await requestLiveChatReply(normalizedMessage);
    if (liveReply) return res.json({ reply: liveReply, source: 'live-brgylink-data' });
  } catch (error) {
    console.error('Chatbot live-data lookup error:', error.message);
  }

  try {
    const aiReply = await requestChatbotAi(normalizedMessage);
    return res.json({ reply: guardModelReply(normalizedMessage, aiReply.response), source: 'brgylink-ai-classifier' });
  } catch (error) {
    console.error('Chatbot AI gateway error:', error.message);
    return res.json({ reply: getSafeFallbackReply(normalizedMessage), source: 'safe-local-fallback' });
  }
});

export default router;
