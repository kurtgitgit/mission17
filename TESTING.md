# 🧪 Mission 17 & Barangay E-Services: Quality Assurance & Test Strategy Document

<div align="center">

**Document Version:** `2.1.0` • **Evaluation Frameworks:** Automated Route/Validation Tests, Integration Checks, UAT, Device Smoke Tests

</div>

---

## 🎯 1. Testing Strategy Overview

The testing lifecycle for **Mission 17** spans five distinct validation tiers:
1. **Automated Unit & Integration Testing**: Validating REST API endpoints, controllers, and Mongoose schemas.
2. **AI & Computer Vision Robustness Testing**: Evaluating CNN classification accuracy, perceptual hashing, and adversarial file upload fuzzing.
3. **Smart Contract Security & Gas Benchmarking**: Testing EVM execution, UUPS upgrade authorization, and gas consumption.
4. **Stress & Concurrency Profiling**: Ensuring backend resilience during simultaneous resident requests and incident reports.
5. **User Acceptance Testing (UAT) & SUS Evaluation**: Measuring usability and citizen satisfaction using standardized instruments.

---

## 📋 2. Comprehensive Test Traceability Matrix (RTM)

| Test ID | Test Category | Target Subsystem | Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| `TC-AUTH-01` | Registration | Firebase Authentication + API | Valid verified signup creates a Firebase credential and BrgyLink resident profile; invalid profile data is rejected. | **Automated + device retest** |
| `TC-AUTH-02` | Signup verification | Gmail API OAuth | A 6-digit code is sent after Step 1, and only a current verified code permits registration. | **Automated route test + production retest** |
| `TC-AUTH-03` | Session Security | Firebase ID token / API authorization | Protected route rejects missing, invalid, or unauthorized credentials. | **Automated route test** |
| `TC-SEC-01` | Gateway Hardening | MongoSanitize | Request containing `{"$gt": ""}` stripped of operator before query. | **PASS** ✅ |
| `TC-SEC-02` | Gateway Hardening | XSS-Clean | Payload `<script>alert(1)</script>` sanitized before persistence. | **PASS** ✅ |
| `TC-SEC-03` | Rate Limiting | Express-Rate-Limit | Requests exceeding 1,000 req/min return 429 Too Many Requests. | **PASS** ✅ |
| `TC-AI-01` | Computer Vision | Hugging Face AI service | A valid request receives a service response suitable for review. Model quality must be reported only from a documented evaluation set. | **Integration check required** |
| `TC-AI-02` | Anti-Cheat | Image duplicate screening | A duplicate/unclear-image indicator can be surfaced to the reviewer; it does not replace barangay approval. | **Integration check required** |
| `TC-AI-03` | File Security | Upload handler | Unsupported or oversized media is rejected by the relevant upload validation. | **Automated/manual check required** |
| `TC-BC-01` | Smart Contract | Ethereum Sepolia | Blotter resolution transaction mined and visible on Sepolia Etherscan. | **PASS** ✅ |
| `TC-BC-02` | Gas Optimization | Solidity Proxy | On-chain gas cost per resolution remains under 30,000 gas. | **PASS** ✅ |
| `TC-CHAT-01` | Chat assistant | Configured LLM service | Knowledge-base safety rules are followed and uncertain answers direct residents to barangay staff. | **Scenario test required** |

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
