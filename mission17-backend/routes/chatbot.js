import express from 'express';
import rateLimit from 'express-rate-limit';
import { BARANGAY_INFO, LOCAL_EMERGENCY_HOTLINES } from '../config/barangayInfo.js';
import Announcement from '../models/Announcement.js';
import Official from '../models/Official.js';
import { getLiveChatReply } from './chatbotLiveData.js';

const router = express.Router();
const MAX_MESSAGE_LENGTH = 1_200;
const MAX_CHATBOT_AI_RESPONSE_BYTES = 32 * 1024;
const CHATBOT_REQUEST_TIMEOUT_MS = 12_000;
const LANGUAGE_TOPIC_PATTERN = /\b(pangasinan|ilocano|ilokano|tagalog|filipino|wika|salita|pagsasao)\b/i;
const IMMEDIATE_EMERGENCY_PATTERN = /\b(sunog|fire|ambulance|aksidente|cannot\s*breathe|can['’]?t\s+breathe|unable\s+to\s+breathe|trouble\s+(?:with\s+)?breathing|shortness\s+of\s+breath|difficulty\s+breathing|hirap\s*(?:na\s*)?huminga|(?:hindi|di)\s+(?:na\s+)?(?:(?:ako|siya|kami|tayo|sila|ka|kayo)\s+)?(?:na\s*)?makahinga|abuse|violence|threat|banta|heart\s*attack|unconscious|severe\s+bleeding|suicide|self[\s-]?harm|flood|baha|bagyo|earthquake|lindol)\b/i;
const EMERGENCY_TOPIC_PATTERN = /\b(?:emergenc(?:y|ies)|911|hotlines?)\b/i;
const NON_EMERGENCY_CONTEXT_PATTERN = /\b(?:no\s+(?:(?:current|immediate)\s+)?emergenc(?:y|ies)|not\s+(?:an?\s+)?(?:(?:current|immediate)\s+)?emergenc(?:y|ies)|non[-\s]?emergenc(?:y|ies))\b/i;
const PRIVATE_RECORD_REQUEST_PATTERN = /\b(?:look\s*up|lookup|find|search|show|give|reveal|share|access|retrieve|check)\b.{0,100}\b(?:blotter|incident\s+reports?|case\s+(?:records?|details?)|home\s+addresses?|resident\s+(?:records?|reports?|details?)|personal\s+data)\b|\b(?:someone\s+else'?s?|somebody\s+else'?s?|another|other|neighbor\w*|kapitbahay)\b.{0,80}\b(?:blotter|incident|case|report|address|records?|details?|data)\b/i;
const REMOVED_FEATURE_PATTERN = /\b(?:civic\s*(?:tasks?|participation)|community\s*(?:events?|initiatives?)|sdg\s*missions?)\b/i;
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

const emergencyReply = (language, message) => {
  const text = message.toLowerCase();
  const category = /\b(sunog|fire|apoy|bfp)\b/i.test(text)
    ? 'fire'
    : /\b(ambulance|ambulansya|cannot\s*breathe|can['’]?t\s+breathe|unable\s+to\s+breathe|trouble\s+(?:with\s+)?breathing|shortness\s+of\s+breath|difficulty\s+breathing|hirap\s*(?:na\s*)?huminga|makahinga|heart\s*attack|rhu|medical)\b/i.test(text)
      ? 'medical'
      : /\b(police|pnp|violence|abuse|threat|banta|assault|hold.?up|robbery|crime|krimen|sinasaksak|binabaril)\b/i.test(text)
        ? 'police'
        : /\b(flood|baha|bagyo|typhoon|earthquake|lindol|disaster|mdrrmo)\b/i.test(text)
          ? 'disaster'
          : null;
  const matchingContacts = category
    ? LOCAL_EMERGENCY_HOTLINES.filter((contact) => contact.category === category || contact.category === 'barangay')
    : LOCAL_EMERGENCY_HOTLINES;
  const contactLines = matchingContacts
    .map((contact) => `${contact.label}: ${contact.numbers.join(' / ')}`)
    .join('\n');
  const isImmediate = IMMEDIATE_EMERGENCY_PATTERN.test(message);

  if (language === 'tagalog') {
    const intro = isImmediate
      ? 'Kung may agarang panganib, tawagan agad ang naaangkop na lokal na hotline:'
      : 'Narito ang mga lokal na emergency hotline sa BrgyLink:';
    return `${intro}\n${contactLines}\nMakikita rin ang mga ito sa Home > Emergency Hotlines. Hindi nakakapagpadala o nakakatawag ng tulong ang BrgyLink.`;
  }
  if (language === 'ilocano') {
    const intro = isImmediate
      ? 'No adda dagus a peggad, tawagan a dagus ti umiso a lokal a hotline:'
      : 'Dagitoy dagiti lokal nga emergency hotline iti BrgyLink:';
    return `${intro}\n${contactLines}\nMakita met dagitoy iti Home > Emergency Hotlines. Saan a makapatulod wenno makatawag iti tulong ti BrgyLink.`;
  }
  if (language === 'pangasinan') {
    const intro = isImmediate
      ? 'No wala so tampol ya peligro, tawagan la so umiso ya lokal ya hotline:'
      : 'Saray lokal ya emergency hotline ed BrgyLink:';
    return `${intro}\n${contactLines}\nMakita met ira ed Home > Emergency Hotlines. Ag makapatulod odino makatawag na tulong so BrgyLink.`;
  }
  const intro = isImmediate
    ? 'If anyone is in immediate danger, call the appropriate local hotline now:'
    : 'These are the local emergency hotlines listed in BrgyLink:';
  return `${intro}\n${contactLines}\nYou can also find them under Home > Emergency Hotlines. BrgyLink cannot dispatch or call help for you.`;
};

const privateRecordReply = (language) => {
  if (language === 'tagalog') return "Hindi ako makakapaghanap o makakapagbahagi ng blotter report, tirahan, o pribadong detalye ng ibang residente. Para sa sarili mong report, mag-sign in at buksan ang 'My Blotter Reports'. Tanging awtorisadong kawani ang dapat mag-access ng case records sa tamang proseso.";
  if (language === 'ilocano') return "Saanak a makasapul wenno mangibingay iti blotter report, pagnaedan, wenno pribado a detalye ti sabali a residente. Para iti bukodmo a report, ag-sign in ken lukatam ti 'My Blotter Reports'. Dagiti awtorisado laeng a kawani ti makaakses kadagiti case record babaen iti umiso a proseso.";
  if (language === 'pangasinan') return "Agko na-search odino naibingay so blotter report, address, odino pribado ya detalye na arum ya residente. Para ed bukod mon report, mag-sign in tan buksan so 'My Blotter Reports'. Saray awtorisado labat ya staff so nanengneng ed case records gamit so umiso ya proseso.";
  return "I can't look up or disclose a resident's blotter report, home address, or other private case details in chat. For your own report, sign in and open 'My Blotter Reports'. Only authorized staff should access case records through the proper process.";
};

const retiredFeatureReply = (language) => {
  if (language === 'tagalog') return 'Wala akong beripikadong kasalukuyang proseso para sa Civic Tasks o Community Events sa BrgyLink. Gamitin lamang ang mga feature na nakikita sa app; tingnan ang Announcements o makipag-ugnayan sa opisina ng barangay para sa kasalukuyang impormasyon. Hindi ako tumatanggap o nagsusuri ng participation proof.';
  if (language === 'ilocano') return 'Awan ti napasingkedan nga agdama a proseso para iti Civic Tasks wenno Community Events iti BrgyLink. Usarem laeng dagiti feature a makita iti app; kitaem ti Announcements wenno makipag-ugnay iti opisina ti barangay para iti agdama nga impormasyon. Saanak a makaawat wenno makasuri iti participation proof.';
  if (language === 'pangasinan') return 'Agko verified ya kasalukuyan ya proseso para ed Civic Tasks odino Community Events ed BrgyLink. Usaren la so saray feature ya nanengneng ed app; nengnengen so Announcements odino mantepet ed opisina na barangay para ed agdama ya impormasyon. Agko naawat odino nasuri so participation proof.';
  return "I don't have a verified current Civic Tasks or Community Events workflow in BrgyLink. Use only features visible in the app; check Announcements or contact the barangay office for current information. I cannot accept or review participation proof.";
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
  if (IMMEDIATE_EMERGENCY_PATTERN.test(message)) return emergencyReply(language, message);
  if (PRIVATE_RECORD_REQUEST_PATTERN.test(text)) return privateRecordReply(language);
  if (EMERGENCY_TOPIC_PATTERN.test(text) && !NON_EMERGENCY_CONTEXT_PATTERN.test(text)) {
    return emergencyReply(language, message);
  }
  if (REMOVED_FEATURE_PATTERN.test(text)) return retiredFeatureReply(language);
  if (GREETING_PATTERN.test(message)) return greetingReply(language);
  if (/forgot\s+(?:my\s+)?password|reset\s+(?:my\s+)?password|nakalimutan.*password|nakalimutan.*password|password.*nakalimutan/i.test(text)) {
    if (language === 'tagalog') return "Sa sign-in screen ng BrgyLink, piliin ang 'Forgot Password', ilagay ang email na ginamit sa account, at buksan ang password-reset link na ipinadala sa email. Tingnan din ang Spam o Junk folder. Huwag ibahagi ang reset link o password mo.";
    return "On the BrgyLink sign-in screen, tap 'Forgot Password', enter the email used for your account, then open the password-reset link sent to that email. Check Spam or Junk too. Never share your reset link or password.";
  }
  if (/verification\s+code|verify\s+(?:my\s+)?email|did\s+not\s+receive.*code|didn['’]?t\s+receive.*code|otp|verification\s+email|code.*not\s+(?:arriv|receiv)/i.test(text)) {
    if (language === 'tagalog') return "Para sa email verification, ilagay ang 6-digit code na ipinadala sa email na ginamit mo sa pag-sign up. Tingnan ang Spam/Junk at tiyaking tama ang email. Kung wala pa rin ang code, bumalik sa sign-in at makipag-ugnayan sa opisyal na barangay office; walang verified na resend option na maituturo ko sa kasalukuyang app.";
    return "For signup email verification, enter the 6-digit code sent to the email you used to register. Check Spam/Junk and confirm the address is correct. If it still hasn't arrived, return to sign-in and contact the official barangay office; I can't confirm a resend option in the current app.";
  }
  if (/document\s+(?:request\s+)?status|request\s+status|check\s+(?:my\s+)?(?:document|clearance)\s+request/i.test(text)) {
    if (language === 'tagalog') return "Para makita ang sarili mong request, mag-sign in sa BrgyLink at buksan ang 'Document Requests' o 'My Requests'. Gamitin ang reference number para makilala ang request. Para sa kasalukuyang update o requirements, makipag-ugnayan sa barangay office; huwag magpadala ng pribadong detalye rito sa chat.";
    return "To check your own request, sign in to BrgyLink and open 'Document Requests' or 'My Requests'. Use its reference number to identify it. For a current update or requirements, contact the barangay office; don't post private details in this chat.";
  }
  if (/what\s+can\s+(?:brgylink|the\s+app)\s+(?:help\s+me\s+)?do|what\s+does\s+brgylink\s+do|brgylink\s+features/i.test(text)) {
    if (language === 'tagalog') return 'Makakatulong ang BrgyLink sa document requests, blotter reports, barangay announcements, resident feedback, notifications, at pagtingin sa impormasyon ng mga opisyal. Makikita sa app kung aling serbisyo ang available sa account mo.';
    return 'BrgyLink supports document requests, blotter reports, barangay announcements, resident feedback, notifications, and viewing barangay-official information. The services available to you are shown in the app.';
  }
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
    if (language === 'tagalog') return "Para maghain ng blotter o reklamo, buksan ang 'Blotter Reports' sa BrgyLink at piliin ang 'File New Report'. Ilagay ang tamang detalye ng insidente at subaybayan ang report sa 'My Blotter Reports'. Para sa emergency, gamitin ang naaangkop na numerong nasa Home > Emergency Hotlines.";
    if (language === 'ilocano') return "Tapno mangipasa iti blotter wenno reklamo, lukatam ti 'Blotter Reports' iti BrgyLink ket piliem ti 'File New Report'. Para iti emergency, usarem ti umiso a numero iti Home > Emergency Hotlines.";
    if (language === 'pangasinan') return "Para mangipasa na blotter odino reklamo, buksan so 'Blotter Reports' ed BrgyLink tan piliyen so 'File New Report'. Para ed emergency, usaren so umiso ya numero ed Home > Emergency Hotlines.";
    return "To file a blotter report or complaint, open 'Blotter Reports' in BrgyLink and select 'File New Report'. For an emergency, use the appropriate number under Home > Emergency Hotlines.";
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

const readBoundedChatbotAiPayload = async (response) => {
  const contentLength = Number(response.headers?.get?.('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_CHATBOT_AI_RESPONSE_BYTES) {
    throw new Error('Chatbot AI response exceeded the size limit.');
  }

  // Native fetch responses expose a stream. Bound streamed responses even when
  // the upstream omits Content-Length; the json() fallback supports test mocks.
  if (!response.body?.getReader) {
    const payload = await response.json().catch(() => ({}));
    if (Buffer.byteLength(JSON.stringify(payload ?? {}), 'utf8') > MAX_CHATBOT_AI_RESPONSE_BYTES) {
      throw new Error('Chatbot AI response exceeded the size limit.');
    }
    return payload;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_CHATBOT_AI_RESPONSE_BYTES) {
        await reader.cancel().catch(() => {});
        throw new Error('Chatbot AI response exceeded the size limit.');
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  try {
    return JSON.parse(Buffer.concat(chunks, totalBytes).toString('utf8'));
  } catch {
    return {};
  }
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
    const payload = await readBoundedChatbotAiPayload(response);
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

export const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { reply: 'Too many chatbot requests. Please wait a moment and try again.' },
});

// Keep chat payload parsing far below the general API limit. index.js mounts
// this parser and limiter before the shared JSON parser so oversized chat
// bodies are rejected before parsing or model/live-data work.
export const chatbotJsonParser = express.json({ limit: 16 * 1024 });

router.post('/', async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ reply: 'Please provide a message.' });
  }

  const { message } = body;
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
