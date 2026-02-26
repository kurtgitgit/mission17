import { ethers } from 'ethers';
import 'dotenv/config';

async function verifyV2() {
    console.log("🚀 Verifying V2 Upgrade Features...");

    const rpc = process.env.SEPOLIA_RPC_URL;
    const key = process.env.ADMIN_PRIVATE_KEY;
    const address = process.env.CONTRACT_ADDRESS; // Proxy Address

    if (!rpc || !key || !address) {
        console.log("❌ Missing .env variables");
        return;
    }

    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(key, provider);
    
    // ABI for V2 functions
    const contract = new ethers.Contract(address, [
        "function getVersion() view returns (string)",
        "function pointsBalance(address) view returns (uint256)",
        "function burnPoints(address, uint256)"
    ], wallet);

    console.log(`   Proxy: ${address}`);
    console.log(`   User:  ${wallet.address}`);

    try {
        // 1. Check Version
        console.log("\n🔍 1. Checking Version...");
        try {
            const version = await contract.getVersion();
            console.log(`   ✅ Contract Version: ${version}`);
            if (version !== "V2") {
                console.log("   ⚠️  Warning: Version is not 'V2'. Did you perform the upgrade in Remix?");
                return;
            }
        } catch (e) {
            console.log("   ❌ Failed to get version. You might still be on V1.");
            console.log("      Error:", e.code || e.message);
            return;
        }

        // 2. Burn Points (Test V2 Logic)
        console.log("\n🔥 2. Testing 'burnPoints' (V2 Feature)...");
        
        const balanceBefore = await contract.pointsBalance(wallet.address);
        console.log(`   💰 Balance Before: ${balanceBefore}`);

        if (balanceBefore >= 10n) {
            const tx = await contract.burnPoints(wallet.address, 10);
            console.log(`   ✍️  Burn Transaction Sent: ${tx.hash}`);
            await tx.wait(1);
            
            const balanceAfter = await contract.pointsBalance(wallet.address);
            console.log(`   💰 Balance After:  ${balanceAfter}`);
            console.log("   ✅ SUCCESS: Points burned successfully! V2 is fully functional.");
        } else {
            console.log("   ⚠️  Not enough points to test burn. (Run the flow test again to get points)");
        }

    } catch (e) {
        console.log("❌ Error:", e.message);
    }
}

verifyV2();