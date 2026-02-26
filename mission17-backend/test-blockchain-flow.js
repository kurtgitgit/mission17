/**
 * End-to-End Blockchain Flow Test
 *
 * This script automates the setup for testing the blockchain transaction:
 * 1. Creates a temporary student user.
 * 2. Logs in as the SuperAdmin to get an authorization token.
 * 3. Updates the student's profile with your wallet address.
 * 4. Submits one mission for the student.
 * 5. Prints the `submissionId` and `adminToken` needed for the final approval step.
 *
 * Usage:
 * 1. Ensure your server is running (`npm run dev`).
 * 2. Fill in the `TEST_WALLET_ADDRESS` below with your address from MetaMask.
 * 3. Run this script: `node test-blockchain-flow.js`
 * 4. Follow the instructions printed in the console.
 */

const API_URL = 'http://localhost:5001/api/auth';

// =================================================================
// 👉 1. PASTE YOUR TEST WALLET ADDRESS HERE (e.g., from MetaMask)
// This is the address that will receive the points on the Sepolia testnet.
const TEST_WALLET_ADDRESS = process.argv[2] || "0x7dB79ec78E6e345fE23cf7fB790846365D107FFB"; 
// =================================================================


async function runTest() {
    console.log("🚀 Starting End-to-End Blockchain Flow Test...");

    let studentId, adminToken, submissionId;

    try {
        // --- Step 1: Create a temporary student user ---
        const studentUser = {
            username: `Student_${Math.floor(Math.random() * 1000)}`,
            email: `student_${Math.floor(Math.random() * 1000)}@example.com`,
            password: 'password123'
        };
        console.log(`\n👤 Creating temp student: ${studentUser.username}...`);
        await fetch(`${API_URL}/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(studentUser) });

        const studentLoginRes = await fetch(`${API_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: studentUser.email, password: studentUser.password }) });
        const studentLoginData = await studentLoginRes.json();
        studentId = studentLoginData.user._id;
        console.log(`   ✅ Student created with ID: ${studentId}`);

        // --- Step 2: Log in as SuperAdmin to get an admin token ---
        console.log(`\n🔑 Logging in as SuperAdmin to get an admin token...`);
        const adminLoginRes = await fetch(`${API_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@mission17.com', password: 'admin123', isAdminLogin: true }) });
        const adminLoginData = await adminLoginRes.json();
        if (!adminLoginData.token) throw new Error("Could not log in as SuperAdmin. Did you run `node createAdmin.js`?");
        adminToken = adminLoginData.token;
        console.log(`   ✅ Admin token acquired.`);

        // --- Step 3: Update student's profile with wallet address ---
        console.log(`\n💳 Updating student profile with wallet address: ${TEST_WALLET_ADDRESS}`);
        await fetch(`${API_URL}/update-profile/${studentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ walletAddress: TEST_WALLET_ADDRESS }) });
        console.log(`   ✅ Profile updated.`);

        // --- Step 4: Submit a mission for the student ---
        console.log(`\n📤 Submitting a test mission for the student...`);
        const submissionRes = await fetch(`${API_URL}/submit-mission`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: studentId,
                missionId: "BLOCKCHAIN_TEST",
                missionTitle: "Blockchain Test Mission",
                image: "base64placeholder",
                confidence: 80 // Low confidence to bypass spot check
            })
        });
        const submissionData = await submissionRes.json();
        if (!submissionData.submission?._id) throw new Error("Failed to get submission ID from response.");

        submissionId = submissionData.submission._id;
        console.log(`   ✅ Mission submitted. Submission ID: ${submissionId}`);

    } catch (error) {
        console.error("\n❌ TEST FAILED DURING SETUP:", error.message);
        console.error("   Please ensure your backend server is running on http://localhost:5001.");
        process.exit(1);
    }

    // --- Step 5: AUTOMATICALLY APPROVE THE MISSION ---
    try {
        console.log("\n\n✅ SETUP COMPLETE. Now triggering final approval...");
        console.log("------------------------------------------------------------------");
        console.log("👀 Watch the terminal where your SERVER is running.");
        console.log("   You should see logs like '⛽ Fetching current gas prices...'");
        console.log("------------------------------------------------------------------");

        const approvalRes = await fetch(`${API_URL}/approve-mission`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'auth-token': adminToken },
            body: JSON.stringify({ submissionId: submissionId })
        });

        const approvalData = await approvalRes.json();
        if (!approvalRes.ok) throw new Error(`Approval failed: ${approvalData.message} \n   👉 REASON: ${approvalData.error || 'No details provided'}`);

        console.log("\n\n🎉 MISSION APPROVED! 🎉");
        console.log(`   - Transaction Hash: ${approvalData.txHash}`);
        console.log(`   - View on Etherscan: https://sepolia.etherscan.io/tx/${approvalData.txHash}`);

    } catch (error) {
        console.error("\n❌ TEST FAILED DURING APPROVAL:", error.message);
        process.exit(1);
    }
}

runTest();