# Blockchain Cost Test — Documentation

**File:** `test_cases/blockchain_cost_test.py` (project root)  
**Author:** Mission 17 Team  
**Purpose:** Measure the response time and real ETH gas cost of `POST /api/blockchain/record` across 10 runs.

---

## How to Set Up

### 1. Start the Backend Server

```bash
cd mission17-backend
node index.js
```

### 2. (Optional) Enable Real Transactions
By default, if `ADMIN_PRIVATE_KEY` is not configured in `.env`, the backend returns a dev-mode fallback hash (`0xDEV_MODE_SUCCESS_...`). The test still measures speed but cannot compute gas costs.

To test real on-chain transactions:
1. Ensure `ADMIN_PRIVATE_KEY`, `SEPOLIA_RPC_URL`, and `VERIFY_CONTRACT_ADDRESS` are set in `mission17-backend/.env`.
2. Ensure the wallet has Sepolia test ETH (free from [sepoliafaucet.com](https://sepoliafaucet.com)).

### 3. Run the Test

```bash
# From project root
python test_cases/blockchain_cost_test.py
```

### Expected Output (Dev Mode)
```
  [TEST 01/10]  Calling blockchain record...  ->     45.2 ms  |  DEV_MODE 🛠️
  ...
  MEAN (AVG)      :     48.1 ms   ⚡ FAST

  ℹ️  All runs used dev-mode fallback — no real transactions were sent.
```

### Expected Output (Real Transactions)
```
  [TEST 01/10]  Calling blockchain record...  ->  8234.5 ms  |  ON-CHAIN 🔗
  ...
  MEAN (AVG)      :  9102.3 ms   ✅ ACCEPTABLE

  GAS COST ANALYSIS
  ──────────────────────────────────────
  Gas Used        : 52,841 units
  Gas Price       : 1.2500 Gwei
  Cost (ETH)      : 0.00006605 ETH
  Cost (USD ≈)    : $0.231   (@$3500/ETH)
```

### Speed Rating Scale

| Rating | Mean Response Time |
|---|---|
| ⚡ FAST | < 5,000 ms |
| ✅ ACCEPTABLE | 5,000 ms – 15,000 ms |
| ⚠️ SLOW | 15,000 ms – 30,000 ms |
| ❌ CRITICAL | > 30,000 ms |

> Thresholds are much wider than the AI/login tests because Sepolia block time is ~12 seconds. A response time of 10–15 s is completely normal.

---

## Design Decisions

### Why Two Separate Measures (Speed + Cost)?
Speed and cost are independent concerns:
- **Speed**: How long a user waits for the confirmation toast in the mobile app.
- **Cost**: How much testnet ETH is consumed per mission record. Useful for estimating monthly costs if/when system migrates to mainnet.

### Why Poll for the Receipt Separately?
The backend returns the **transaction hash** as soon as it is broadcast — not after on-chain confirmation. To get gas cost we need the receipt, which is only available after the block is mined (~12 s). The test polls the Sepolia RPC directly via JSON-RPC (`eth_getTransactionReceipt`) instead of waiting in the backend request, keeping the speed measurement clean.

### Why Accept Dev-Mode Gracefully?
Most developers won't set up a funded Sepolia wallet in every environment. The test is designed to be useful even without real keys — it still validates that the endpoint is reachable and responds within an acceptable time in dev mode.

### Why ETH_TO_USD is Hardcoded?
Calling a live price API would introduce network dependency and risk during testing. The value is a constant placed at the top of the file so it is easy to update. The output also shows the raw ETH cost, which is the canonical measure.
