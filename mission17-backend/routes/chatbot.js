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
- If the user writes in Pangasinan, do your best to respond in Pangasinan. Use simple, correct Pangasinan phrases.
- If the user writes in Ilocano, do your best to respond in Ilocano. Use simple, correct Ilocano phrases.

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

const IN_SCOPE_PATTERN = /\b(barangay|brgy|bagong\s+pag-asa|san\s+jacinto|mission\s*17|brgylink|document|clearance|certificate|request|blotter|report|complaint|suggestion|announcement|official|kagawad|captain|civic|service|permit|resident|verification|otp|profile|account|notification|sdg|sustainable|mission|event|points?|leaderboard|government|governance|public\s+service|public\s+office|public\s+agency|local\s+government|national\s+government|lgu|municipal|municipality|city\s+hall|mayor|province|provincial|government\s+id|philippine|psa|dilg|dswd|doh|deped|tesda|comelec|bir|sss|gsis|pag-ibig|philhealth|nbi|police|pnp|passport|visa|voter|election|tax|benefit|assistance|aid|scholarship|ordinance|law|permit|license|pagkuha|kahilingan|dokumento|sertipiko|reklamo|ulat|pabatid|opisyal|serbisyo|mamamayan|pamahalaan|gobyerno|tulong|benepisyo|buwis|halalan|barangay\s+hall|purok)\b/i;
const GREETING_PATTERN = /^\s*(hi|hello|hey|good\s+(morning|afternoon|evening)|kumusta|kamusta|mabuhay|maong)([!,.\s]+)?$/i;

const isInScope = (message) => IN_SCOPE_PATTERN.test(message) || GREETING_PATTERN.test(message);

const outOfScopeReply = (message) => {
  if (/\b(kumusta|kamusta|mabuhay|ano|paano|saan|bakit)\b/i.test(message)) {
    return 'Makakatulong ako sa mga serbisyo ng Barangay Bagong Pag-asa, BrgyLink app, SDG missions, at pangkalahatang serbisyo ng pamahalaan.';
  }
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
const getMockReply = (message) => {
  const msg = message.toLowerCase();
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

    return res.json({ reply });

  } catch (error) {
    console.error('ChatBot/LangChain Error:', error.message);
    return res.json({ reply: getMockReply(message) });
  }
});

export default router;
