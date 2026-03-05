"""
Mission 17 AI - File Upload Security Test
==========================================
Verifies that POST /predict correctly REJECTS disallowed file types and
ACCEPTS allowed ones. Tests the 'allowed_file()' validator in app.py.

This is a correctness/security test — not a speed test.
10 cases covering: forbidden extensions, no-extension filenames,
empty files, spoofed extensions, and valid types.

Requirements:
    - AI server must be running: cd mission17-ai && python app.py
    - pip install requests numpy opencv-python

Run (from project root):
    python test_cases/ai_file_upload_security_test.py
"""

import io
import requests
import numpy as np
import cv2

# ─────────────────────────────────────────────
#  CONFIGURATION
# ─────────────────────────────────────────────
SERVER_URL = "http://localhost:5000/predict"

# Allowed extensions per app.py: {'png', 'jpg', 'jpeg', 'webp'}
# MAX_CONTENT_LENGTH = 100 MB


# ─────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────
def print_divider(char: str = "─", width: int = 66):
    print(char * width)


def make_jpeg_bytes() -> bytes:
    """Generate a tiny valid 64×64 JPEG in memory."""
    rng = np.random.default_rng(0)
    img = rng.integers(0, 256, (64, 64, 3), dtype=np.uint8)
    _, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()


def make_png_bytes() -> bytes:
    """Generate a tiny valid 24×24 PNG in memory."""
    rng = np.random.default_rng(1)
    img = rng.integers(0, 256, (24, 24, 3), dtype=np.uint8)
    _, buf = cv2.imencode(".png", img)
    return buf.tobytes()


def check_server():
    print("  🔌 Checking AI server connectivity...", end="  ", flush=True)
    try:
        requests.post(SERVER_URL, timeout=5)
        print("✅ Server is reachable.\n")
    except requests.exceptions.ConnectionError:
        print()
        print("  ❌ ERROR: Cannot connect to the AI server.")
        print(f"     Make sure it is running at: {SERVER_URL}")
        print("     Start it with:  python app.py   (inside mission17-ai/)")
        print()
        raise SystemExit(1)
    except Exception:
        # Any response (400, 503, etc.) means the server IS up
        print("✅ Server is reachable.\n")


# ─────────────────────────────────────────────
#  TEST CASE DEFINITIONS
#  Each dict:
#    filename     : string sent as the multipart filename
#    content      : bytes to send as the file body
#    mime_type    : MIME type in the Content-Type of the part
#    should_pass  : True = expect 200, False = expect 400
#    description  : human label
# ─────────────────────────────────────────────
def build_test_cases() -> list[dict]:
    jpeg_bytes = make_jpeg_bytes()
    png_bytes  = make_png_bytes()
    tiny_jpeg  = make_jpeg_bytes()

    return [
        # ── VALID ─────────────────────────────────────────────────────────────
        {
            "id": 1,
            "description": "Valid .jpg file",
            "filename":    "photo.jpg",
            "content":     jpeg_bytes,
            "mime":        "image/jpeg",
            "should_pass": True,
            "expected":    200,
        },
        {
            "id": 2,
            "description": "Valid .png file",
            "filename":    "photo.png",
            "content":     png_bytes,
            "mime":        "image/png",
            "should_pass": True,
            "expected":    200,
        },
        {
            "id": 3,
            "description": "Valid .jpeg extension",
            "filename":    "mission.jpeg",
            "content":     jpeg_bytes,
            "mime":        "image/jpeg",
            "should_pass": True,
            "expected":    200,
        },

        # ── FORBIDDEN EXTENSIONS ──────────────────────────────────────────────
        {
            "id": 4,
            "description": "Executable (.exe) — must be rejected",
            "filename":    "malware.exe",
            "content":     b"MZ\x90\x00fake exe bytes",
            "mime":        "application/octet-stream",
            "should_pass": False,
            "expected":    400,
        },
        {
            "id": 5,
            "description": "PDF document — must be rejected",
            "filename":    "document.pdf",
            "content":     b"%PDF-1.4 fake pdf bytes",
            "mime":        "application/pdf",
            "should_pass": False,
            "expected":    400,
        },
        {
            "id": 6,
            "description": "Python script (.py) — must be rejected",
            "filename":    "exploit.py",
            "content":     b"import os; os.system('rm -rf /')",
            "mime":        "text/plain",
            "should_pass": False,
            "expected":    400,
        },
        {
            "id": 7,
            "description": "Video file (.mp4) — must be rejected",
            "filename":    "video.mp4",
            "content":     b"\x00\x00\x00\x18ftypisom fake mp4",
            "mime":        "video/mp4",
            "should_pass": False,
            "expected":    400,
        },

        # ── EDGE CASES ────────────────────────────────────────────────────────
        {
            "id": 8,
            "description": "No extension in filename — must be rejected",
            "filename":    "noextension",
            "content":     jpeg_bytes,
            "mime":        "image/jpeg",
            "should_pass": False,
            "expected":    400,
        },
        {
            "id": 9,
            "description": "Spoofed extension: real JPEG bytes but .exe filename",
            "filename":    "photo.exe",
            "content":     jpeg_bytes,   # Real image bytes, but wrong extension
            "mime":        "image/jpeg",
            "should_pass": False,        # Validator checks filename, not magic bytes
            "expected":    400,
        },
        {
            "id": 10,
            "description": "Empty file body with valid .jpg filename",
            "filename":    "empty.jpg",
            "content":     b"",          # Zero bytes
            "mime":        "image/jpeg",
            "should_pass": False,        # OpenCV decode will fail → 500 is also a fail
            "expected":    [400, 500],
        },
    ]


# ─────────────────────────────────────────────
#  MAIN TEST RUNNER
# ─────────────────────────────────────────────
def run_file_upload_security_test():
    print()
    print_divider("═")
    print("  MISSION 17 AI — File Upload Security Test")
    print(f"  Target  : {SERVER_URL}")
    print("  Tests   : 10 cases  (valid types + forbidden extensions + edge cases)")
    print_divider("═")
    print()

    check_server()

    test_cases = build_test_cases()
    passed = 0
    failed = 0

    for tc in test_cases:
        desc     = tc["description"]
        expected = tc["expected"]

        print(f"  [CASE {tc['id']:02d}/10]  {desc}")
        print(f"           Sending '{tc['filename']}'...", end="  ", flush=True)

        try:
            file_obj = {"file": (tc["filename"], io.BytesIO(tc["content"]), tc["mime"])}
            response = requests.post(SERVER_URL, files=file_obj, timeout=30)
            status   = response.status_code

            # Check result
            if isinstance(expected, list):
                ok = status in expected
            else:
                ok = (status == expected)

            result_str = "PASS ✅" if ok else f"FAIL ❌  (expected {expected}, got {status})"
            print(f"HTTP {status}  |  {result_str}")

            # Show verdict if available
            try:
                body    = response.json()
                verdict = body.get("verdict") or body.get("error", "")
                if verdict:
                    print(f"           Response: \"{str(verdict)[:70]}\"")
            except Exception:
                pass

            print()

            if ok:
                passed += 1
            else:
                failed += 1

        except requests.exceptions.Timeout:
            print("TIMEOUT ❌  (> 30s)\n")
            failed += 1
        except requests.exceptions.ConnectionError:
            print("CONNECTION ERROR ❌\n")
            failed += 1
            break

    # ─── SUMMARY ──────────────────────────────
    total = passed + failed
    pct   = (passed / total * 100) if total > 0 else 0

    print_divider("═")
    print("  SECURITY SUMMARY")
    print_divider("─")
    print(f"  Total Cases : {total}")
    print(f"  Passed      : {passed}  ✅")
    print(f"  Failed      : {failed}  ❌")
    print_divider("─")
    verdict = "✅ ALL SECURITY CHECKS PASSED" if failed == 0 \
              else f"⚠️  {failed} CHECK(S) FAILED — File type validation has gaps!"
    print(f"  Score       : {pct:.0f}%   {verdict}")
    print_divider("═")
    print()


if __name__ == "__main__":
    run_file_upload_security_test()
