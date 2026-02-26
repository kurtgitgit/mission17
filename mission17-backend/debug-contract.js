import { ethers } from 'ethers';
import 'dotenv/config';

async function debug() {
    console.log("🔍 Debugging Smart Contract Connection...");

    const rpc = process.env.SEPOLIA_RPC_URL;
    const key = process.env.ADMIN_PRIVATE_KEY;
    const address = process.env.CONTRACT_ADDRESS;

    if (!rpc || !key || !address) {
        console.log("❌ Missing .env variables");
        return;
    }

    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(key, provider);
    
    // We define an ABI that has BOTH functions to see which one works
    const contract = new ethers.Contract(address, [
        "function owner() view returns (address)",
        "function awardPoints(address, uint256)",
        "function verifyMission(string, string)"
    ], wallet);

    console.log(`   Contract: ${address}`);
    console.log(`   Admin:    ${wallet.address}`);

    // 1. Check Ownership
    try {
        const owner = await contract.owner();
        console.log(`\n👑 Contract Owner: ${owner}`);
        if (owner.toLowerCase() === wallet.address.toLowerCase()) {
            console.log("   ✅ You are the OWNER.");
        } else {
            console.log("   ❌ You are NOT the owner.");
            console.log("      (This causes 'awardPoints' to revert if it has onlyOwner)");
        }
    } catch (e) {
        console.log("\n⚠️  Could not read 'owner()'. Contract might not be Ownable.");
    }

    // 2. Check if 'awardPoints' exists
    console.log("\nTesting 'awardPoints' function...");
    try {
        // Try to estimate gas (doesn't send tx, just checks validity)
        await contract.awardPoints.estimateGas(wallet.address, 10);
        console.log("   ✅ Function exists and is callable!");
    } catch (e) {
        console.log("   ❌ FAILED. The contract likely does NOT have this function.");
    }

    // 3. Check if 'verifyMission' exists (Old contract?)
    console.log("\nTesting 'verifyMission' function...");
    try {
        await contract.verifyMission.estimateGas("test", "test");
        console.log("   ✅ Function exists and is callable!");
        console.log("      (It seems you are using the old 'Verify' contract, not the 'Points' contract)");
    } catch (e) {
        console.log("   ❌ Function 'verifyMission' failed.");
    }
}

debug();