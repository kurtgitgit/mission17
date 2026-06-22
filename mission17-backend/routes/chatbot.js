import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ChatOllama } from "@langchain/ollama";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

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
const SYSTEM_PROMPT = `You are the official digital assistant for Barangay Pantal, Dagupan City, and the Mission 17 App.

Your purpose is to answer inquiries about:
1. The app's features: Blotter Reports, Document Requests, Announcements, SDG Missions, Barangay Officials, and Suggestions.
2. How to file Blotter Reports and other barangay services.
3. Information about the 17 Sustainable Development Goals (SDGs).
4. General barangay processes and schedules.

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
- If asked something outside Barangay Pantal, Mission 17, or SDGs, politely decline and steer the conversation back.
- Remember the context of the entire conversation — never ask for information the user already provided.`;

// ─── Model URL ─────────────────────────────────────────────────────────────────
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
// Extract base URL for LangChain (e.g., http://localhost:11434)
const OLLAMA_BASE_URL = OLLAMA_URL.replace('/api/chat', '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

// ─── Keyword Fallback ──────────────────────────────────────────────────────────
const getMockReply = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes('blotter')) return "To file a Blotter Report, go to the 'Services' section and select 'eFeedback / Blotter'. Provide as much incident detail as possible! 📋";
  if (msg.includes('sdg') || msg.includes('mission')) return "Mission 17 encourages residents to complete Civic Tasks aligned with the 17 SDGs. Earn points on the 'Missions' page! 🌍";
  if (msg.includes('document') || msg.includes('request')) return "To request a barangay document, go to 'Services' and select 'Document Requests'. Fill out the form and wait for approval. 📄";
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('maong')) return "Mabuhay! 🏛️ Welcome to the official eGov Portal of Barangay Pantal. What can I help you with today?";
  if (msg.includes('thank') || msg.includes('salamat')) return "You're very welcome! Salamat! Let me know if you need anything else. 😊";
  return "Hello! 🏛️ I am the Barangay Pantal digital assistant. How can I help you today?";
};

// ─── Route ─────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ reply: 'Please provide a message.' });
  }

  try {
    // Build LangChain messages from history
    const lcMessages = [
      new SystemMessage(SYSTEM_PROMPT),
      ...history.map(msg => 
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

    const reply = response?.content 
      ?? "I'm sorry, I couldn't understand that. Could you rephrase your question? 🤔";

    return res.json({ reply });

  } catch (error) {
    console.error('ChatBot/LangChain Error:', error.message);
    return res.json({ reply: getMockReply(message) });
  }
});

export default router;
