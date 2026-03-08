/**
 * Privacy & Security Utilities
 * 
 * Implements Response Masking to prevent Model Inversion Attacks.
 */

/**
 * Sanitizes the raw response from the AI server.
 * Explicitly selects ONLY the fields safe for the client.
 * 
 * 🛡️ SECURITY: This strips out raw confidence scores (e.g., 0.9987)
 * to prevent attackers from reverse-engineering the model.
 * 
 * @param {Object} aiData - The raw JSON from the Python AI server.
 * @returns {Object} - The sanitized JSON safe for the frontend.
 */
export const sanitizeAiResponse = (aiData) => {
    return {
        verdict: aiData.verdict,
        prediction: aiData.prediction,
        isVerified: aiData.is_verified,
        sdg: aiData.sdg,
        message: aiData.message
        // ❌ EXCLUDED: confidence, raw_scores, internal_logs
    };
};