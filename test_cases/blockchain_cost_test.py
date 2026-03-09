"""
Mission 17 Backend - Blockchain Cost Test
==========================================
Calls POST /api/blockchain/record and measures:
  1. Response time (how long the backend takes to send the tx)
  2. Whether a real transaction hash was returned (not a dev-mode fallback)
  3. If a real hash is returned, estimates gas cost using ethers via RPC

Requirements:
    - Backend server must be running: cd mission17-backend && node index.js
    - pip install requests
    - For on-chain cost analysis: pip install eth-brownie  OR  web3
      (the script uses 'requests' to call the RPC directly — no extra lib needed)

Run (from project root):
    python test_cases/blockchain_cost_test.py
"""

import time
import statistics
import json
import requests

# ─────────────────────────────────────────────
#  CONFIGURATION
# ─────────────────────────────────────────────
BACKEND_URL  = "http://localhost:5001/api/blockchain/record"
NUM_TESTS    = 10

# Sepolia RPC — same one used by the backend (public endpoint, no key needed for reads)
SEPOLIA_RPC  = "https://ethereum-sepolia-rpc.publicnode.com"

# Sample payload — matches what the mobile app sends
PAYLOAD = {
    "userId":       "speedtest_user_001",
    "missionTitle": "SDG13_15_Planting"
}

# Speed thresholds for blockchain — intentionally looser (network latency to Sepolia)
THRESH_FAST        = 5000    # 5 s
THRESH_ACCEPTABLE  = 15000   # 15 s
THRESH_SLOW        = 30000   # 30 s

# ETH/USD rough estimate (update if needed)
ETH_TO_USD = 3500.0


# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────
def speed_rating(mean_ms: float) -> str:
    if mean_ms < THRESH_FAST:
        return "⚡ FAST"
    elif mean_ms < THRESH_ACCEPTABLE:
        return "✅ ACCEPTABLE"
    elif mean_ms < THRESH_SLOW:
        return "⚠️  SLOW"
    else:
        return "❌ CRITICAL"


def print_divider(char: str = "─", width: int = 62):
    print(char * width)


def is_real_hash(tx_hash: str) -> bool:
    """Returns True if the hash looks like a genuine Ethereum tx hash (0x + 64 hex chars)."""
    if not tx_hash or not tx_hash.startswith("0x"):
        return False
    return len(tx_hash) == 66 and all(c in "0123456789abcdefABCDEF" for c in tx_hash[2:])


def rpc_call(method: str, params: list) -> dict:
    """Send a JSON-RPC request to the Sepolia node."""
    payload = {"jsonrpc": "2.0", "method": method, "params": params, "id": 1}
    try:
        resp = requests.post(SEPOLIA_RPC, json=payload, timeout=15)
        return resp.json()
    except Exception as e:
        return {"error": str(e)}


def get_tx_receipt(tx_hash: str) -> dict | None:
    """Poll Sepolia for the transaction receipt (waits up to ~30s)."""
    print(f"    ⏳ Waiting for on-chain confirmation of {tx_hash[:18]}...", end="  ", flush=True)
    for _ in range(10):  # Poll 10 times with 3-second delay
        result = rpc_call("eth_getTransactionReceipt", [tx_hash])
        receipt = result.get("result")
        if receipt:
            print("confirmed ✅")
            return receipt
        time.sleep(3)
    print("not yet confirmed (skipping cost analysis)")
    return None


def calculate_cost(receipt: dict) -> dict | None:
    """Calculate actual gas cost from the receipt."""
    try:
        gas_used       = int(receipt["gasUsed"], 16)
        effective_gwei = int(receipt.get("effectiveGasPrice", "0x0"), 16) / 1e9
        cost_eth       = (gas_used * effective_gwei * 1e9) / 1e18
        cost_usd       = cost_eth * ETH_TO_USD
        return {
            "gas_used":       gas_used,
            "gas_price_gwei": round(effective_gwei, 4),
            "cost_eth":       cost_eth,
            "cost_usd":       cost_usd,
        }
    except Exception:
        return None


def check_server():
    print("  🔌 Checking backend connectivity...", end="  ", flush=True)
    try:
        requests.post(BACKEND_URL, json={}, timeout=5)
        print("✅ Server is reachable.\n")
    except requests.exceptions.ConnectionError:
        print()
        print("  ❌ ERROR: Cannot connect to the backend server.")
        print(f"     Make sure it is running at: {BACKEND_URL}")
        print("     Start it with:  node index.js   (inside mission17-backend/)")
        print()
        raise SystemExit(1)


# ─────────────────────────────────────────────
#  MAIN BENCHMARK
# ─────────────────────────────────────────────
def run_blockchain_cost_test():
    print()
    print_divider("═")
    print("  MISSION 17 BACKEND — Blockchain Cost & Speed Test")
    print(f"  Target  : {BACKEND_URL}")
    print(f"  Payload : userId={PAYLOAD['userId']} | mission={PAYLOAD['missionTitle']}")
    print(f"  Runs    : {NUM_TESTS}")
    print_divider("═")
    print()

    check_server()

    durations_ms   = []
    real_tx_hashes = []
    dev_mode_count = 0

    for i in range(1, NUM_TESTS + 1):
        print(f"  [TEST {i:02d}/{NUM_TESTS}]  Calling blockchain record...", end="  ", flush=True)

        try:
            t_start = time.perf_counter()
            response = requests.post(BACKEND_URL, json=PAYLOAD, timeout=60)
            t_end   = time.perf_counter()

            elapsed_ms = (t_end - t_start) * 1000
            durations_ms.append(elapsed_ms)

            body = response.json()
            tx_hash = body.get("hash", "")

            if is_real_hash(tx_hash):
                tag = "ON-CHAIN 🔗"
                real_tx_hashes.append(tx_hash)
            elif "DEV_MODE" in tx_hash.upper():
                tag = "DEV_MODE 🛠️"
                dev_mode_count += 1
            elif "FAILED" in tx_hash.upper():
                tag = "TX_FAILED ❌"
            else:
                tag = f"HTTP_{response.status_code}"

            print(f"-> {elapsed_ms:8.1f} ms  |  {tag}")

        except requests.exceptions.Timeout:
            print("-> TIMEOUT ❌  (> 60s — blockchain may be congested)")
        except requests.exceptions.ConnectionError:
            print("-> CONNECTION ERROR ❌")
            break

    # ─── SPEED SUMMARY ──────────────────────
    if not durations_ms:
        print("\n  No data collected.")
        return

    mean_ms  = statistics.mean(durations_ms)
    min_ms   = min(durations_ms)
    max_ms   = max(durations_ms)
    stdev_ms = statistics.stdev(durations_ms) if len(durations_ms) > 1 else 0.0
    rating   = speed_rating(mean_ms)

    print()
    print_divider("═")
    print("  SPEED SUMMARY")
    print_divider("─")
    print(f"  Completed Runs  : {len(durations_ms)} / {NUM_TESTS}")
    print(f"  Real On-Chain Tx: {len(real_tx_hashes)}")
    print(f"  Dev-Mode Fallbk : {dev_mode_count}  (no ADMIN_PRIVATE_KEY set)")
    print_divider("─")
    print(f"  Fastest         : {min_ms:8.1f} ms")
    print(f"  Slowest         : {max_ms:8.1f} ms")
    print(f"  Std Deviation   : {stdev_ms:8.1f} ms")
    print_divider("─")
    print(f"  MEAN (AVG)      : {mean_ms:8.1f} ms   {rating}")
    print_divider("═")

    # ─── GAS COST ANALYSIS (only for real hashes) ──
    if real_tx_hashes:
        print()
        print("  GAS COST ANALYSIS  (analysing first real transaction)")
        print_divider("─")
        receipt = get_tx_receipt(real_tx_hashes[0])
        if receipt:
            cost = calculate_cost(receipt)
            if cost:
                print(f"  Gas Used        : {cost['gas_used']:,} units")
                print(f"  Gas Price       : {cost['gas_price_gwei']} Gwei")
                print(f"  Cost (ETH)      : {cost['cost_eth']:.8f} ETH")
                print(f"  Cost (USD ≈)    : ${cost['cost_usd']:.6f}  (@${ETH_TO_USD}/ETH)")
                print()
                print("  ℹ️  This is Sepolia testnet ETH (no real-world monetary value).")
        print_divider("═")
    elif dev_mode_count == NUM_TESTS:
        print()
        print("  ℹ️  All runs used dev-mode fallback — no real transactions were sent.")
        print("     To test real gas costs, set ADMIN_PRIVATE_KEY in mission17-backend/.env")
        print_divider("═")

    print()


if __name__ == "__main__":
    run_blockchain_cost_test()
