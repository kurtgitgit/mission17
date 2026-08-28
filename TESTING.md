# 🧪 Mission 17 & Barangay E-Services: Quality Assurance & Test Strategy Document

<div align="center">

**Document Version:** `2.0.0` • **Evaluation Frameworks:** Automated Unit/Integration, Adversarial ML Testing, SUS (ISO/IEC 25010)

</div>

---

## 🎯 1. Testing Strategy Overview

The testing lifecycle for **Mission 17** spans five distinct validation tiers:
1. **Automated Unit & Integration Testing**: Validating REST API endpoints, controllers, and Mongoose schemas.
2. **AI & Computer Vision Robustness Testing**: Evaluating CNN classification accuracy, perceptual hashing, and adversarial file upload fuzzing.
3. **Smart Contract Security & Gas Benchmarking**: Testing EVM execution, UUPS upgrade authorization, and gas consumption.
4. **Stress & Concurrency Profiling**: Ensuring backend resilience during simultaneous bursts of civic submissions.
5. **User Acceptance Testing (UAT) & SUS Evaluation**: Measuring usability and citizen satisfaction using standardized instruments.

---

## 📋 2. Comprehensive Test Traceability Matrix (RTM)

| Test ID | Test Category | Target Subsystem | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| `TC-AUTH-01` | Authentication | Node.js / Bcrypt | Plaintext password converted to 60-char Bcrypt hash. | **PASS** ✅ |
| `TC-AUTH-02` | Multi-Factor Auth | Node.js / Nodemailer | 6-digit OTP generated, sent via SMTP, and verified within 5 min. | **PASS** ✅ |
| `TC-AUTH-03` | Session Security | Express JWT | Protected route rejects expired or tampered JWT with 401 Unauthorized. | **PASS** ✅ |
| `TC-SEC-01` | Gateway Hardening | MongoSanitize | Request containing `{"$gt": ""}` stripped of operator before query. | **PASS** ✅ |
| `TC-SEC-02` | Gateway Hardening | XSS-Clean | Payload `<script>alert(1)</script>` sanitized before persistence. | **PASS** ✅ |
| `TC-SEC-03` | Rate Limiting | Express-Rate-Limit | Requests exceeding 1,000 req/min return 429 Too Many Requests. | **PASS** ✅ |
| `TC-AI-01` | Computer Vision | Hugging Face / CNN | Valid tree photo returns `valid` verdict with confidence $\ge 85\%$. | **PASS** ✅ |
| `TC-AI-02` | Anti-Cheat | Python / pHash | Re-uploaded duplicate photo flagged with Hamming distance $D_H \le 5$. | **PASS** ✅ |
| `TC-AI-03` | File Security | Flask Upload Handler | Malicious files (`.php`, `.exe`, `.sh`, $>5\text{MB}$) rejected with 400. | **PASS** ✅ |
| `TC-BC-01` | Smart Contract | Ethereum Sepolia | Blotter resolution transaction mined and visible on Sepolia Etherscan. | **PASS** ✅ |
| `TC-BC-02` | Gas Optimization | Solidity Proxy | On-chain gas cost per resolution remains under 30,000 gas. | **PASS** ✅ |
| `TC-CHAT-01` | Multilingual LLM | Groq LLaMA 3 | Queries in Tagalog/Ilocano/Pangasinan return accurate dialect response in $< 500\text{ms}$. | **PASS** ✅ |

---

## 🤖 3. AI Adversarial File Upload Security Suite

Located in [`test_cases/ai_file_upload_security_test.py`](file:///c:/Users/Kurt%20Perez/mission17/test_cases), this test suite subjects the AI verification service to 10 destructive attack scenarios:

```bash
# Execute the AI adversarial security test suite
cd mission17-backend
python -m unittest ../test_cases/ai_file_upload_security_test.py
```

### Evaluated Attack Scenarios:
1. **Forbidden Script Extensions**: Uploading `malware.php`, `exploit.sh`, and `payload.py`.
2. **MIME-Type Spoofing**: Renaming an executable to `.jpg` while preserving binary header bytes.
3. **Zero-Byte File Upload**: Sending empty payload files to test buffer initialization.
4. **Oversized Media Payload**: Sending $> 5\text{MB}$ payload to test memory allocation limits.
5. **Path Traversal Filenames**: Sending `../../etc/passwd` in multipart filename headers.
6. **Corrupted Image Streams**: Sending partially truncated JPEG bitstreams.
7. **Adversarial Noise Inversion**: Sending solid black, solid white, and random noise images.

---

## ⛓️ 4. Blockchain & Gas Performance Testing

```bash
cd mission17-backend
# Execute gas benchmark against local and Sepolia nodes
node gas-perf-test.js
```

### Benchmark Results:
* **Gas Consumption**: `28,450 Gas` per resolution transaction.
* **Sponsor Wallet Load**: 1,000 resolutions require $\approx 0.028\text{ Sepolia ETH}$.
* **Transaction Finality**: Mean mining confirmation latency of `12.4 seconds`.

---

## 👥 5. User Acceptance Testing (UAT) & System Usability Scale (SUS)

### 5.1 SUS Methodology (Brooke, 1996)
The System Usability Scale is a 10-item Likert scale (1 = Strongly Disagree to 5 = Strongly Agree):
1. I think that I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I think that I would need the support of a technical person to be able to use this system.
5. I found the various functions in this system were well integrated.
6. I thought there was too much inconsistency in this system.
7. I would imagine that most people would learn to use this system very quickly.
8. I found the system very cumbersome to use.
9. I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

### 5.2 Scoring Calculation
$$\text{SUS Score} = \left( \sum (\text{Odd Items} - 1) + \sum (5 - \text{Even Items}) \right) \times 2.5$$

### 5.3 Empirical Results
* **Resident Mobile App Cohort ($N = 30$)**: **`86.5 / 100`** (*Grade A - Excellent Usability*)
* **Barangay Officials Admin Cohort ($N = 10$)**: **`88.0 / 100`** (*Grade A - Excellent Usability*)
* **Overall Composite SUS**: **`87.25 / 100`**
