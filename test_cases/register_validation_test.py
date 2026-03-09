"""
Mission 17 Backend - Register Validation Test
==============================================
Validates that POST /api/auth/signup correctly ACCEPTS valid input and
REJECTS all invalid input cases with the right HTTP status codes.

This is a correctness test, not a speed test.
All 10 test cases are defined inline — the server response is checked
against the expected outcome (PASS / FAIL printed to terminal).

Requirements:
    - Backend server must be running: cd mission17-backend && node index.js
    - pip install requests

Run (from project root):
    python test_cases/register_validation_test.py
"""

import time
import random
import string
import requests

# ─────────────────────────────────────────────
#  CONFIGURATION
# ─────────────────────────────────────────────
SERVER_URL = "http://localhost:5001/api/auth/signup"


def random_suffix() -> str:
    """Generate a short random string to make emails/usernames unique per run."""
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=6))


# ─────────────────────────────────────────────
#  TEST CASE DEFINITIONS
#  Each entry: (description, payload, expected_status, should_succeed)
#  should_succeed=True means the API should CREATE the user (HTTP 201 expected)
#  should_succeed=False means the API should REJECT the request
# ─────────────────────────────────────────────
def build_test_cases() -> list[dict]:
    suffix = random_suffix()
    return [
        # ── VALID CASE ───────────────────────────────────────────────────────────
        {
            "id": 1,
            "description": "Valid registration (should succeed)",
            "payload": {
                "username": f"validuser_{suffix}",
                "email":    f"valid_{suffix}@test.com",
                "password": "SecurePass123"
            },
            "expected_status": 201,
            "should_pass": True,
        },

        # ── MISSING FIELDS ────────────────────────────────────────────────────────
        {
            "id": 2,
            "description": "Missing password field",
            "payload": {
                "username": f"nopass_{suffix}",
                "email":    f"nopass_{suffix}@test.com"
            },
            "expected_status": 400,
            "should_pass": False,
        },
        {
            "id": 3,
            "description": "Missing email field",
            "payload": {
                "username": f"noemail_{suffix}",
                "password": "SecurePass123"
            },
            "expected_status": [400, 500],   # depends on mongoose validation
            "should_pass": False,
        },
        {
            "id": 4,
            "description": "Missing username field",
            "payload": {
                "email":    f"noname_{suffix}@test.com",
                "password": "SecurePass123"
            },
            "expected_status": [400, 500],
            "should_pass": False,
        },
        {
            "id": 5,
            "description": "Completely empty body",
            "payload": {},
            "expected_status": 400,
            "should_pass": False,
        },

        # ── PASSWORD RULES ────────────────────────────────────────────────────────
        {
            "id": 6,
            "description": "Password too short (7 chars — minimum is 8)",
            "payload": {
                "username": f"shortpw_{suffix}",
                "email":    f"shortpw_{suffix}@test.com",
                "password": "abc1234"           # 7 chars
            },
            "expected_status": 400,
            "should_pass": False,
        },
        {
            "id": 7,
            "description": "Password exactly 8 chars (boundary — should succeed)",
            "payload": {
                "username": f"minpw_{suffix}",
                "email":    f"minpw_{suffix}@test.com",
                "password": "abcd1234"           # exactly 8 chars
            },
            "expected_status": 201,
            "should_pass": True,
        },

        # ── DUPLICATE EMAIL ────────────────────────────────────────────────────────
        {
            "id": 8,
            "description": "Duplicate email (same email used twice — should reject 2nd)",
            "payload": {
                "username": f"dup2_{suffix}",
                "email":    f"valid_{suffix}@test.com",   # same email as test #1
                "password": "SecurePass123"
            },
            "expected_status": 400,
            "should_pass": False,
            "note": "Test #1 must have run first for this to be a duplicate."
        },

        # ── INPUT SANITIZATION ────────────────────────────────────────────────────
        {
            "id": 9,
            "description": "XSS attempt in username field",
            "payload": {
                "username": "<script>alert('xss')</script>",
                "email":    f"xss_{suffix}@test.com",
                "password": "SecurePass123"
            },
            # Backend accepts this as a string (sanitized by xss-clean middleware)
            # but it should NOT crash (500 = fail)
            "expected_status": [201, 400],
            "should_pass": None,   # None = we only check it doesn't 500
        },
        {
            "id": 10,
            "description": "NoSQL injection in email field",
            "payload": {
                "username": f"nosqlinject_{suffix}",
                "email":    {"$gt": ""},     # MongoDB injection attempt
                "password": "SecurePass123"
            },
            "expected_status": [400, 500],
            "should_pass": False,
        },
    ]


# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────
def print_divider(char: str = "─", width: int = 66):
    print(char * width)


def status_matches(actual: int, expected) -> bool:
    if isinstance(expected, list):
        return actual in expected
    return actual == expected


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
#  MAIN TEST RUNNER
# ─────────────────────────────────────────────
def run_register_validation_test():
    print()
    print_divider("═")
    print("  MISSION 17 BACKEND — Register Validation Test")
    print(f"  Target  : {SERVER_URL}")
    print(f"  Tests   : 10 cases  (valid + invalid inputs)")
    print_divider("═")
    print()

    check_server()

    test_cases = build_test_cases()
    passed     = 0
    failed     = 0

    for tc in test_cases:
        desc     = tc["description"]
        payload  = tc["payload"]
        expected = tc["expected_status"]
        note     = tc.get("note", "")

        print(f"  [CASE {tc['id']:02d}/10]  {desc}")
        if note:
            print(f"           ℹ️  {note}")

        try:
            t_start  = time.perf_counter()
            response = requests.post(SERVER_URL, json=payload, timeout=15)
            elapsed  = (time.perf_counter() - t_start) * 1000

            actual_status = response.status_code

            # Determine PASS / FAIL
            if tc["should_pass"] is None:
                # Only check it didn't crash
                result_ok = actual_status != 500
                result_str = "PASS ✅" if result_ok else "FAIL ❌ (server crashed)"
            else:
                result_ok  = status_matches(actual_status, expected)
                result_str = "PASS ✅" if result_ok else f"FAIL ❌ (expected {expected})"

            msg = ""
            try:
                msg = response.json().get("message", "")[:60]
            except Exception:
                pass

            print(f"           HTTP {actual_status}  |  {elapsed:6.0f} ms  |  {result_str}")
            if msg:
                print(f"           Server msg: \"{msg}\"")
            print()

            if result_ok:
                passed += 1
            else:
                failed += 1

        except requests.exceptions.Timeout:
            print("           TIMEOUT ❌  (> 15s)\n")
            failed += 1
        except requests.exceptions.ConnectionError:
            print("           CONNECTION ERROR ❌\n")
            failed += 1
            break

    # ─── SUMMARY ──────────────────────────────
    total = passed + failed
    pct   = (passed / total * 100) if total > 0 else 0

    print_divider("═")
    print("  VALIDATION SUMMARY")
    print_divider("─")
    print(f"  Total Cases : {total}")
    print(f"  Passed      : {passed}  ✅")
    print(f"  Failed      : {failed}  ❌")
    print_divider("─")
    verdict = "✅ ALL VALIDATIONS PASSED" if failed == 0 else f"⚠️  {failed} TEST(S) FAILED — Review backend validation logic"
    print(f"  Score       : {pct:.0f}%   {verdict}")
    print_divider("═")
    print()


if __name__ == "__main__":
    run_register_validation_test()
