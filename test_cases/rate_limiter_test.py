"""
Mission 17 Backend - Rate Limiter Test
=======================================
Verifies that the login endpoint enforces a maximum of 5 attempts per
15-minute window per IP. Sends 6 consecutive requests with a wrong
password and asserts the 6th returns HTTP 429 (Too Many Requests).

Requirements:
    - Backend server must be running: cd mission17-backend && node index.js
    - A real user account must exist (configure TEST_EMAIL below)
    - pip install requests

Run (from project root):
    python test_cases/rate_limiter_test.py

⚠️  IMPORTANT: After this test runs, your IP is locked for 15 minutes on
    the login endpoint. Wait before running login_speed_test.py.
"""

import time
import requests

# ─────────────────────────────────────────────
#  CONFIGURATION
# ─────────────────────────────────────────────
SERVER_URL  = "http://localhost:5001/api/auth/login"

# Must be a real existing user — wrong passwords are sent intentionally
TEST_EMAIL  = "speedtest@test.com"
WRONG_PASS  = "deliberatelyWrongPassword!!"

# The backend sets max=5, so attempt 6 MUST return 429
MAX_ALLOWED = 5
TOTAL_SENDS = 6   # One more than the limit


# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────
def print_divider(char: str = "─", width: int = 62):
    print(char * width)


def check_server():
    print("  🔌 Checking backend connectivity...", end="  ", flush=True)
    try:
        requests.post(SERVER_URL, json={}, timeout=5)
        print("✅ Server is reachable.\n")
    except requests.exceptions.ConnectionError:
        print()
        print("  ❌ ERROR: Cannot connect to the backend server.")
        print(f"     Make sure it is running at: {SERVER_URL}")
        print("     Start it with:  node index.js   (inside mission17-backend/)")
        print()
        raise SystemExit(1)


# ─────────────────────────────────────────────
#  MAIN TEST
# ─────────────────────────────────────────────
def run_rate_limiter_test():
    print()
    print_divider("═")
    print("  MISSION 17 BACKEND — Rate Limiter Test")
    print(f"  Target  : {SERVER_URL}")
    print(f"  Account : {TEST_EMAIL}")
    print(f"  Limit   : {MAX_ALLOWED} attempts per 15 min  →  attempt #{TOTAL_SENDS} must be HTTP 429")
    print_divider("═")
    print()

    check_server()

    results      = []
    passed_tests = 0
    failed_tests = 0

    for i in range(1, TOTAL_SENDS + 1):
        is_last = (i == TOTAL_SENDS)
        expect_429 = is_last

        label = f"Attempt {i}/{TOTAL_SENDS}"
        if expect_429:
            label += " ← MUST be rate-limited"

        print(f"  [{i:02d}]  {label}")
        print(f"        Sending wrong-password login...", end="  ", flush=True)

        try:
            t_start  = time.perf_counter()
            response = requests.post(
                SERVER_URL,
                json={"email": TEST_EMAIL, "password": WRONG_PASS},
                timeout=15,
            )
            elapsed = (time.perf_counter() - t_start) * 1000
            status  = response.status_code

            # Determine expected and actual outcome
            if expect_429:
                # Final attempt MUST be 429
                ok = (status == 429)
                outcome = "PASS ✅  Rate limiter triggered correctly" if ok \
                          else f"FAIL ❌  Expected 429, got {status} — rate limiter NOT working!"
            else:
                # Attempts 1–5 should be rejected for wrong password (400 or 404)
                # They must NOT be 429 (that means the window was already exhausted)
                ok = status in (400, 404)
                outcome = f"PASS ✅  Rejected (wrong password, HTTP {status})" if ok \
                          else f"FAIL ❌  Unexpected status {status}"

            msg = ""
            try:
                msg = response.json().get("message", "")[:70]
            except Exception:
                pass

            print(f"HTTP {status}  |  {elapsed:6.1f} ms  |  {outcome}")
            if msg:
                print(f"        Server msg: \"{msg}\"")
            print()

            results.append(ok)
            if ok:
                passed_tests += 1
            else:
                failed_tests += 1

            # Small delay between requests to avoid overwhelming the event loop
            # (does not affect the rate limiter window — windowMs counts wall-clock time)
            if not is_last:
                time.sleep(0.3)

        except requests.exceptions.Timeout:
            print("TIMEOUT ❌  (> 15s)\n")
            results.append(False)
            failed_tests += 1
        except requests.exceptions.ConnectionError:
            print("CONNECTION ERROR ❌\n")
            results.append(False)
            failed_tests += 1
            break

    # ─── SUMMARY ──────────────────────────────────
    print_divider("═")
    print("  TEST SUMMARY")
    print_divider("─")

    # The critical assertion is whether attempt #6 was 429
    rate_limit_enforced = len(results) >= TOTAL_SENDS and results[-1] is True

    print(f"  Total Attempts  : {len(results)}")
    print(f"  Passed checks   : {passed_tests}")
    print(f"  Failed checks   : {failed_tests}")
    print_divider("─")

    if rate_limit_enforced:
        print("  RESULT : ✅ PASS — Rate limiter is working correctly.")
        print(f"           The server blocked attempt #{TOTAL_SENDS} with HTTP 429.")
    else:
        print("  RESULT : ❌ FAIL — Rate limiter did NOT trigger on attempt #6.")
        print("           Check that 'loginLimiter' is applied to POST /api/auth/login")
        print("           in mission17-backend/routes/auth.js.")

    print_divider("─")
    print("  ⚠️  Your IP is now rate-limited for ~15 minutes on this endpoint.")
    print("      Wait before running login_speed_test.py.")
    print_divider("═")
    print()


if __name__ == "__main__":
    run_rate_limiter_test()
