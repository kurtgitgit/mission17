"""
Mission 17 Backend - Login Speed Benchmark Test
================================================
Sends 10 POST /api/auth/login requests to the running backend server and
measures response time per request, then prints mean, min, max, std deviation.

Requirements:
    - Backend server must be running: cd mission17-backend && node index.js
    - A real user account must exist in the database (configure below)
    - pip install requests

Run (from project root):
    python test_cases/login_speed_test.py
"""

import time
import statistics
import requests

# ─────────────────────────────────────────────
#  CONFIGURATION — adjust to your environment
# ─────────────────────────────────────────────
SERVER_URL   = "http://localhost:5001/api/auth/login"
NUM_TESTS    = 10

# Credentials of an existing student account in the DB
# DO NOT use admin credentials here — rate limiter applies per IP
TEST_EMAIL    = "speedtest@test.com"
TEST_PASSWORD = "speedtest123"

# Speed rating thresholds (milliseconds)
THRESH_FAST        = 600    # bcrypt adds ~200–400 ms on top of network
THRESH_ACCEPTABLE  = 1500
THRESH_SLOW        = 3000


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


# ─────────────────────────────────────────────
#  CONNECTION CHECK
# ─────────────────────────────────────────────
def check_server():
    """Quick connectivity check before we start the timed tests."""
    print("  🔌 Checking backend connectivity...", end="  ", flush=True)
    try:
        # Send one request; any HTTP response (even 400) means the server is up
        requests.post(SERVER_URL, json={}, timeout=5)
        print("✅ Server is reachable.\n")
    except requests.exceptions.ConnectionError:
        print()
        print("  ❌ ERROR: Cannot connect to the backend server.")
        print(f"     Make sure it is running at: {SERVER_URL}")
        print("     Start it with:  node index.js   (inside mission17-backend/)")
        print()
        raise SystemExit(1)
    except requests.exceptions.Timeout:
        print()
        print("  ❌ ERROR: Server did not respond within 5 seconds.")
        raise SystemExit(1)


# ─────────────────────────────────────────────
#  MAIN BENCHMARK
# ─────────────────────────────────────────────
def run_login_speed_test():
    print()
    print_divider("═")
    print("  MISSION 17 BACKEND — Login Speed Benchmark")
    print(f"  Target : {SERVER_URL}")
    print(f"  Account: {TEST_EMAIL}")
    print(f"  Runs   : {NUM_TESTS}")
    print_divider("═")
    print()

    check_server()

    durations_ms = []

    for i in range(1, NUM_TESTS + 1):
        print(f"  [TEST {i:02d}/{NUM_TESTS}]  Sending login request...", end="  ", flush=True)

        payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD}

        try:
            t_start = time.perf_counter()
            response = requests.post(SERVER_URL, json=payload, timeout=30)
            t_end = time.perf_counter()

            elapsed_ms = (t_end - t_start) * 1000
            durations_ms.append(elapsed_ms)

            # Determine outcome label
            status = response.status_code
            if status == 200:
                outcome = "LOGIN_SUCCESS"
            elif status == 202:
                outcome = "MFA_REQUIRED"
            elif status == 400:
                outcome = "WRONG_PASSWORD"
            elif status == 404:
                outcome = "USER_NOT_FOUND"
            elif status == 429:
                outcome = "RATE_LIMITED ⛔"
            else:
                outcome = f"HTTP_{status}"

            print(f"-> {elapsed_ms:7.1f} ms  |  {outcome}")

            # If rate limited, abort — further tests are pointless
            if status == 429:
                print()
                print("  ⛔ Rate limiter triggered (5 attempts / 15 min).")
                print("     Wait 15 minutes or use a different test account.")
                break

        except requests.exceptions.Timeout:
            print("-> TIMEOUT ❌  (> 30s)")
        except requests.exceptions.ConnectionError:
            print("-> CONNECTION ERROR ❌")
            print()
            print("  Server went offline during testing. Aborting.")
            break

    # ─── SUMMARY ──────────────────────────────────
    if not durations_ms:
        print("\n  No data collected. Cannot compute statistics.")
        return

    mean_ms  = statistics.mean(durations_ms)
    min_ms   = min(durations_ms)
    max_ms   = max(durations_ms)
    stdev_ms = statistics.stdev(durations_ms) if len(durations_ms) > 1 else 0.0
    rating   = speed_rating(mean_ms)

    print()
    print_divider("═")
    print("  RESULTS SUMMARY")
    print_divider("─")
    print(f"  Completed Runs  : {len(durations_ms)} / {NUM_TESTS}")
    print(f"  Fastest         : {min_ms:7.1f} ms")
    print(f"  Slowest         : {max_ms:7.1f} ms")
    print(f"  Std Deviation   : {stdev_ms:7.1f} ms")
    print_divider("─")
    print(f"  MEAN (AVG)      : {mean_ms:7.1f} ms   {rating}")
    print_divider("─")
    print("  NOTE: Login is intentionally slower than most endpoints")
    print("  because bcrypt password hashing adds ~200–400 ms by design.")
    print("  This is a security feature, not a bug.")
    print_divider("═")
    print()

    # Per-run breakdown
    print("  Per-Run Breakdown:")
    print_divider("─", 40)
    print(f"  {'Run':<6} {'Time (ms)':>10}  {'vs Mean':>10}")
    print_divider("─", 40)
    for idx, d in enumerate(durations_ms, 1):
        diff = d - mean_ms
        marker = f"+{diff:.1f}" if diff >= 0 else f"{diff:.1f}"
        print(f"  {idx:<6} {d:>10.1f}  {marker:>10}")
    print_divider("─", 40)
    print()


if __name__ == "__main__":
    run_login_speed_test()
