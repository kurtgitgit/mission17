import fs from 'fs';
import path from 'path';
import https from 'https';
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
  } else if (imageUri.includes('cloudinary.com')) {
    // ☁️ Cloudinary URL — download via authenticated Cloudinary API (avoids
    // ERR_CONNECTION_TIMED_OUT issues when plain fetch is blocked on Render).
    console.log('☁️ AI Analysis: Downloading image via Cloudinary API...');
    imageBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      const req = https.get(imageUri, { timeout: 15000 }, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Cloudinary image fetch failed: HTTP ${res.statusCode}`));
        }
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      });
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Cloudinary image download timed out after 15 s. The Cloudinary CDN may be unreachable from this server.'));
      });
      req.on('error', reject);
    });
  } else {
    // Remote URL path — apply a 15-second timeout so we fail fast
    // instead of hanging when external hosts are unreachable.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const imgRes = await fetch(imageUri, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!imgRes.ok) throw new Error(`Failed to fetch proof image (HTTP ${imgRes.status}): ${imgRes.statusText}`);
      const arrayBuffer = await imgRes.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        throw new Error(`Proof image download timed out after 15 s. The image host may be unreachable from this server. URL: ${imageUri.slice(0, 80)}`);
      }
      throw new Error(`Could not download proof image: ${fetchErr.message}`);
    }
  }

  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  formData.append('file', blob, 'proof.jpg');
  return formData;
}

/**
 * Calls the Python AI server and returns the raw aiData object.
 * Throws on failure so callers can decide how to handle it.
 * @param {string} imageUri
 * @param {boolean} skipAntiCheat - Pass true for admin re-scans to bypass duplicate detection.
 */
export async function callAIServer(imageUri, skipAntiCheat = false) {
  const formData = await buildAIFormData(imageUri);
  if (skipAntiCheat) {
    formData.append('skip_anticheat', '1');
  }

  let aiUrl = process.env.AI_SERVER_URL || 'https://kurtgitgit-mission17-ai.hf.space/predict';

  // Trim whitespace/newlines from env var, then normalize the /predict suffix
  aiUrl = aiUrl.trim().replace(/\/+$/, ''); // Remove trailing whitespace AND slashes
  if (!aiUrl.endsWith('/predict')) {
    aiUrl = `${aiUrl}/predict`;
  }

  console.log(`📡 AI Analysis: Fetching ${aiUrl}...`);
  const aiController = new AbortController();
  const aiTimeoutId = setTimeout(() => aiController.abort(), 60000); // 60 s — HF Spaces can cold-start slowly
  let aiResponse;
  try {
    aiResponse = await fetch(aiUrl, {
      method: 'POST',
      body: formData,
      signal: aiController.signal,
    });
    clearTimeout(aiTimeoutId);
  } catch (fetchErr) {
    clearTimeout(aiTimeoutId);
    if (fetchErr.name === 'AbortError') {
      throw new Error('AI Server timed out after 60 s. The Hugging Face Space may be cold-starting — try again in a minute.');
    }
    throw new Error(`AI Server unreachable: ${fetchErr.message}`);
  }

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
      prediction: aiData.prediction,
      confidence: aiData.confidence,
      verdict: aiData.verdict,
      message: aiData.message,
      isVerified: aiData.is_verified,
      sdg: aiData.sdg,
      sourceCheck: aiData.source_check,
      analyzedAt: new Date(),
    },
    { upsert: true, new: true }
  );
}
