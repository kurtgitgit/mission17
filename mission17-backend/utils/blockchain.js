import { ethers } from 'ethers';

// A minimal ABI for the function you want to call.
// Replace with your actual contract's ABI.
const contractABI = [
    "function awardPoints(address recipient, uint256 amount)",
    "function burnPoints(address user, uint256 amount)" // Added V2 capability
];

/**
 * Awards SDG points by sending a transaction to the smart contract.
 * This function dynamically fetches gas prices to ensure transaction reliability.
 *
 * @param {string} recipientAddress The user's wallet address to receive points.
 * @param {number} points The number of points to award.
 * @returns {Promise<string>} The transaction hash of the confirmed transaction.
 */
export async function awardSdgPoints(recipientAddress, points) {
    // NOTE: Access process.env inside the function to ensure dotenv has loaded
    const RPC_URL = process.env.SEPOLIA_RPC_URL;
    const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY; 
    const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS; 

    if (!RPC_URL || !ADMIN_PRIVATE_KEY || !CONTRACT_ADDRESS) {
        console.error("🔥 Blockchain environment variables (SEPOLIA_RPC_URL, ADMIN_PRIVATE_KEY, CONTRACT_ADDRESS) are missing.");
        throw new Error("Server configuration error: Missing blockchain credentials.");
    }

    // 1. Set up provider (connection to the blockchain) and signer (your admin wallet)
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);

    // 2. Create an instance of your smart contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

    try {
        // 3. DYNAMICALLY FETCH GAS FEES (EIP-1559)
        console.log("⛽ Fetching current gas prices from Sepolia...");
        // 🛡️ SECURE CODE: Dynamic Gas Estimation (EIP-1559).
        // Prevents transactions from getting stuck by fetching real-time network fees.
        const feeData = await provider.getFeeData();

        console.log(`   - Max Fee Per Gas: ${ethers.formatUnits(feeData.maxFeePerGas, "gwei")} Gwei`);
        console.log(`   - Max Priority Fee: ${ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei")} Gwei`);

        // 4. Prepare and send the transaction with dynamic fees
        console.log(`✍️ Sending transaction to award ${points} points to ${recipientAddress}...`);
        
        const tx = await contract.awardPoints(recipientAddress, points, {
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
            gasLimit: 500000 // 🛠️ FIX: Hardcode gas limit to prevent estimation errors
        });

        console.log(`⏳ Transaction sent! Hash: ${tx.hash}. Waiting for confirmation...`);

        // 5. Wait for the transaction to be mined
        const receipt = await tx.wait(1);
        
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        return receipt.hash;

    } catch (error) {
        console.error("❌ Blockchain transaction failed:", error);

        // 🔍 HELPFUL HINT FOR REVERTS
        if (error.code === 'CALL_EXCEPTION') {
            console.error("\n⚠️  POSSIBLE CAUSE: The Admin Wallet is not the 'Owner' of the Smart Contract.");
            console.error("   Only the wallet that deployed the contract can usually call this function.");
            console.error(`   Contract Address: ${CONTRACT_ADDRESS}\n`);
        }

        throw new Error(`Blockchain Error: ${error.reason || error.message}`);
    }
}