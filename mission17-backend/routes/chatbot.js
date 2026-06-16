import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const SYSTEM_PROMPT = `You are the official digital assistant for Barangay Pantal, Dagupan City, and the Mission 17 App.
Your purpose is to answer inquiries about:
1. The app's services and features.
2. How to file Blotter Reports and other barangay services.
3. Information about the 17 Sustainable Development Goals (SDGs).

CRITICAL RULES:
- Support English, Tagalog, and Pangasinan seamlessly based on the user's language.
- Keep responses concise, friendly, and helpful.
- If asked about something outside Barangay Pantal, Mission 17, or SDGs, politely decline and steer the conversation back.`;

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`;

// Keyword-based fallback when Gemini API is unavailable
const getMockReply = (message) => {
  const msg = message.toLowerCase();
  if (msg.includes('blotter'))                         return "To file a Blotter Report, go to the 'Services' section and select 'eFeedback / Blotter'. Provide as much incident detail as possible!";
  if (msg.includes('sdg') || msg.includes('mission')) return "Mission 17 encourages residents to complete Civic Tasks aligned with the 17 SDGs. Earn points on the 'Missions' page!";
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) return "Mabuhay! Welcome to the official eGov Portal of Barangay Pantal. What can I help you with today?";
  if (msg.includes('thank'))                           return "You're very welcome! Let me know if you need anything else.";
  return "Hello! I am the Barangay Pantal digital assistant. How can I help you today?";
};

router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ reply: 'Please provide a message.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.json({ reply: getMockReply(message) });
  }

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: message }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data?.error?.message);
      return res.json({ reply: getMockReply(message) });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "I'm sorry, I couldn't understand that.";
    return res.json({ reply });

  } catch (error) {
    console.error('ChatBot Error:', error.message);
    return res.json({ reply: getMockReply(message) });
  }
});

export default router;
