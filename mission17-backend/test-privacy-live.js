/**
 * Privacy Masking Live Test
 * 
 * Simulates a client inspecting the network response to ensure
 * no raw AI confidence scores are leaked.
 */

import { sanitizeAiResponse } from './utils/privacy.js';

console.log("🚀 Starting Privacy Masking Simulation...");

// 1. The Mock "Attack" Data
// Imagine the AI server returned this rich data packet
const mockAiServerResponse = {
    verdict: "Pass",
    prediction: "Plastic Bottle",
    isVerified: true,
    sdg: 12,
    message: "Object detected successfully",
    // ⚠️ SENSITIVE DATA BELOW ⚠️
    confidence: 0.99874321, 
    vector_embeddings: [0.12, 0.44, 0.91],
    server_id: "ai-node-04"
};

console.log("\n📥 RAW DATA from AI Server (Internal Only):");
console.log(mockAiServerResponse);

// 2. Apply the Security Layer
console.log("\n🛡️  Applying Response Masking Middleware...");
const clientResponse = sanitizeAiResponse(mockAiServerResponse);

// 3. Inspect the Result
console.log("\n📤 CLIENT RESPONSE (Public):");
console.log(clientResponse);

// 4. Verification
if (clientResponse.confidence === undefined && clientResponse.vector_embeddings === undefined) {
    console.log("\n✅ SUCCESS: Raw math and internal data are HIDDEN from the client.");
    console.log("   Model Inversion Attack prevented.");
} else {
    console.log("\n❌ FAILED: Sensitive data leaked!");
}