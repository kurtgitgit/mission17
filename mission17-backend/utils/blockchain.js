import { ethers } from 'ethers';

const resolutionLedgerAbi = [
  'function recordResolution(bytes32 caseKey, bytes32 integrityHash)',
];

const LEDGER_ENVIRONMENT = [
  'SEPOLIA_RPC_URL',
  'ADMIN_PRIVATE_KEY',
  'BRGYLINK_RESOLUTION_LEDGER_ADDRESS',
];

const normalizeDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

/**
 * Returns a deterministic, privacy-safe description of a resolved blotter case.
 * Do not add resident identity, contact information, narratives, locations, or evidence.
 */
export function buildResolvedBlotterLedgerPayload(report) {
  const referenceNumber = String(report?.referenceNumber || '').trim();
  if (!referenceNumber) {
    throw new Error('A resolved blotter report must have a reference number before it can be recorded.');
  }

  const canonicalRecord = JSON.stringify({
    schema: 'brgylink.blotter-resolution.v1',
    referenceNumber,
    status: 'Resolved',
    incidentType: String(report?.incidentType || '').trim(),
    dateOfIncident: normalizeDate(report?.dateOfIncident),
  });

  return {
    referenceNumber,
    caseKey: ethers.keccak256(ethers.toUtf8Bytes(`brgylink:blotter:${referenceNumber}`)),
    integrityHash: ethers.keccak256(ethers.toUtf8Bytes(canonicalRecord)),
  };
}

export function isResolutionLedgerConfigured() {
  return LEDGER_ENVIRONMENT.every((name) => Boolean(process.env[name]?.trim()));
}

/**
 * Records a privacy-safe integrity digest only after a Captain has resolved a blotter case.
 * This function is intentionally unavailable until the dedicated ledger contract is deployed.
 */
export async function recordResolvedBlotterLedgerEntry(report) {
  if (!isResolutionLedgerConfigured()) {
    const error = new Error('Resolution ledger is not configured. Deploy the dedicated contract and set its address first.');
    error.code = 'LEDGER_NOT_CONFIGURED';
    throw error;
  }

  const { referenceNumber, caseKey, integrityHash } = buildResolvedBlotterLedgerPayload(report);
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(
    process.env.BRGYLINK_RESOLUTION_LEDGER_ADDRESS,
    resolutionLedgerAbi,
    signer,
  );

  const transaction = await contract.recordResolution(caseKey, integrityHash);
  const receipt = await transaction.wait(1);
  if (!receipt || receipt.status !== 1) {
    throw new Error('Resolution ledger transaction was not confirmed.');
  }

  return {
    txHash: receipt.hash,
    integrityHash,
    referenceNumber,
  };
}
