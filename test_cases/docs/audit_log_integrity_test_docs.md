# Audit Log Integrity Test — Documentation

**File:** `test_cases/audit_log_integrity_test.py` (project root)  
**Author:** Mission 17 Team  
**Purpose:** Verify that `SIGNUP`, `LOGIN_FAILED`, and `LOGIN_SUCCESS` events are correctly written to the MongoDB audit log for a real user session.

---

## How to Set Up

### 1. Start the Backend Server

```bash
cd mission17-backend
node index.js
```

### 2. Configure Admin Credentials
The test uses `GET /api/auth/audit-logs` which requires a valid admin JWT (`verifyAdmin` middleware). Edit the constants at the top of `audit_log_integrity_test.py`:

```python
ADMIN_EMAIL    = "admin@mission17.com"
ADMIN_PASSWORD = "admin123"
```

If you don't have an admin account yet, create one:

```bash
cd mission17-backend
node createAdmin.js
```

### 3. Run the Test

```bash
# From project root
python test_cases/audit_log_integrity_test.py
```

> The test generates a new uniquely-suffixed user on every run, so it never interferes with existing data.

### Expected Output

```
  ── Stage 1 — Register new test user
     ✅ User registered: audittest_abc123@test.com

  ── Stage 2 — Attempt login with wrong password
     ✅ Wrong-password rejected (HTTP 400) — LOGIN_FAILED should be logged

  ── Stage 3 — Successful login
     ✅ Login successful — token received (eyJhbGci...)

  ── Stage 4 — Fetching admin token for audit log access
     ✅ Admin token obtained (eyJhbGci...)

  ── Stage 5 — Fetching audit logs and verifying events
     ✅ Received 50 recent log entries
     Actions logged for 'audittest_abc123': ['LOGIN_FAILED', 'LOGIN_SUCCESS', 'SIGNUP']
     ✅ SIGNUP event found ✅
     ✅ LOGIN_FAILED event found ✅
     ✅ LOGIN_SUCCESS event found ✅

  FINAL SUMMARY
  ──────────────────────────────────────────────────────────────────
  ✅  User registration accepted (HTTP 201)
  ✅  Wrong password rejected (HTTP 400)
  ✅  Successful login accepted (HTTP 200/202)
  ✅  SIGNUP event in audit log
  ✅  LOGIN_FAILED event in audit log
  ✅  LOGIN_SUCCESS event in audit log
  ──────────────────────────────────────────────────────────────────
  Score : 6/6  (100%)   ✅ ALL CHECKS PASSED
```

---

## What is Checked

| Check | How |
|---|---|
| Registration accepted | `POST /signup` returns HTTP 201 |
| Wrong password rejected | `POST /login` with wrong password returns HTTP 400 |
| Correct login accepted | `POST /login` with correct password returns HTTP 200 or 202 |
| SIGNUP audit entry exists | Found in `GET /audit-logs` filtered by username |
| LOGIN_FAILED audit entry exists | Found in `GET /audit-logs` filtered by username |
| LOGIN_SUCCESS audit entry exists | Found in `GET /audit-logs` filtered by username |

---

## Design Decisions

### Why Test the Audit Log Instead of Just the Routes?
Route tests (like `register_validation_test.py`) only verify the HTTP response. Audit log integrity goes one layer deeper — it verifies that `logAudit()` was actually called and that MongoDB saved the record. A developer could accidentally delete a `logAudit()` call from `auth.js` and all route tests would still pass. This test would catch that.

### Why a Random Suffix Per Run?
Without a random suffix, Stage 1 (registration) would fail on the second run with "User already exists" — making Stages 2, 3 useful but Stage 1 meaningless. The suffix makes every run fully independent without needing a database reset.

### Why the `WRITE_DELAY_SEC = 1.5` Pause Before Reading Logs?
`logAudit()` is called with `await` inside `async` route handlers, but audit log writes happen concurrently with the HTTP response being sent. Under load, the write may not be committed to MongoDB before the test immediately calls `GET /audit-logs`. The 1.5-second pause is a safe buffer that prevents a false negative where events were written but not yet readable.

### Why Use `auth-token` Header to Fetch Logs?
The `verifyAdmin` middleware in `authMiddleware.js` checks for the token in `req.header('auth-token')` first, then `Authorization: Bearer`. Using `auth-token` directly matches how the admin panel sends it.

### Why 6 Assertions Instead of 3?
The test is split into **pipeline checks** (did the HTTP responses work correctly?) and **log checks** (did audit events get recorded?). This separation makes debugging easier. If all 3 log checks fail but pipeline checks pass, the bug is in `logAudit()` or MongoDB. If a pipeline check fails, the bug is earlier in the route handler.
