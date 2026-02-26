import { jest } from '@jest/globals';
import { evaluateMissionStatus } from '../utils/spotCheck.js';

// The 'describe' block groups related tests for our spot check feature.
describe('Human-in-the-Loop Spot Check Logic', () => {

    // Test Case 1: Check scores that are NOT high confidence.
    // These should never be flagged.
    test('should always return "Approved" for confidence scores of 90 or less', () => {
        expect(evaluateMissionStatus(50)).toBe('Approved');
        expect(evaluateMissionStatus(90)).toBe('Approved');
    });

    // Test Case 2: Check a high confidence score where the random chance does NOT trigger a review.
    test('should return "Approved" when confidence is > 90 and random roll is >= 0.05', () => {
        // We "mock" Math.random to force it to return a predictable value (0.1).
        // This makes our test deterministic instead of random.
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.1); // 0.1 is >= 0.05

        expect(evaluateMissionStatus(95)).toBe('Approved');

        // Restore the original Math.random function after the test.
        spy.mockRestore();
    });

    // Test Case 3: Check a high confidence score where the random chance DOES trigger a review.
    test('should return "Pending Admin Review" when confidence is > 90 and random roll is < 0.05', () => {
        // Here, we mock Math.random to return a value that should trigger the flag.
        const spy = jest.spyOn(Math, 'random').mockReturnValue(0.04); // 0.04 is < 0.05

        expect(evaluateMissionStatus(99)).toBe('Pending Admin Review');

        spy.mockRestore();
    });

    // Test Case 4: Verify that a log message is printed when a review is triggered.
    test('should log a message to the console when a review is triggered', () => {
        const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.03);
        // We also mock console.log to check if it was called correctly.
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        evaluateMissionStatus(92);

        expect(consoleSpy).toHaveBeenCalledWith('🛡️ HITL Triggered: High confidence (92%) mission flagged for review.');

        randomSpy.mockRestore();
        consoleSpy.mockRestore();
    });
});