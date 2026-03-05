# AI Speed Test — Documentation

**File:** `test_cases/ai_speed_test.py` (project root)  
**Author:** Mission 17 Team  
**Purpose:** Benchmark the response time of the Mission 17 AI `/predict` endpoint.

---

## How to Set Up

### 1. Start the AI Server
The speed test connects to the running Flask server. Make sure it is up first.

```bash
# From the mission17-ai/ directory
cd mission17-ai
python app.py
```

You should see:
```
🧠 Loading the MISSION 17 AI Brain...
✅ Model loaded successfully!
 * Running on http://0.0.0.0:5000
```

### 2. Install Dependencies
The test uses only packages that are already required by `app.py`, so if the server runs, these are already installed.

```bash
pip install requests opencv-python numpy
```

### 3. Run the Speed Test
Open a **second terminal** (keep the server running in the first).

```bash
# From the project root (d:/Projects/mission17/)
python test_cases/ai_speed_test.py
```

### Expected Output
```
══════════════════════════════════════════════════════════════
  MISSION 17 AI — Speed Benchmark Test
  Target : http://localhost:5000/predict
  Runs   : 10  |  Image: 224×224 synthetic JPEG
══════════════════════════════════════════════════════════════

  🔥 Running warm-up request (not counted)...
  ✅ Warm-up complete.

  [TEST 01/10]  Sending request...  ->   312.4 ms  |  UNCERTAIN (11%)
  [TEST 02/10]  Sending request...  ->   298.7 ms  |  UNCERTAIN (11%)
  ...

══════════════════════════════════════════════════════════════
  RESULTS SUMMARY
──────────────────────────────────────────────────────────────
  Completed Runs  : 10 / 10
  Fastest         :   291.2 ms
  Slowest         :   345.8 ms
  Std Deviation   :    18.4 ms
──────────────────────────────────────────────────────────────
  MEAN (AVG)      :   310.5 ms   ⚡ FAST
══════════════════════════════════════════════════════════════
```

### Speed Rating Scale

| Rating | Mean Response Time |
|---|---|
| ⚡ FAST | < 500 ms |
| ✅ ACCEPTABLE | 500 ms – 1,500 ms |
| ⚠️ SLOW | 1,500 ms – 3,000 ms |
| ❌ CRITICAL | > 3,000 ms |

---

## Design Decisions

### Why 10 Tests?
10 iterations is a standard minimum for a quick micro-benchmark. It is:
- **Large enough** to smooth out individual outliers (network jitter, OS scheduling spikes).
- **Small enough** to finish in under 30 seconds, making it practical to run frequently.

A single measurement is unreliable — the OS, Python GC, and TensorFlow's own thread pool can all cause one-off spikes. The mean of 10 runs gives a stable, repeatable number.

### Why a Warm-Up Request?
The very first request to a Flask + TensorFlow server is typically slower because:
1. Python's module imports are lazy — some TF graph nodes are compiled on first use.
2. The OS may page in memory that was swapped out.
3. Flask's internal routing cache is cold.

The warm-up run absorbs this one-time cost. All 10 timed runs therefore reflect **steady-state inference speed**, which is what matters for real users.

### Why Synthetic Images Instead of Real Dataset Images?
- **No dependency on the dataset folder.** The test works on any machine that has the server running, even if `dataset/mission_dataset/` is absent.
- **Reproducibility.** The same fixed seed (`SEED = 42`) generates the identical pixel pattern every run, so results across different machines or runs are comparable by controlling the input.
- **Isolation.** We are measuring the speed of the server pipeline (HTTP handling → preprocessing → MobileNetV2 inference → JSON response), not the speed of loading files from disk. The synthetic image removes disk I/O as a confounding variable.

### Why `time.perf_counter()` Instead of `time.time()`?
`time.perf_counter()` uses the highest resolution clock available on the OS (sub-millisecond on all modern platforms). `time.time()` has lower resolution and can jump forward (NTP sync) mid-test. For measuring durations in the 100–2000 ms range, `perf_counter` is the correct choice.

### Why Re-wrap `BytesIO` Each Iteration?
`requests` reads the file object to EOF when it builds the multipart body. If the same `BytesIO` instance was reused, the second request would send an empty file. Re-wrapping `image_bytes` in a fresh `BytesIO` on each loop iteration ensures every request sends the full image without re-encoding it, keeping the client-side overhead minimal.

### Why Show Standard Deviation?
Mean alone does not tell the full story. A server with a mean of 400 ms but a stdev of 300 ms is less reliable than one with a mean of 500 ms and stdev of 20 ms. The std deviation reveals whether the AI server's speed is **consistent** or **erratic**, which matters for user experience in the mobile app.

### Why Show the Per-Run Breakdown and Difference from Mean?
The `vs Mean` column in the breakdown table makes it immediately obvious which runs were outliers and by how much. This helps diagnose whether a single slow run inflated the mean, or whether slowness is consistent across all runs.

---

## Changing the Server URL
If the AI server is running on a different host or port, change this constant at the top of `test_cases/ai_speed_test.py`:

```python
SERVER_URL = "http://localhost:5000/predict"
```

For example, if deployed to a cloud VM:
```python
SERVER_URL = "http://192.168.1.50:5000/predict"
```

## Changing the Number of Tests
Adjust the constant:
```python
NUM_TESTS = 10
```

For a more statistically rigorous benchmark, use 30 or 50. For a quick sanity check, 5 is sufficient.
