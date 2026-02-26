import { ethers } from 'ethers';
import 'dotenv/config';

async function initializeProxy() {
    console.log("🚀 Attempting to Initialize Proxy...");

    const rpc = process.env.SEPOLIA_RPC_URL;
    const key = process.env.ADMIN_PRIVATE_KEY;
    const address = process.env.CONTRACT_ADDRESS;

    if (!rpc || !key || !address) {
        console.log("❌ Missing .env variables");
        return;
    }

    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(key, provider);
    
    // ABI for the initialize function
    const contract = new ethers.Contract(address, [
        "function initialize() public"
    ], wallet);

    try {
        console.log(`✍️ Sending initialize transaction...`);
        const tx = await contract.initialize({
            gasLimit: 100000 // Hardcoded gas limit to ensure it runs
        });
        
        console.log(`⏳ Transaction sent! Hash: ${tx.hash}`);
        await tx.wait(1);
        console.log("✅ Proxy Initialized Successfully!");

    } catch (e) {
        console.log("❌ Initialization Failed:", e.reason || e.message);
    }
}

initializeProxy();