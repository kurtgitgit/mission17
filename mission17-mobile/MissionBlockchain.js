// SECURE CODE: This file has been refactored to remove all private keys and blockchain logic.
// It now communicates with a secure, server-side endpoint to record missions.
// This prevents attackers from stealing the wallet key from the mobile app.

// IMPORTANT: Replace with your backend server's IP address. For local development, this is often your computer's IP.
const API_URL = 'http://localhost:5001/api/blockchain/record'; 

export const saveMissionToBlockchain = async (userId, missionTitle) => {
    console.log("🔗 Blockchain: Securely submitting to backend...");
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, missionTitle }),
        });

        const result = await response.json();

        if (!response.ok) {
            // If the server responded with an error, log it and use the fallback hash.
            console.error("❌ Backend Error:", result.error || 'Unknown error');
            return result.hash || `0xCLIENT_ERROR_${Date.now()}`;
        }

        console.log("✅ Transaction submitted by backend. Hash:", result.hash);
        return result.hash;

    } catch (error) {
        console.error("❌ Network or Fetch Error:", error);
        // Fallback: If the fetch call itself fails (e.g., network error), return a fake hash.
        return "0xNETWORK_ERROR_" + Math.floor(Math.random() * 1000000000);
    }
};