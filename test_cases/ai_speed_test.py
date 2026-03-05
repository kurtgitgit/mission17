"""
Mission 17 AI - Speed Benchmark Test
=====================================
Sends 10 predict requests to the running Flask AI server and measures
response time per request, then prints mean, min, max, and std deviation.

Requirements:
    - AI server must be running: cd mission17-ai && python app.py
    - pip install requests opencv-python numpy

Run (from project root):
    python test_cases/ai_speed_test.py
"""

import io
import time
import statistics

import cv2
import numpy as np
import requests

# ─────────────────────────────────────────────
#  CONFIGURATION
# ─────────────────────────────────────────────
SERVER_URL   = "http://localhost:5000/predict"
NUM_TESTS    = 10
IMAGE_SIZE   = (224, 224)   # Must match app.py target size
SEED         = 42           # Fixed seed -> reproducible synthetic image

# Speed rating thresholds (milliseconds)
THRESH_FAST        = 500
THRESH_ACCEPTABLE  = 1500
THRESH_SLOW        = 3000


# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────
def make_synthetic_image_bytes(seed: int) -> bytes:
    """
    Generate a random 224x224 JPEG image in memory using numpy + OpenCV.
    No disk I/O — keeps benchmark focused on network + model inference time.
    """
    rng = np.random.default_rng(seed)
    img = rng.integers(0, 256, (*IMAGE_SIZE, 3), dtype=np.uint8)
    success, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    if not success:
        raise RuntimeError("Failed to encode synthetic image as JPEG.")
    return buffer.tobytes()


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
#  WARM-UP  (not counted in results)
# ─────────────────────────────────────────────
def run_warmup(image_bytes: bytes):
    """
    TensorFlow and Flask can take extra time on the very first request
    due to lazy-loading and graph compilation. A warm-up run ensures
    subsequent timed tests reflect steady-state inference speed.
    """
    print("  🔥 Running warm-up request (not counted)...")
    try:
        requests.post(
            SERVER_URL,
            files={"file": ("warmup.jpg", io.BytesIO(image_bytes), "image/jpeg")},
            timeout=30,
        )
        print("  ✅ Warm-up complete.\n")
    except requests.exceptions.ConnectionError:
        print()
        print("  ❌ ERROR: Cannot connect to the AI server.")
        print(f"     Make sure it is running at: {SERVER_URL}")
        print("     Start it with:  python app.py   (inside mission17-ai/)")
        print()
        raise SystemExit(1)


# ─────────────────────────────────────────────
#  MAIN BENCHMARK
# ─────────────────────────────────────────────
def run_speed_test():
    print()
    print_divider("═")
    print("  MISSION 17 AI — Speed Benchmark Test")
    print(f"  Target : {SERVER_URL}")
    print(f"  Runs   : {NUM_TESTS}  |  Image: {IMAGE_SIZE[0]}×{IMAGE_SIZE[1]} synthetic JPEG")
    print_divider("═")
    print()

    # Build the synthetic image ONCE — all 10 runs send the same image bytes
    # so differences in measured time reflect server variance, not client variance.
    image_bytes = make_synthetic_image_bytes(SEED)

    # Warm-up
    run_warmup(image_bytes)

    durations_ms = []

    for i in range(1, NUM_TESTS + 1):
        print(f"  [TEST {i:02d}/{NUM_TESTS}]  Sending request...", end="  ", flush=True)

        try:
            # Re-wrap bytes in a fresh BytesIO each iteration (requests reads it fully)
            file_payload = {"file": ("test.jpg", io.BytesIO(image_bytes), "image/jpeg")}

            t_start = time.perf_counter()
            response = requests.post(SERVER_URL, files=file_payload, timeout=30)
            t_end = time.perf_counter()

            elapsed_ms = (t_end - t_start) * 1000
            durations_ms.append(elapsed_ms)

            # Parse verdict from response for context
            if response.status_code == 200:
                verdict = response.json().get("verdict", "N/A")
                confidence = response.json().get("confidence", "N/A")
                print(f"-> {elapsed_ms:7.1f} ms  |  {verdict} ({confidence})")
            else:
                print(f"-> {elapsed_ms:7.1f} ms  |  HTTP {response.status_code} ⚠️")

        except requests.exceptions.Timeout:
            print("-> TIMEOUT ❌  (> 30s)")
        except requests.exceptions.ConnectionError:
            print("-> CONNECTION ERROR ❌")
            print()
            print("  Server went offline during testing. Aborting.")
            break

    # ─── SUMMARY ──────────────────────────────
    if not durations_ms:
        print("\n  No data collected. Cannot compute statistics.")
        return

    mean_ms  = statistics.mean(durations_ms)
    min_ms   = min(durations_ms)
    max_ms   = max(durations_ms)
    # stdev requires at least 2 data points
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
    print_divider("═")
    print()

    # Per-run breakdown table
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
    run_speed_test()
