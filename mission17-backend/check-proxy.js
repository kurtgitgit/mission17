import { ethers } from 'ethers';
import 'dotenv/config';

async function checkProxy() {
    console.log("🔍 Checking Proxy Contract Status...");

    const rpc = process.env.SEPOLIA_RPC_URL;
    const address = process.env.CONTRACT_ADDRESS; 
    const adminKey = process.env.ADMIN_PRIVATE_KEY;

    if (!rpc || !address || !adminKey) {
        console.log("❌ Missing .env variables");
        return;
    }

    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(adminKey, provider);
    
    console.log(`   Target Address: ${address}`);
    console.log(`   Your Wallet:    ${wallet.address}`);

    // 1. Check if it looks like a Proxy (EIP-1967 Implementation Slot)
    // Slot: 0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc
    const implSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    try {
        const storageValue = await provider.getStorage(address, implSlot);
        
        // Check if the slot is empty (all zeros)
        if (storageValue === "0x0000000000000000000000000000000000000000000000000000000000000000") {
            console.log("\n⚠️  WARNING: EIP-1967 Implementation slot is empty.");
            console.log("   This address is likely NOT a Proxy.");
            console.log("   👉 You likely copied the 'Logic' contract address instead of the 'Proxy' address.");
            console.log("   Please go back to Remix and copy the address of the 'ERC1967Proxy'.");
        } else {
            console.log(`\n✅ Confirmed Proxy. Implementation Slot is set.`);
            console.log(`   Slot Value: ${storageValue}`);
        }
    } catch (e) {
        console.log("   Could not read storage (is the RPC URL correct?)");
    }

    // 2. Check Owner
    // The ABI for checking the owner
    const contract = new ethers.Contract(address, [
        "function owner() view returns (address)"
    ], provider);

    try {
        const owner = await contract.owner();
        console.log(`\n👑 Current Owner: ${owner}`);
        
        if (owner === "0x0000000000000000000000000000000000000000") {
            console.log("❌ CRITICAL: Owner is 0x0000... The Proxy is NOT initialized.");
        } else if (owner.toLowerCase() === wallet.address.toLowerCase()) {
            console.log("✅ SUCCESS: You are the owner! The Proxy is initialized correctly.");
        } else {
            console.log("❌ WARNING: The Proxy is initialized, but YOU are NOT the owner.");
        }
    } catch (e) {
        console.log("\n⚠️  Could not read 'owner()'.");
        console.log("   Error:", e.message);
    }
}

checkProxy();
