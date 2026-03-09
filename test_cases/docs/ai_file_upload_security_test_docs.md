# AI File Upload Security Test — Documentation

**File:** `test_cases/ai_file_upload_security_test.py` (project root)  
**Author:** Mission 17 Team  
**Purpose:** Verify that `POST /predict` rejects all file types not in the allowed set (`png`, `jpg`, `jpeg`, `webp`) and correctly handles edge cases like empty files and spoofed extensions.

---

## How to Set Up

### 1. Start the AI Server

```bash
cd mission17-ai
python app.py
```

### 2. Install Dependencies

```bash
pip install requests numpy opencv-python
```

These are the same packages already required by `app.py`.

### 3. Run the Test

```bash
# From project root
python test_cases/ai_file_upload_security_test.py
```

> No manual configuration needed — the test generates all images in memory.

### Expected Output

```
  [CASE 01/10]  Valid .jpg file
           Sending 'photo.jpg'...  HTTP 200  |  PASS ✅

  [CASE 04/10]  Executable (.exe) — must be rejected
           Sending 'malware.exe'...  HTTP 400  |  PASS ✅
           Response: "Invalid file type. Only JPG/PNG allowed."

  [CASE 09/10]  Spoofed extension: real JPEG bytes but .exe filename
           Sending 'photo.exe'...  HTTP 400  |  PASS ✅

  Score : 100%   ✅ ALL SECURITY CHECKS PASSED
```

---

## Test Case Breakdown

| Case | Filename | Scenario | Expected |
|---|---|---|---|
| 1 | photo.jpg | Valid JPEG | 200 |
| 2 | photo.png | Valid PNG | 200 |
| 3 | mission.jpeg | Valid .jpeg extension | 200 |
| 4 | malware.exe | Executable — forbidden | 400 |
| 5 | document.pdf | PDF — forbidden | 400 |
| 6 | exploit.py | Python script — forbidden | 400 |
| 7 | video.mp4 | Video — forbidden | 400 |
| 8 | noextension | No extension in filename | 400 |
| 9 | photo.exe | Real JPEG bytes, wrong extension | 400 |
| 10 | empty.jpg | Valid extension, zero bytes | 400 or 500 |

---

## Design Decisions

### Why Test Spoofed Extensions (Case 9)?
A common attack is renaming a malicious file to a trusted extension (e.g., `shell.php.jpg`). Case 9 tests the reverse: a real JPEG renamed to `.exe`. The `allowed_file()` validator in `app.py` checks **only the filename extension**, not the magic bytes (file header). This is intentional and sufficient for the use case — rejecting by extension is fast and prevents the file from ever reaching the model. Case 9 confirms this boundary is enforced correctly: even legitimate image bytes are rejected if the extension is wrong.

### Why Generate Images in Memory Instead of Using Fixture Files?
- No dependency on fixture files on disk — the test is fully self-contained and portable.
- Any developer who has `opencv-python` installed can run it immediately after cloning.
- Ensures the image bytes are genuinely decodable by OpenCV (not just random noise with a `.jpg` extension), making the valid cases (1–3) a true positive test of the full pipeline.

### Why Accept `[400, 500]` for Case 10 (Empty File)?
The `allowed_file()` check passes for `.jpg`, so the request reaches the image processing code. OpenCV's `cv2.imdecode()` returns `None` for empty input. Whether the server catches that gracefully (500 with an error JSON) or validates size upstream (400) depends on whether a file-size pre-check is added. Both statuses confirm the server did not create a prediction — neither is a security failure. A 200 response would be the failure.

### Why Include `.py` and `.exe` Specifically?
These are the two highest-risk file types for a server-side upload endpoint:
- `.exe`: Direct execution vector on Windows servers.
- `.py`: Could be executed by the Python runtime that hosts `app.py` if ever written to disk and invoked.

Both should be blocked far upstream, at the extension validator, before any other processing occurs.
