import { sanitizeAiResponse } from '../utils/privacy.js';

describe('🛡️ Data Privacy: Response Masking Logic', () => {
    
    test('should STRIP sensitive confidence scores from AI response', () => {
        // 1. Simulate a "Raw" response from the Python AI Server
        // This contains sensitive math data that attackers want.
        const rawAiResponse = {
            verdict: "Pass",
            prediction: "Plastic",
            isVerified: true,
            sdg: 12,
            message: "Valid plastic detected",
            confidence: 0.99942,        // 🚨 SENSITIVE DATA (Model Inversion Risk)
            model_version: "v2.1-beta", // 🚨 INTERNAL DATA
            processing_time_ms: 120     // 🚨 SYSTEM DATA
        };

        // 2. Run the sanitizer
        const safeResponse = sanitizeAiResponse(rawAiResponse);

        // 3. Verify sensitive fields are GONE
        expect(safeResponse.confidence).toBeUndefined();
        expect(safeResponse.model_version).toBeUndefined();
        expect(safeResponse.processing_time_ms).toBeUndefined();

        // 4. Verify public fields are KEPT
        expect(safeResponse.verdict).toBe('Pass');
        expect(safeResponse.prediction).toBe('Plastic');
    });
});