# Rate Limiter Test — Documentation

**File:** `test_cases/rate_limiter_test.py` (project root)  
**Author:** Mission 17 Team  
**Purpose:** Verify that `POST /api/auth/login` enforces a maximum of **5 attempts per 15 minutes per IP**. The 6th attempt must return HTTP 429.

---

## How to Set Up

### 1. Start the Backend Server

```bash
cd mission17-backend
node index.js
```

### 2. Configure a Test Account
Edit the constants at the top of `rate_limiter_test.py`:

```python
TEST_EMAIL = "speedtest@test.com"
```

Any existing user account works. Wrong passwords are sent deliberately — the account is never compromised.

### 3. Run the Test

```bash
# From project root
python test_cases/rate_limiter_test.py
```

### Expected Output

```
  [01]  Attempt 1/6
        Sending wrong-password login...  HTTP 400  |  PASS ✅  Rejected (wrong password)
  ...
  [06]  Attempt 6/6 ← MUST be rate-limited
        Sending wrong-password login...  HTTP 429  |  PASS ✅  Rate limiter triggered correctly

  RESULT : ✅ PASS — Rate limiter is working correctly.
           The server blocked attempt #6 with HTTP 429.
```

---

## ⚠️ Side Effect Warning

Running this test **locks your IP for 15 minutes** on the login endpoint. Do not run `login_speed_test.py` immediately after — it will get rate-limited too. Wait 15 minutes or restart the backend server (which resets the in-memory rate limit store).

---

## Design Decisions

### Why Send Exactly 6 Requests?
The rate limiter is configured as `max: 5` in `routes/auth.js`. Sending exactly one over the limit (6) is the minimal test that proves the boundary is enforced. Sending 10 would produce the same result — unnecessary network requests.

### Why Use a Wrong Password?
A successful login returns a JWT token, which is irrelevant here. Using a wrong password forces the server to still process the bcrypt comparison on attempts 1–5 (which is what real brute-force attempts look like), making the test realistic. The important thing is that attempts 1–5 are rejected for the wrong reason (400 wrong password) and attempt 6 is rejected for the right reason (429 rate limit).

### Why a 0.3 s Delay Between Attempts?
The delay prevents the test client from flooding the TCP connection pool faster than Node.js can respond. It does not affect the rate limiter window (which is wall-clock time, not request count per second). Without it, rapid requests can occasionally get connection errors before the rate limiter even responds.

### Why Warn About the 15-Minute Lockout?
The rate limiter uses `express-rate-limit`'s default in-memory store, which is per-process and per-IP. It does not reset between test runs — only on server restart. Failing to warn the developer would cause `login_speed_test.py` to unexpectedly receive 429 responses if run back-to-back.
