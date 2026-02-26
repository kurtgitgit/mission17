/**
 * HITL Live System Test
 * 
 * This script simulates a user submitting 100 missions with high AI confidence.
 * It verifies that ~5% of them are flagged for "Pending Admin Review".
 * 
 * Usage: 
 * 1. Ensure your server is running (npm run dev)
 * 2. Run this script: node test-hitl-live.js
 */

const API_URL = 'http://localhost:5001/api/auth';

async function runTest() {
    console.log("🚀 Starting Human-in-the-Loop Live Test...");

    // 1. Create a temporary user for testing
    const tempUser = {
        username: `Tester_${Math.floor(Math.random() * 1000)}`,
        email: `test_${Math.floor(Math.random() * 1000)}@example.com`,
        password: 'password123'
    };

    console.log(`👤 Creating temp user: ${tempUser.username}...`);
    
    let userId;

    try {
        // Register
        await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tempUser)
        });

        // Login to get ID
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: tempUser.email, password: tempUser.password })
        });
        
        const loginData = await loginRes.json();
        if (!loginData.user) throw new Error("Login failed");
        userId = loginData.user._id;

    } catch (error) {
        console.error("❌ Setup failed. Is the server running on port 5001?");
        process.exit(1);
    }

    // 2. Run the Loop
    console.log("⚡ Submitting 100 missions with 99% Confidence...");
    
    let approvedCount = 0;
    let flaggedCount = 0;

    for (let i = 0; i < 100; i++) {
        const res = await fetch(`${API_URL}/submit-mission`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                missionId: "TEST_MISSION",
                missionTitle: "HITL Test Mission",
                image: "base64placeholder",
                confidence: 99 // 👈 High confidence should trigger spot check chance
            })
        });

        const data = await res.json();
        
        if (data.status === 'Pending Admin Review') {
            flaggedCount++;
            process.stdout.write("🛡️ "); // Print shield for flagged
        } else {
            approvedCount++;
            process.stdout.write("."); // Print dot for approved
        }
    }

    console.log("\n\n📊 TEST RESULTS:");
    console.log(`✅ Automatically Approved: ${approvedCount}`);
    console.log(`🛡️ Flagged for Review:     ${flaggedCount} (Expected ~5)`);
    
    if (flaggedCount > 0) {
        console.log("\n✅ SUCCESS: The system successfully caught high-confidence submissions for review!");
    } else {
        console.log("\n⚠️ WARNING: No missions were flagged. This is statistically possible but rare. Try running again.");
    }
}

runTest();