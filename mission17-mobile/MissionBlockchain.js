import { ethers } from 'ethers';

// ==========================================
// CONFIGURATION
// ==========================================

// Your deployed contract address
const CONTRACT_ADDRESS = "0x7be6222f43d15D8e3001a7679bf769486F333F18";

// Your Contract ABI (The Instruction Manual)
const CONTRACT_ABI = [
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": false, "internalType": "string", "name": "userId", "type": "string" },
			{ "indexed": false, "internalType": "string", "name": "missionTitle", "type": "string" },
			{ "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
		],
		"name": "MissionVerified",
		"type": "event"
	},
	{
		"inputs": [
			{ "internalType": "string", "name": "_userId", "type": "string" },
			{ "internalType": "string", "name": "_missionTitle", "type": "string" }
		],
		"name": "verifyMission",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

// Connection to the Sepolia Test Network
const PROVIDER_URL = "https://ethereum-sepolia.publicnode.com"; 

// ==========================================
// FUNCTION TO SAVE MISSION
// ==========================================
export const saveMissionToBlockchain = async (userId, missionTitle, privateKey) => {
  try {
    console.log("1. Connecting to Sepolia Network...");
    const provider = new ethers.providers.JsonRpcProvider(PROVIDER_URL);

    console.log("2. Creating Wallet...");
    // The "Wallet" signs the transaction so the network knows it's really you
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("3. Connecting to Contract...");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    console.log(`4. Sending Mission: ${missionTitle} for ${userId}...`);
    // This calls the verifyMission function we wrote in Solidity!
    const tx = await contract.verifyMission(userId, missionTitle);

    console.log("5. Transaction Sent! Hash:", tx.hash);
    console.log("   Waiting for confirmation (this takes 10-15 seconds)...");

    // Wait for the block to be mined
    const receipt = await tx.wait();

    console.log("6. Success! Block Number:", receipt.blockNumber);
    return tx.hash;

  } catch (error) {
    console.error("Blockchain Error:", error);
    throw error; 
  }
};