"""
Mission 17 Backend - Audit Log Integrity Test
==============================================
Verifies that key user actions are correctly written to the MongoDB
audit log by:
  1. Registering a new test user           → expects SIGNUP log
  2. Attempting login with wrong password  → expects LOGIN_FAILED log
  3. Logging in successfully               → expects LOGIN_SUCCESS log
  4. Fetching audit logs via admin token   → confirms all 3 events exist

Requirements:
    - Backend server must be running: cd mission17-backend && node index.js
    - An ADMIN account must exist. Configure credentials below.
    - pip install requests

Run (from project root):
    python test_cases/audit_log_integrity_test.py
"""

import time
import random
import string
import requests

# ─────────────────────────────────────────────
#  CONFIGURATION
# ─────────────────────────────────────────────
BASE_URL = "http://localhost:5001/api/auth"

# Admin credentials to fetch the audit logs
# (GET /api/auth/audit-logs requires verifyAdmin middleware)
ADMIN_EMAIL    = "admin@mission17.com"
ADMIN_PASSWORD = "admin123"

# Pause between actions so MongoDB has time to write before we read
WRITE_DELAY_SEC = 1.5


# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────
def print_divider(char: str = "─", width: int = 66):
    print(char * width)


def random_suffix() -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=8))


def check_server():
    print("  🔌 Checking backend connectivity...", end="  ", flush=True)
    try:
        requests.post(f"{BASE_URL}/login", json={}, timeout=5)
        print("✅ Server is reachable.\n")
    except requests.exceptions.ConnectionError:
        print()
        print("  ❌ ERROR: Cannot connect to the backend server.")
        print(f"     Make sure it is running at: {BASE_URL}")
        print("     Start it with:  node index.js   (inside mission17-backend/)")
        print()
        raise SystemExit(1)
    except Exception:
        print("✅ Server is reachable.\n")


def step(label: str):
    print(f"  ── {label}")


def ok(msg: str):
    print(f"     ✅ {msg}")


def fail(msg: str):
    print(f"     ❌ {msg}")


# ─────────────────────────────────────────────
#  TEST STAGES
# ─────────────────────────────────────────────
def stage_register(suffix: str) -> dict:
    """Stage 1: Register a new test user. Expects SIGNUP to be logged."""
    step("Stage 1 — Register new test user")
    email    = f"audittest_{suffix}@test.com"
    username = f"audittest_{suffix}"
    password = "AuditPass123"

    resp = requests.post(
        f"{BASE_URL}/signup",
        json={"username": username, "email": email, "password": password},
        timeout=15,
    )
    if resp.status_code == 201:
        ok(f"User registered: {email}")
    else:
        fail(f"Registration failed: HTTP {resp.status_code} — {resp.json()}")

    return {"email": email, "password": password, "username": username,
            "status": resp.status_code}


def stage_failed_login(credentials: dict) -> dict:
    """Stage 2: Intentional wrong-password login. Expects LOGIN_FAILED to be logged."""
    step("Stage 2 — Attempt login with wrong password")
    resp = requests.post(
        f"{BASE_URL}/login",
        json={"email": credentials["email"], "password": "deliberatelyWrong!!"},
        timeout=15,
    )
    if resp.status_code == 400:
        ok("Wrong-password rejected (HTTP 400) — LOGIN_FAILED should be logged")
    else:
        fail(f"Unexpected status: HTTP {resp.status_code}")

    return {"status": resp.status_code}


def stage_successful_login(credentials: dict) -> dict:
    """Stage 3: Correct login. Expects LOGIN_SUCCESS to be logged."""
    step("Stage 3 — Successful login")
    resp = requests.post(
        f"{BASE_URL}/login",
        json={"email": credentials["email"], "password": credentials["password"]},
        timeout=15,
    )
    if resp.status_code == 200:
        token = resp.json().get("token", "")
        ok(f"Login successful — token received ({token[:20]}...)")
    elif resp.status_code == 202:
        token = ""
        ok("Login triggered MFA flow (HTTP 202) — LOGIN_SUCCESS logged before OTP")
    else:
        token = ""
        fail(f"Login failed unexpectedly: HTTP {resp.status_code} — {resp.json()}")

    return {"status": resp.status_code, "token": token}


def stage_get_admin_token() -> str:
    """Fetch an admin JWT so we can read audit logs."""
    step("Stage 4 — Fetching admin token for audit log access")
    resp = requests.post(
        f"{BASE_URL}/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "isAdminLogin": True},
        timeout=15,
    )
    if resp.status_code == 200:
        token = resp.json().get("token", "")
        ok(f"Admin token obtained ({token[:20]}...)")
        return token
    else:
        fail(f"Admin login failed: HTTP {resp.status_code} — {resp.json()}")
        fail("  Check ADMIN_EMAIL / ADMIN_PASSWORD in the script configuration.")
        return ""


def stage_verify_logs(admin_token: str, username: str) -> dict:
    """Stage 5: Read the 50 most-recent audit logs and look for our 3 events."""
    step("Stage 5 — Fetching audit logs and verifying events")
    time.sleep(WRITE_DELAY_SEC)  # Let MongoDB finish writing

    headers = {"auth-token": admin_token}
    resp    = requests.get(f"{BASE_URL}/audit-logs", headers=headers, timeout=15)

    if resp.status_code != 200:
        fail(f"Could not fetch audit logs: HTTP {resp.status_code}")
        return {"signup": False, "login_failed": False, "login_success": False}

    logs = resp.json()
    ok(f"Received {len(logs)} recent log entries")

    # Filter to only logs for our test user
    user_logs    = [l for l in logs if l.get("username") == username]
    actions_seen = {l.get("action") for l in user_logs}

    print(f"     Actions logged for '{username}': {sorted(actions_seen) or '(none found)'}")

    signup_ok  = "SIGNUP"        in actions_seen
    failed_ok  = "LOGIN_FAILED"  in actions_seen
    success_ok = "LOGIN_SUCCESS" in actions_seen

    if signup_ok:
        ok("SIGNUP event found ✅")
    else:
        fail("SIGNUP event NOT found — logAudit() may not be called in /signup")

    if failed_ok:
        ok("LOGIN_FAILED event found ✅")
    else:
        fail("LOGIN_FAILED event NOT found — logAudit() may not be called on wrong password")

    if success_ok:
        ok("LOGIN_SUCCESS event found ✅")
    else:
        fail("LOGIN_SUCCESS event NOT found — logAudit() may not be called on successful login")

    return {"signup": signup_ok, "login_failed": failed_ok, "login_success": success_ok}


# ─────────────────────────────────────────────
#  MAIN TEST RUNNER
# ─────────────────────────────────────────────
def run_audit_log_integrity_test():
    print()
    print_divider("═")
    print("  MISSION 17 BACKEND — Audit Log Integrity Test")
    print(f"  Target  : {BASE_URL}")
    print("  Stages  : Register → Fail Login → Succeed Login → Verify Logs")
    print_divider("═")
    print()

    check_server()

    suffix = random_suffix()

    # Run all stages
    reg_result   = stage_register(suffix)
    print()

    fail_result  = stage_failed_login(reg_result)
    print()

    login_result = stage_successful_login(reg_result)
    print()

    # We need an admin token — use admin account
    admin_token  = stage_get_admin_token()
    print()

    if not admin_token:
        print_divider("═")
        print("  ⚠️  Cannot verify audit logs without admin token.")
        print("     Update ADMIN_EMAIL and ADMIN_PASSWORD at the top of this script.")
        print_divider("═")
        print()
        return

    log_results = stage_verify_logs(admin_token, reg_result["username"])
    print()

    # ─── FINAL SUMMARY ────────────────────────────────────
    checks = {
        "User registration accepted (HTTP 201)":    reg_result["status"] == 201,
        "Wrong password rejected (HTTP 400)":        fail_result["status"] == 400,
        "Successful login accepted (HTTP 200/202)":  login_result["status"] in (200, 202),
        "SIGNUP event in audit log":                 log_results["signup"],
        "LOGIN_FAILED event in audit log":           log_results["login_failed"],
        "LOGIN_SUCCESS event in audit log":          log_results["login_success"],
    }

    passed = sum(1 for v in checks.values() if v)
    total  = len(checks)
    failed = total - passed

    print_divider("═")
    print("  FINAL SUMMARY")
    print_divider("─")
    for label, result in checks.items():
        icon = "✅" if result else "❌"
        print(f"  {icon}  {label}")
    print_divider("─")

    pct     = (passed / total * 100) if total > 0 else 0
    verdict = "✅ ALL CHECKS PASSED" if failed == 0 \
              else f"⚠️  {failed} CHECK(S) FAILED — Audit trail has gaps!"
    print(f"  Score       : {passed}/{total}  ({pct:.0f}%)   {verdict}")
    print_divider("═")
    print()


if __name__ == "__main__":
    run_audit_log_integrity_test()
