/**
 * Human-in-the-Loop (HITL) Spot Check
 * Location: utils/spotCheck.js
 */

/**
 * Evaluates the AI confidence score.
 * If confidence > 90%, there is a 5% chance to flag it for 'Pending Admin Review'.
 * Otherwise, it returns 'Approved'.
 * 
 * @param {number} confidenceScore - The AI confidence percentage (0-100).
 * @returns {string} - The final status ('Approved' or 'Pending Admin Review').
 */
export const evaluateMissionStatus = (confidenceScore) => {
    // 1. Default status
    let status = 'Approved';

    // 2. Check if score is high enough to potentially trigger a spot check
    if (confidenceScore > 90) {
        // 3. Roll the dice (5% chance)
        // Math.random() returns a float between 0 and 1. 
        // < 0.05 means the bottom 5% of probability.
        // 🛡️ SECURE CODE: Adversarial Attack Mitigation.
        // Randomly selects 5% of high-confidence submissions for manual review.
        if (Math.random() < 0.05) {
            console.log(`🛡️ HITL Triggered: High confidence (${confidenceScore}%) mission flagged for review.`);
            status = 'Pending Admin Review';
        }
    }

    return status;
};

/**
 * Express Middleware version
 * Expects req.body.confidence to be present.
 * Attaches the decision to req.missionStatus.
 */
export const spotCheckMiddleware = (req, res, next) => {
    try {
        const { confidence } = req.body;

        if (typeof confidence === 'number') {
            const finalStatus = evaluateMissionStatus(confidence);
            
            // Attach to request so the next controller can use it
            req.missionStatus = finalStatus;
            
            // Optional: Overwrite body status if you want to pass it directly to a DB save
            req.body.status = finalStatus; 
        }
        next();
    } catch (error) {
        console.error("Error in spot check middleware:", error);
        next(); // Don't crash the app, just proceed
    }
};
