import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    console.log("🔍 Checking Admin Wallet Connection...");

    const rpc = process.env.SEPOLIA_RPC_URL;
    const key = process.env.ADMIN_PRIVATE_KEY;
    
    if (!rpc || !key) {
        console.log("❌ Missing .env variables (SEPOLIA_RPC_URL or ADMIN_PRIVATE_KEY)");
        return;
    }

    try {
        const provider = new ethers.JsonRpcProvider(rpc);
        const wallet = new ethers.Wallet(key, provider);
        
        console.log("👛 Wallet Address:", wallet.address);
        const balance = await provider.getBalance(wallet.address);
        console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
        
        if (balance === 0n) {
             console.log("❌ CRITICAL: Balance is 0. You need Sepolia ETH to pay for gas fees.");
             console.log("   👉 Go to https://cloud.google.com/application/web3/faucet/ethereum/sepolia to get free test ETH.");
        } else {
             console.log("✅ Wallet has funds. Connection is good.");
        }
    } catch (e) {
        console.error("❌ Connection Error:", e.message);
    }
}
check();