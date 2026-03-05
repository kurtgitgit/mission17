# Register Validation Test — Documentation

**File:** `test_cases/register_validation_test.py` (project root)  
**Author:** Mission 17 Team  
**Purpose:** Verify that `POST /api/auth/signup` correctly accepts valid input and rejects all invalid/malicious input with the right HTTP status codes.

---

## How to Set Up

### 1. Start the Backend Server

```bash
cd mission17-backend
node index.js
```

### 2. Run the Test

```bash
# From project root
python test_cases/register_validation_test.py
```

> **No credentials to configure.** The test generates unique random emails/usernames on each run using a 6-character random suffix, so it never conflicts with existing accounts — except for Case 8 (duplicate email test), which is intentionally designed to reuse Case 1's email.

### Expected Output

```
══════════════════════════════════════════════════════════════════
  MISSION 17 BACKEND — Register Validation Test
  Target  : http://localhost:5001/api/auth/signup
  Tests   : 10 cases  (valid + invalid inputs)
══════════════════════════════════════════════════════════════════

  [CASE 01/10]  Valid registration (should succeed)
           HTTP 201  |   312 ms  |  PASS ✅
           Server msg: "User created successfully"

  [CASE 06/10]  Password too short (7 chars — minimum is 8)
           HTTP 400  |    48 ms  |  PASS ✅
           Server msg: "Password must be at least 8 characters long."

  [CASE 10/10]  NoSQL injection in email field
           HTTP 400  |    32 ms  |  PASS ✅

  ══════════════════════════════════════════════════════════════════
  VALIDATION SUMMARY
  ──────────────────────────────────────────────────────────────────
  Total Cases : 10
  Passed      : 10  ✅
  Failed      : 0   ❌
  ──────────────────────────────────────────────────────────────────
  Score       : 100%   ✅ ALL VALIDATIONS PASSED
  ══════════════════════════════════════════════════════════════════
```

---

## Test Case Breakdown

| Case | Input Scenario | Expected HTTP |
|---|---|---|
| 1 | Valid registration | 201 |
| 2 | Missing password | 400 |
| 3 | Missing email | 400 or 500 |
| 4 | Missing username | 400 or 500 |
| 5 | Completely empty body | 400 |
| 6 | Password < 8 chars | 400 |
| 7 | Password exactly 8 chars (boundary) | 201 |
| 8 | Duplicate email (same as Case 1) | 400 |
| 9 | XSS in username (`<script>`) | Not 500 |
| 10 | NoSQL injection in email (`{$gt: ""}`) | 400 or 500 |

---

## Design Decisions

### Why 10 Validation Cases Specifically?
The test is structured to cover 4 distinct failure categories:
- **Missing fields** (Cases 2–5): Ensure the API fails gracefully instead of crashing.
- **Password rules** (Cases 6–7): Verify the 8-character minimum enforced in `auth.js`.
- **Duplicate data** (Case 8): Confirm the unique email constraint is checked.
- **Injection attacks** (Cases 9–10): Confirm `xss-clean` and `express-mongo-sanitize` middlewares in `index.js` intercept malicious input.

### Why Does Case 8 Depend on Case 1?
Case 8 is a duplicate-email test. It intentionally reuses the same email from Case 1. Since the test uses a random suffix per run, the email is always fresh and Case 1 will always create it first. This guarantees a clean duplicate scenario without needing any pre-seeded database state.

### Why is `should_pass = None` for Case 9 (XSS)?
The `xss-clean` middleware strips HTML tags before they reach the route handler. The resulting username might be an empty string or sanitized text, which mongoose may accept or reject depending on its `required` and `minlength` settings. Rather than hardcoding an expected status, the test only checks that the server does **not crash** (HTTP 500). Any 2xx or 4xx is acceptable — a 500 would mean the sanitization middleware failed.

### Why Accept `[400, 500]` for Cases 3, 4, and 10?
- Cases 3 & 4 (missing fields): Express does not crash on missing body fields. Mongoose's `required` validator throws a Mongo validation error caught by the `catch` block — which usually returns 500. However, if backend validation is added upstream, it might return 400. Both are acceptable — neither means data was created.
- Case 10 (NoSQL injection): The `express-mongo-sanitize` middleware strips `$`-prefixed keys. The sanitized object likely results in an invalid email, which either fails mongoose validation (400/500) — but should never create a user.

### Why Random Suffix Per Run?
Without a random suffix, running the test twice would make Case 1 fail on the second run (duplicate email). The suffix ensures every test run is fully self-contained and idempotent without needing a database reset.
