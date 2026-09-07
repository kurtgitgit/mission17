import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ChatOllama } from "@langchain/ollama";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import rateLimit from 'express-rate-limit';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Load Dataset Dictionary ───────────────────────────────────────────────────
let pangasinanDictionary = "";
let ilocanoDictionary = "";
try {
  const dictionaryPath = path.join(__dirname, '../utils/pangasinan_examples.json');
  const examples = JSON.parse(fs.readFileSync(dictionaryPath, 'utf-8'));
  // Convert JSON array into a readable string list for the AI
  pangasinanDictionary = examples.map(ex => `- USER: "${ex.User}" -> BOT: "${ex.Bot}"`).join('\n');
} catch (error) {
  console.error("⚠️ Failed to load Pangasinan dictionary:", error.message);
}

try {
  const ilocanoPath = path.join(__dirname, '../utils/ilocano_examples.json');
  const examples = JSON.parse(fs.readFileSync(ilocanoPath, 'utf-8'));
  ilocanoDictionary = examples.map(ex => `- USER: "${ex.User}" -> BOT: "${ex.Bot}"`).join('\n');
} catch (error) {
  console.error("⚠️ Failed to load Ilocano dictionary:", error.message);
}

// ─── System Prompt ─────────────────────────────────────────────────────────────
// Limit static language samples so a request stays focused on the resident's
// actual question. The full files are useful reference material, not prompt text.
pangasinanDictionary = pangasinanDictionary.slice(0, 6000);
ilocanoDictionary = ilocanoDictionary.slice(0, 4000);

const SYSTEM_PROMPT = `You are the official digital assistant for Barangay Bagong Pag-asa, San Jacinto, and the Mission 17 App.

Your purpose is to answer inquiries about:
1. The app's features: Blotter Reports, Document Requests, Announcements, SDG Missions, Barangay Officials, and Suggestions.
2. How to file Blotter Reports and other barangay services.
3. Information about the 17 Sustainable Development Goals (SDGs).
4. General barangay processes and schedules.
5. General Philippine government and public-service processes, while clearly identifying when the user should confirm current requirements with the responsible agency.

LANGUAGE RULES (CRITICAL):
- Detect the language the user is writing in and always respond in that same language.
- Seamlessly support English, Filipino/Tagalog, Pangasinan, and Ilocano.
- If the user writes in Tagalog, reply in Tagalog. If in English, reply in English.
- If the user writes in Pangasinan, respond in simple Pangasinan. Do not switch to English unless the user asks.
- If the user writes in Ilocano, respond in simple Ilocano. Do not switch to English unless the user asks.
- When the user's language is unclear, ask one short clarification question in Filipino/Tagalog.

PANGASINAN LANGUAGE CONVERSATIONAL EXAMPLES (Use these heavily to understand vocabulary and grammar):
${pangasinanDictionary}

ILOCANO LANGUAGE CONVERSATIONAL EXAMPLES (Use these heavily to understand vocabulary and grammar):
${ilocanoDictionary}

TONE & FORMAT RULES:
- Keep responses concise, friendly, and helpful.
- Use bullet points or numbered lists when explaining steps.
- Add relevant emojis to make responses feel friendly (🏛️, 📋, ✅, etc.).
- Answer only questions about Barangay Bagong Pag-asa, BrgyLink, SDGs, or the Philippine government and Philippine public services. Do not answer questions about foreign governments. Politely decline unrelated subjects such as mathematics, entertainment, sports, personal advice, and general trivia.
- Remember the context of the entire conversation — never ask for information the user already provided.
- Never invent fees, phone numbers, office hours, addresses, processing times, requirements, policies, or database records. If a specific fact is not provided in verified app content, say that you do not have the current information and direct the user to the official barangay office or Announcements screen.
- Do not claim that a request was submitted, approved, paid, downloaded, or otherwise completed. The chatbot can only explain how to use the app.
- Do not provide legal, medical, or emergency advice beyond directing the user to the appropriate official service.`;

// ─── Model URL ─────────────────────────────────────────────────────────────────
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
// Extract base URL for LangChain (e.g., http://localhost:11434)
const OLLAMA_BASE_URL = OLLAMA_URL.replace('/api/chat', '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';
const MAX_MESSAGE_LENGTH = 1_200;
const MAX_HISTORY_ITEMS = 8;
const MAX_HISTORY_MESSAGE_LENGTH = 1_200;

const IN_SCOPE_PATTERN = /\b(barangay|brgy|bagong\s+pag-asa|san\s+jacinto|mission\s*17|brgylink|document|clearance|certificate|request|blotter|report|complaint|suggestion|announcement|official|kagawad|captain|civic|service|permit|resident|verification|otp|profile|account|notification|sdg|sustainable|mission|event|points?|leaderboard|government|governance|public\s+service|public\s+office|public\s+agency|local\s+government|national\s+government|lgu|municipal|municipality|city\s+hall|mayor|province|provincial|government\s+id|philippine|psa|dilg|dswd|doh|deped|tesda|comelec|bir|sss|gsis|pag-ibig|philhealth|nbi|police|pnp|passport|visa|voter|election|tax|benefit|assistance|aid|scholarship|ordinance|law|permit|license|pagkuha|kahilingan|dokumento|sertipiko|reklamo|ulat|pabatid|opisyal|serbisyo|mamamayan|pamahalaan|gobyerno|tulong|benepisyo|buwis|halalan|barangay\s+hall|purok|kasapulan|dokument|pakaammo|mabalin|agkiddaw)\b/i;
const GREETING_PATTERN = /^\s*(hi|hello|hey|good\s+(morning|afternoon|evening)|kumusta|kamusta|mabuhay|maong|kablaaw|naragsak)([!,.\s]+)?$/i;
const LANGUAGE_TOPIC_PATTERN = /\b(pangasinan|ilocano|ilokano|tagalog|filipino|wika|salita|pagsasao|translation|translate|isalin)\b/i;

export const detectLanguage = (message) => {
  const text = message.toLowerCase();
  if (/\b(pangasinan|antoy|saray|diad|makatalos|nangan|onla|tua)\b/i.test(text)) return 'pangasinan';
  if (/\b(ilocano|ilokano|ania|dagiti|iti|wen|mabalin|agkiddaw|kasano|agyaman)\b/i.test(text)) return 'ilocano';
  if (/\b(tagalog|filipino|kumusta|kamusta|paano|saan|bakit|salamat|ako|ang|mga)\b/i.test(text)) return 'tagalog';
  return 'english';
};

const languageCapabilityReply = (language) => {
  if (language === 'pangasinan') return 'On, makatalos ak na Pangasinan. Makatulong ak ed saray serbisyo na Barangay Bagong Pag-asa, BrgyLink app, dokumento, blotter, tan mission.';
  if (language === 'ilocano') return 'Wen, makaawatak iti Ilocano. Makatulongak kadagiti serbisyo ti Barangay Bagong Pag-asa, BrgyLink app, dokumento, blotter, ken mission.';
  if (language === 'tagalog') return 'Oo, nakakaunawa ako ng Tagalog. Makakatulong ako sa mga serbisyo ng Barangay Bagong Pag-asa, BrgyLink app, dokumento, blotter, at mga mission.';
  return 'Yes, I can assist in English, Tagalog, Pangasinan, and Ilocano with Barangay Bagong Pag-asa and BrgyLink questions.';
};

const contactOfficeReply = (language) => {
  if (language === 'pangasinan') return 'Wala ak na beripikado ya kasalukuyan ya detalye. Pakisilip so Announcements odino pakaammo ed opisyal ya barangay office.';
  if (language === 'ilocano') return 'Awan kaniak ti napasingkedan a kasalukuyan a detalye. Kitaem ti Announcements wenno agdamag iti opisial a barangay office.';
  if (language === 'tagalog') return 'Wala akong beripikadong kasalukuyang detalye. Pakitingin ang Announcements o magtanong sa opisyal na barangay office.';
  return 'I do not have verified current details. Please check Announcements or contact the official barangay office.';
};

// These are deliberately limited to app-navigation facts documented in USER_MANUAL.md.
// They do not state changing requirements, fees, office hours, or release times.
export const getControlledFaq = (message) => {
  const text = message.toLowerCase();
  const language = detectLanguage(message);

  if (LANGUAGE_TOPIC_PATTERN.test(message)) return languageCapabilityReply(language);

  const isClearance = /barangay\s+clearance|clearance/.test(text);
  const isBlotter = /blotter|incident\s+report|reklamo/.test(text);
  const isDocument = /document|dokumento|dokument|sertipiko|certificate/.test(text);

  if (isClearance) {
    if (language === 'pangasinan') return "Para mangikeddeng na Barangay Clearance, buksan so 'Document Requests' ed BrgyLink, piliyen so 'Barangay Clearance', punan so form, tan subaybayan so status na request. Para ed kasapulan, bayad, oras, odino panangala, pakisilip so Announcements odino pakaammo ed opisyal ya barangay office.";
    if (language === 'ilocano') return "Tapno agkiddaw iti Barangay Clearance, lukatam ti 'Document Requests' iti BrgyLink, piliem ti 'Barangay Clearance', punuem ti form, ket surotem ti estado ti request. Para kadagiti kasapulan, bayad, oras, wenno panangala, kitaem ti Announcements wenno agdamag iti opisial a barangay office.";
    if (language === 'tagalog') return "Para humiling ng Barangay Clearance, buksan ang 'Document Requests' sa BrgyLink, piliin ang 'Barangay Clearance', kumpletuhin ang form, at subaybayan ang status ng request. Para sa kasalukuyang requirements, bayad, oras, o pagkuha, tingnan ang Announcements o magtanong sa opisyal na barangay office.";
    return "To request a Barangay Clearance, open 'Document Requests' in BrgyLink, select 'Barangay Clearance', complete the form, and monitor the request status. For current requirements, fees, hours, or collection instructions, check Announcements or contact the official barangay office.";
  }

  if (isBlotter) {
    if (language === 'pangasinan') return "Para mangipasa na blotter odino reklamo, buksan so 'Blotter Reports' ed BrgyLink tan piliyen so 'File New Report'. Ipasok so tama ya detalye na insidente tan subaybayan so report ed 'My Blotter Reports'. Para ed emergency, tawagan so angkakaukolan ya emergency service.";
    if (language === 'ilocano') return "Tapno mangipasa iti blotter wenno reklamo, lukatam ti 'Blotter Reports' iti BrgyLink ket piliem ti 'File New Report'. Isuratmo dagiti umiso a detalye ti insidente ket surotem ti report iti 'My Blotter Reports'. Para iti emergency, tawagam ti maitutop nga emergency service.";
    if (language === 'tagalog') return "Para maghain ng blotter o reklamo, buksan ang 'Blotter Reports' sa BrgyLink at piliin ang 'File New Report'. Ilagay ang tamang detalye ng insidente at subaybayan ang report sa 'My Blotter Reports'. Para sa emergency, tawagan ang naaangkop na emergency service.";
    return "To file a blotter report or complaint, open 'Blotter Reports' in BrgyLink and select 'File New Report'. Enter accurate incident details and track the report in 'My Blotter Reports'. For an emergency, contact the appropriate emergency service.";
  }

  if (isDocument) {
    if (language === 'pangasinan') return "Para mangikeddeng na dokumento, buksan so 'Document Requests' ed BrgyLink, piliyen so klase na dokumento, tan punan so form. Para ed kasapulan, bayad, oras, odino panangala, pakisilip so Announcements odino pakaammo ed opisyal ya barangay office.";
    if (language === 'ilocano') return "Tapno agkiddaw iti dokumento, lukatam ti 'Document Requests' iti BrgyLink, piliem ti klase ti dokumento, ket punuem ti form. Para kadagiti kasapulan, bayad, oras, wenno panangala, kitaem ti Announcements wenno agdamag iti opisial a barangay office.";
    if (language === 'tagalog') return "Para humiling ng dokumento, buksan ang 'Document Requests' sa BrgyLink, piliin ang uri ng dokumento, at kumpletuhin ang form. Para sa kasalukuyang requirements, bayad, oras, o pagkuha, tingnan ang Announcements o magtanong sa opisyal na barangay office.";
    return "To request a document, open 'Document Requests' in BrgyLink, select the document type, and complete the form. For current requirements, fees, hours, or collection instructions, check Announcements or contact the official barangay office.";
  }

  return null;
};

const UNVERIFIED_DETAIL_PATTERN = /(?:[₱]\s*\d|\bphp\s*\d|\b\d+\s*(?:days?|araw|oras|hours?)\b|\bpdf\b|\bqr\s*code\b|\bconfirmation\s*(?:number|code)\b)/i;

export const guardModelReply = (message, reply) => {
  if (UNVERIFIED_DETAIL_PATTERN.test(reply)) return contactOfficeReply(detectLanguage(message));
  return reply;
};

export const isInScope = (message) => (
  IN_SCOPE_PATTERN.test(message) || GREETING_PATTERN.test(message) || LANGUAGE_TOPIC_PATTERN.test(message)
);

export const outOfScopeReply = (message) => {
  const language = detectLanguage(message);
  if (LANGUAGE_TOPIC_PATTERN.test(message)) return languageCapabilityReply(language);
  if (language === 'pangasinan') return 'Makatulong ak ed saray serbisyo na Barangay Bagong Pag-asa, BrgyLink app, SDG missions, tan serbisyong pampubliko ed Pilipinas.';
  if (language === 'ilocano') return 'Makatulongak kadagiti serbisyo ti Barangay Bagong Pag-asa, BrgyLink app, SDG missions, ken serbisio publiko iti Pilipinas.';
  if (language === 'tagalog') return 'Makakatulong ako sa mga serbisyo ng Barangay Bagong Pag-asa, BrgyLink app, SDG missions, at pangkalahatang serbisyo ng pamahalaan.';
  return 'I can help with Barangay Bagong Pag-asa services, the BrgyLink app, SDG missions, and Philippine government or public-service questions.';
};

// The chatbot can invoke a costly model. Keep a dedicated, conservative limit
// even though the application also has a broad global API limiter.
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { reply: 'Too many chatbot requests. Please wait a moment and try again.' },
});

// ─── Keyword Fallback ──────────────────────────────────────────────────────────
export const getMockReply = (message) => {
  const controlledReply = getControlledFaq(message);
  if (controlledReply) return controlledReply;

  const msg = message.toLowerCase();
  const language = detectLanguage(message);
  if (LANGUAGE_TOPIC_PATTERN.test(message)) return languageCapabilityReply(language);

  if (language === 'pangasinan') {
    if (msg.includes('blotter') || msg.includes('reklamo')) return "Para mangipasa na blotter odino reklamo, onla ed 'Services' tan piliyen so 'eFeedback / Blotter'.";
    if (msg.includes('document') || msg.includes('dokument') || msg.includes('sertipiko')) return "Para mangikeddeng na dokumento, onla ed 'Services' tan piliyen so 'Document Requests'.";
    return 'Makatulong ak ed saray serbisyo na Barangay Bagong Pag-asa, BrgyLink app, SDG missions, tan serbisyong pampubliko ed Pilipinas.';
  }
  if (language === 'ilocano') {
    if (msg.includes('blotter') || msg.includes('reklamo')) return "Tapno mangipasa iti blotter wenno reklamo, mapanka iti 'Services' ken piliem ti 'eFeedback / Blotter'.";
    if (msg.includes('document') || msg.includes('dokument') || msg.includes('sertipiko')) return "Tapno agkiddaw iti dokumento, mapanka iti 'Services' ken piliem ti 'Document Requests'.";
    return 'Makatulongak kadagiti serbisyo ti Barangay Bagong Pag-asa, BrgyLink app, SDG missions, ken serbisio publiko iti Pilipinas.';
  }
  if (language === 'tagalog') {
    if (msg.includes('blotter') || msg.includes('reklamo')) return "Para maghain ng blotter o reklamo, pumunta sa 'Services' at piliin ang 'eFeedback / Blotter'.";
    if (msg.includes('document') || msg.includes('dokumento') || msg.includes('sertipiko')) return "Para humiling ng dokumento, pumunta sa 'Services' at piliin ang 'Document Requests'.";
    return 'Makakatulong ako sa mga serbisyo ng Barangay Bagong Pag-asa, BrgyLink app, SDG missions, at pangkalahatang serbisyo ng pamahalaan.';
  }
  if (msg.includes('blotter')) return "To file a Blotter Report, go to the 'Services' section and select 'eFeedback / Blotter'. Provide as much incident detail as possible! 📋";
  if (msg.includes('sdg') || msg.includes('mission')) return "Mission 17 encourages residents to complete Civic Tasks aligned with the 17 SDGs. Earn points on the 'Missions' page! 🌍";
  if (msg.includes('document') || msg.includes('request')) return "To request a barangay document, go to 'Services' and select 'Document Requests'. Fill out the form and wait for approval. 📄";
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('maong')) return "Mabuhay! 🏛️ Welcome to the official eGov Portal of Barangay Bagong Pag-asa. What can I help you with today?";
  if (msg.includes('thank') || msg.includes('salamat')) return "You're very welcome! Salamat! Let me know if you need anything else. 😊";
  return "Hello! 🏛️ I am the Barangay Bagong Pag-asa digital assistant. How can I help you today?";
};

// ─── Route ─────────────────────────────────────────────────────────────────────
router.post('/', chatbotLimiter, async (req, res) => {
  const { message, history = [] } = req.body;

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ reply: 'Please provide a message.' });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ reply: `Please keep messages under ${MAX_MESSAGE_LENGTH} characters.` });
  }
  const controlledReply = getControlledFaq(message);
  if (controlledReply) {
    return res.json({ reply: controlledReply, source: 'verified-app-navigation' });
  }
  if (!isInScope(message)) {
    return res.json({ reply: outOfScopeReply(message) });
  }

  const safeHistory = Array.isArray(history)
    ? history
      .slice(-MAX_HISTORY_ITEMS)
      .filter((item) => item && typeof item.text === 'string')
      .map((item) => ({ isBot: Boolean(item.isBot), text: item.text.slice(0, MAX_HISTORY_MESSAGE_LENGTH) }))
    : [];

  try {
    // Build LangChain messages from history
    const lcMessages = [
      new SystemMessage(SYSTEM_PROMPT),
      ...safeHistory.map(msg =>
        msg.isBot ? new AIMessage(msg.text) : new HumanMessage(msg.text)
      ),
      new HumanMessage(message)
    ];

    // If the user has an API key from a cloud provider, pass it in the headers
    const headers = {};
    if (process.env.OLLAMA_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.OLLAMA_API_KEY}`;
    }

    const chatOllama = new ChatOllama({
      baseUrl: OLLAMA_BASE_URL,
      model: OLLAMA_MODEL,
      temperature: 0.7,
      maxRetries: 1, // Fallback quickly if Ollama is down
      headers,
    });

    // We can also use numPredict via model_kwargs but for LangChain it's built-in via standard params if needed.
    // For ChatOllama, maxTokens translates to num_predict.
    chatOllama.maxTokens = 512; 

    const response = await chatOllama.invoke(lcMessages);

    const content = response?.content;
    const reply = typeof content === 'string'
      ? content
      : Array.isArray(content)
        ? content.map(part => typeof part === 'string' ? part : part?.text || '').join('').trim()
        : "I'm sorry, I couldn't understand that. Could you rephrase your question? 🤔";

    return res.json({ reply: guardModelReply(message, reply) });

  } catch (error) {
    console.error('ChatBot/LangChain Error:', error.message);
    return res.json({ reply: getMockReply(message) });
  }
});

export default router;
