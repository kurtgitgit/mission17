import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AnalysisReport from '../models/AnalysisReport.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Returns true only if imageUri is a real base64 data URL, a remote http(s) URL, or a local file path.
 * Rejects sentinel values like "base64placeholder" that the mobile app stored.
 */
export function isValidImageUri(uri) {
  if (!uri || typeof uri !== 'string') return false;
  return uri.startsWith('data:image') || uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('/uploads/');
}

/**
 * Converts an imageUri (base64 data URL, remote URL, or local file) into a FormData
 * object ready to POST to the Python AI server.
 */
export async function buildAIFormData(imageUri) {
  if (!isValidImageUri(imageUri)) {
    throw new Error(`Invalid imageUri — not a valid URL or path: "${imageUri?.slice(0, 40)}"`);
  }
  let imageBuffer;

  if (imageUri.startsWith('/uploads/')) {
     const relativePath = imageUri.replace(/^\//, ''); // Remove leading slash for join
     const filePath = path.join(__dirname, '..', relativePath);
     console.log(`📂 AI Analysis: Reading local file: ${filePath}`);
     imageBuffer = fs.readFileSync(filePath);
  } else if (imageUri.startsWith('data:image')) {
    // 🛡️ Base64 path — no network fetch needed
    const base64Data = imageUri.split(',')[1];
    imageBuffer = Buffer.from(base64Data, 'base64');
  } else {
    // Remote URL path
    const imgRes = await fetch(imageUri);
    if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.statusText}`);
    const arrayBuffer = await imgRes.arrayBuffer();
    imageBuffer = Buffer.from(arrayBuffer);
  }

  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  formData.append('file', blob, 'proof.jpg');
  return formData;
}

/**
 * Calls the Python AI server and returns the raw aiData object.
 * Throws on failure so callers can decide how to handle it.
 */
export async function callAIServer(imageUri) {
  const formData = await buildAIFormData(imageUri);

  let aiUrl = process.env.AI_SERVER_URL || 'https://kurtgitgit-mission17-ai.hf.space/predict';
  
  // Clean up the URL in case the user added extra slashes or /predict already
  aiUrl = aiUrl.replace(/\/+$/, ''); // Remove trailing slashes
  if (!aiUrl.endsWith('/predict')) {
    aiUrl = `${aiUrl}/predict`;
  }

  console.log(`📡 AI Analysis: Fetching ${aiUrl}...`);
  const aiResponse = await fetch(aiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error(`❌ AI Analysis: AI Server HTTP ${aiResponse.status} - ${errText.slice(0, 100)}`);
    
    // Check if it's a controlled rejection (Anti-Cheat or Invalid Image)
    try {
      const errJson = JSON.parse(errText);
      if (errJson.status === 'REJECTED') {
        const isDuplicate = errJson.error?.includes('Duplicate');
        console.log(`🛡️ AI Analysis: AI Server rejected proof: ${errJson.error}`);
        return {
          verdict: isDuplicate ? 'ANTI_CHEAT' : 'REJECTED',
          is_verified: false,
          prediction: isDuplicate ? 'Duplicate Detection' : (errJson.prediction || 'Anti-Cheat / Invalid'),
          message: errJson.error || 'Proof rejected by AI engine.',
          sdg: 'N/A'
        };
      }
    } catch (e) {
      // Not JSON or doesn't have REJECTED status, proceed to throw error
    }

    throw new Error(`AI Server Error (${aiResponse.status}): ${errText.slice(0, 100)}`);
  }
  
  return aiResponse.json();
}

/**
 * Saves or overwrites an AnalysisReport for a given submission.
 */
export async function saveAnalysisReport(submissionId, userId, aiData) {
  return AnalysisReport.findOneAndUpdate(
    { submissionId },
    {
      submissionId,
      userId,
      prediction:  aiData.prediction,
      confidence:  aiData.confidence, 
      verdict:     aiData.verdict,
      message:     aiData.message,
      isVerified:  aiData.is_verified,
      sdg:         aiData.sdg,
      sourceCheck: aiData.source_check,
      analyzedAt:  new Date(),
    },
    { upsert: true, new: true }
  );
}
