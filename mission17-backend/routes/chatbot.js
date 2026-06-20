import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Load Dataset Dictionary ───────────────────────────────────────────────────
let pangasinanDictionary = "";
try {
  const dictionaryPath = path.join(__dirname, '../utils/pangasinan_examples.json');
  const examples = JSON.parse(fs.readFileSync(dictionaryPath, 'utf-8'));
  // Convert JSON array into a readable string list for the AI
  pangasinanDictionary = examples.map(ex => `- USER: "${ex.User}" -> BOT: "${ex.Bot}"`).join('\n');
} catch (error) {
  console.error("⚠️ Failed to load Pangasinan dictionary:", error.message);
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
- Seamlessly support English, Filipino/Tagalog, and Pangasinan.
- If the user writes in Tagalog, reply in Tagalog. If in English, reply in English.
- If the user writes in Pangasinan, do your best to respond in Pangasinan. Use simple, correct Pangasinan phrases.

PANGASINAN LANGUAGE CONVERSATIONAL EXAMPLES (Use these heavily to understand vocabulary and grammar):
${pangasinanDictionary}

TONE & FORMAT RULES:
- Keep responses concise, friendly, and helpful.
- Use bullet points or numbered lists when explaining steps.
- Add relevant emojis to make responses feel friendly (🏛️, 📋, ✅, etc.).
- If asked something outside Barangay Pantal, Mission 17, or SDGs, politely decline and steer the conversation back.
- Remember the context of the entire conversation — never ask for information the user already provided.`;

// ─── Model URL ─────────────────────────────────────────────────────────────────
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

// ─── Keyword Fallback ──────────────────────────────────────────────────────────
const getMockReply = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes('blotter'))                               return "To file a Blotter Report, go to the 'Services' section and select 'eFeedback / Blotter'. Provide as much incident detail as possible! 📋";
  if (msg.includes('sdg') || msg.includes('mission'))       return "Mission 17 encourages residents to complete Civic Tasks aligned with the 17 SDGs. Earn points on the 'Missions' page! 🌍";
  if (msg.includes('document') || msg.includes('request'))  return "To request a barangay document, go to 'Services' and select 'Document Requests'. Fill out the form and wait for approval. 📄";
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('maong')) return "Mabuhay! 🏛️ Welcome to the official eGov Portal of Barangay Pantal. What can I help you with today?";
  if (msg.includes('thank') || msg.includes('salamat'))     return "You're very welcome! Salamat! Let me know if you need anything else. 😊";
  return "Hello! 🏛️ I am the Barangay Pantal digital assistant. How can I help you today?";
};

// ─── Route ─────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ reply: 'Please provide a message.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  GEMINI_API_KEY not set. Using keyword fallback.');
    return res.json({ reply: getMockReply(message) });
  }

  try {
    // Build the conversation contents from history + new message
    const contents = [
      // Map previous messages from history
      ...history.map(msg => ({
        role: msg.isBot ? 'model' : 'user',
        parts: [{ text: msg.text }]
      })),
      // Add the latest user message
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data?.error?.message);
      return res.json({ reply: getMockReply(message) });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
      ?? "I'm sorry, I couldn't understand that. Could you rephrase your question? 🤔";

    return res.json({ reply });

  } catch (error) {
    console.error('ChatBot Error:', error.message);
    return res.json({ reply: getMockReply(message) });
  }
});

export default router;
