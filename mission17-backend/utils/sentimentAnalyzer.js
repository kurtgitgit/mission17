// utils/sentimentAnalyzer.js
// Bilingual English & Filipino/Tagalog Sentiment Classifier for Barangay Feedback

const POSITIVE_WORDS = [
  // English
  'good', 'great', 'excellent', 'fast', 'quick', 'efficient', 'helpful', 'thank', 'thanks',
  'appreciate', 'appreciated', 'wonderful', 'safe', 'clean', 'improved', 'commend', 'kudos',
  'satisfactory', 'satisfied', 'friendly', 'courteous', 'organized', 'smooth', 'reliable',
  'responsive', 'fixed', 'peaceful', 'awesome', 'best', 'super', 'love', 'blessed',
  // Tagalog / Filipino
  'salamat', 'maraming salamat', 'galing', 'magaling', 'maayos', 'mabilis', 'maganda',
  'malinis', 'mabait', 'tulong', 'maasahan', 'ligtas', 'tahimik', 'ayos', 'husay',
  'napaganda', 'napakaayos', 'salute', 'pasasalamat', 'hanga', 'mabuti', 'praise'
];

const NEGATIVE_GRIEVANCE_WORDS = [
  // English
  'bad', 'terrible', 'horrible', 'slow', 'delay', 'delayed', 'broken', 'damage', 'damaged',
  'dirty', 'filthy', 'smell', 'foul', 'noise', 'noisy', 'flood', 'flooded', 'pothole',
  'dark', 'hazard', 'dangerous', 'danger', 'complaint', 'reklamo', 'problem', 'issue',
  'unresponsive', 'rude', 'neglect', 'neglected', 'unsafe', 'leak', 'leakage', 'outage',
  'brownout', 'blockage', 'traffic', 'accident', 'theft', 'crime', 'stolen', 'scam',
  // Tagalog / Filipino
  'pangit', 'mabagal', 'sira', 'sirang', 'madumi', 'baho', 'mabaho', 'ingay', 'maingay',
  'baha', 'lubak', 'dilim', 'madilim', 'pabaya', 'reklamo', 'tambak', 'putik', 'sikip',
  'perwisyo', 'abala', 'galit', 'nawawala', 'nakakatakot', 'masungit', 'bastos', 'tagal',
  'matagal', 'hirap', 'mahirap', 'walang kwenta', 'palpak', 'tapon'
];

const NEUTRAL_INQUIRY_MARKERS = [
  'schedule', 'kailan', 'paano', 'saan', 'paki', 'please', 'inquiry', 'tanong',
  'request', 'update', 'follow up', 'followup', 'anunsyo', 'alam', 'kailangan',
  'garbage collection', 'waste management', 'clean up drive', 'trak ng basura'
];

/**
 * Analyzes the sentiment of a text string (English & Filipino).
 * @param {string} text 
 * @returns {{ sentiment: 'Positive' | 'Neutral' | 'Negative', score: number }}
 */
export const analyzeSentiment = (text = '') => {
  if (!text || typeof text !== 'string') {
    return { sentiment: 'Neutral', score: 0 };
  }

  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalized.split(/\s+/).filter(Boolean);

  let positiveScore = 0;
  let negativeScore = 0;
  let hasInquiryMarker = false;

  for (const marker of NEUTRAL_INQUIRY_MARKERS) {
    if (normalized.includes(marker)) {
      hasInquiryMarker = true;
      break;
    }
  }

  for (const word of words) {
    if (POSITIVE_WORDS.includes(word)) positiveScore += 1;
    if (NEGATIVE_GRIEVANCE_WORDS.includes(word)) negativeScore += 1.2;
  }

  // Check multi-word phrases
  const positivePhrases = ['maraming salamat', 'thank you', 'good job', 'thumbs up', 'well done'];
  for (const phrase of positivePhrases) {
    if (normalized.includes(phrase)) positiveScore += 2;
  }

  const negativePhrases = ['so slow', 'no water', 'brown out', 'hindi maayos', 'walang kuryente', 'di kinukuha', 'napaka bagal'];
  for (const phrase of negativePhrases) {
    if (normalized.includes(phrase)) negativeScore += 2;
  }

  const netScore = positiveScore - negativeScore;

  // If there's an explicit inquiry marker and grievance score is low, treat as Neutral inquiry
  if (hasInquiryMarker && negativeScore < 1.5 && positiveScore < 1.5) {
    return { sentiment: 'Neutral', score: 0 };
  }

  if (netScore >= 1) {
    return { sentiment: 'Positive', score: netScore };
  } else if (netScore <= -1) {
    return { sentiment: 'Negative', score: netScore };
  } else {
    return { sentiment: 'Neutral', score: 0 };
  }
};

