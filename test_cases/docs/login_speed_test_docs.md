# Login Speed Test — Documentation

**File:** `test_cases/login_speed_test.py` (project root)  
**Author:** Mission 17 Team  
**Purpose:** Benchmark the response time of the `POST /api/auth/login` endpoint across 10 runs and compute mean, min, max, and std deviation.

---

## How to Set Up

### 1. Create a Test User Account
The benchmark needs a real account in the database. Create one via the mobile app signup screen or run:

```bash
# Inside mission17-backend/
node createAdmin.js
```

Or use an already-existing student account.

### 2. Configure Credentials
Edit the constants at the top of `login_speed_test.py`:

```python
TEST_EMAIL    = "speedtest@test.com"
TEST_PASSWORD = "speedtest123"
```

### 3. Start the Backend Server

```bash
cd mission17-backend
node index.js
```

You should see:
```
✅ MongoDB Connected Securely
🛡️  Secure Server running on http://localhost:5001
```

### 4. Run the Test
Open a second terminal from the **project root**:

```bash
python test_cases/login_speed_test.py
```

### Expected Output

```
══════════════════════════════════════════════════════════════
  MISSION 17 BACKEND — Login Speed Benchmark
  Target : http://localhost:5001/api/auth/login
  Runs   : 10
══════════════════════════════════════════════════════════════

  [TEST 01/10]  Sending login request...  ->   412.3 ms  |  LOGIN_SUCCESS
  [TEST 02/10]  Sending login request...  ->   398.7 ms  |  LOGIN_SUCCESS
  ...

  MEAN (AVG)      :   405.2 ms   ✅ ACCEPTABLE
```

### Speed Rating Scale

| Rating | Mean Response Time |
|---|---|
| ⚡ FAST | < 600 ms |
| ✅ ACCEPTABLE | 600 ms – 1,500 ms |
| ⚠️ SLOW | 1,500 ms – 3,000 ms |
| ❌ CRITICAL | > 3,000 ms |

> **Note:** The FAST threshold is set at 600 ms (not 500 ms like in the AI test) because bcrypt's `genSalt(10)` adds ~200–400 ms intentionally. This is a security feature — not a performance bug.

---

## Design Decisions

### Why Only 5 Login Attempts Before Stopping?
The backend has a **rate limiter: 5 attempts per 15 minutes per IP** (defined in `routes/auth.js`). The test detects an HTTP 429 response and stops immediately to avoid lockout. If you need more than 5 runs, wait 15 minutes or use a different test account.

### Why No Warm-Up?
Unlike the AI model, the Express/bcrypt stack does not have a significant cold-start overhead. MongoDB connection pools are established at server startup before any requests arrive, so the first request is representative of normal performance.

### Why Use a Student Account Instead of Admin?
The admin login has additional logic (`role !== 'admin'` check, different JWT payload). Using a student account isolates the core bcrypt comparison speed without mixing in RBAC overhead.

### Why Note bcrypt's Speed?
A common mistake is "optimizing away" bcrypt slowness. The test explicitly reminds you in the summary that the ~200–400 ms pause is the **cost factor** (`genSalt(10)` = 2^10 hashing rounds) and is the primary defense against brute-force attacks. It should not be reduced.
