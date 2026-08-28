# 🎓 Mission 17 & BrgyLink: Capstone Defense Proof & Panel Q&A Guide

<div align="center">

**Objective:** Achieve a **5.0 / Excellent (100 Points)** across all panel evaluation criteria.  
**Preparation:** Keep Sepolia Etherscan, Hugging Face AI logs, and MongoDB Compass open during the live defense.

</div>

---

## 📋 Rubric Scoring Breakdown Matrix

| Category | Maximum Points | Core Technical Focus |
| :--- | :---: | :--- |
| **Part 1: Security & System Architecture** | **45 Points** | Bcrypt, JWT Lifecycle, MFA OTP, OWASP Top 10, Tamper-Evident Logs |
| **Part 2: Blockchain & Smart Contracts** | **20 Points** | UUPS Upgradeable Proxy, Gas Optimizations, Sepolia Immutability |
| **Part 3: AI & Machine Learning Pipeline** | **30 Points** | CNN Accuracy/F1-Score, Anti-Cheat pHash, Adversarial Robustness |
| **Part 4: Technical Documentation & UX** | **5 Points** | Complete IMRAD Guide, OpenAPI Specification, SUS Benchmark |
| **Total Score** | **100 Points** | **Grade: 5.0 (Highest Distinction)** |

---

## 🛡️ PART 1: Security & Core Architecture (45 Points)

### 1. Multi-Layered Authentication & MFA OTP
* **Files to Show:** `mission17-backend/routes/auth.js` & `mission17-backend/utils/authMiddleware.js`
* **Code Proof:** Show Bcrypt password hashing (`saltRounds = 10`), JWT signing with 24-hour expiration, and Nodemailer 6-digit OTP email dispatch.
* **Panel Defense Script:**
  > *"Our authentication follows a defense-in-depth model. Passwords are never stored in plain text and are hashed using Bcrypt with a salt factor of 10. To prevent credential stuffing and unauthorized access, administrative actions and logins require multi-factor verification using temporal 6-digit OTPs dispatched via secure SMTP."*

### 2. OWASP Top 10 Protections & Gateway Hardening
* **Files to Show:** `mission17-backend/index.js`
* **Code Proof:**
  - `helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })` for HTTP header hardening.
  - `mongoSanitize()` to strip `$gt`, `$ne`, and operator injections.
  - `xss-clean` to sanitize script injection in request payloads.
  - `rateLimit()` configured for 1,000 requests/minute to prevent DoS attacks.
* **Panel Defense Script:**
  > *"We mitigated the OWASP Top 10 threats at the API gateway layer. MongoSanitize prevents NoSQL operator injection, Helmet strips sensitive header signatures, and XSS sanitizers scrub payload bodies before any controller handles the data."*

### 3. Data Protection & Cryptographic Storage
* **Files to Show:** `SECURITY.md` (Section 2) & MongoDB Atlas Cluster Security Settings
* **Code Proof:** Clustered MongoDB Atlas storage encrypted using **AES-256 at rest**; all API endpoints enforce **TLS 1.3 in transit**.

### 4. Tamper-Evident Audit Trail
* **Files to Show:** `mission17-backend/models/AuditLog.js` & `mission17-backend/utils/authMiddleware.js` (`logAudit`)
* **Code Proof:** Automatic logging of `userId`, `action`, `ipAddress`, `userAgent`, and `timestamp` upon critical events.

---

## ⛓️ PART 2: Blockchain & Smart Contracts (20 Points)

### 1. Smart Contract Design & UUPS Proxy Pattern
* **Files to Show:** `mission17-backend/contracts/Mission17Ledger.sol` & `mission17-backend/contracts/Mission17Verify.sol`
* **Code Proof:** OpenZeppelin `UUPSUpgradeable` implementation, `onlyOwner` access control, and gasless sponsor transaction execution in `routes/blockchain.js`.
* **Panel Defense Script:**
  > *"Our smart contracts use the Universal Upgradeable Proxy Standard (UUPS) to permit logic upgrades while preserving permanent state. By implementing a server-side Sponsor Wallet, we eliminate the need for citizens to pay cryptocurrency gas fees."*

### 2. Gas Optimization Techniques
* **Files to Show:** `OPTIMIZATION_REPORT.md` (Section 3) & `mission17-backend/gas-perf-test.js`
* **Code Proof:**
  - Utilization of `calldata` instead of `memory` for external parameters.
  - `unchecked { ... }` arithmetic blocks.
  - Elimination of hardcoded gas limits in favor of true EIP-1559 dynamic fee estimation.

### 3. Live Sepolia Verification Demonstration
* **Action:** Open [Sepolia Etherscan](https://sepolia.etherscan.io/) and paste a resolved blotter transaction hash.
* **Panel Defense Script:**
  > *"Here is the live transaction receipt on Sepolia Etherscan. You can see the exact SHA-256 fingerprint of the blotter resolution stored in the contract event logs, proving that the record cannot be altered retroactively by anyone—even a database administrator."*

---

## 🤖 PART 3: AI & Intelligent Features (30 Points)

### 1. Computer Vision Evaluation (F1-Score & Accuracy)
* **Files to Show:** `mission17-ai/evaluate_model.py` & `mission17-ai/app.py`
* **Code Proof:** Custom CNN model achieving **92.4% Accuracy**, **94.1% Precision**, and **91.7% F1-Score** on target civic program classes.

### 2. Anti-Cheat Perceptual Hashing
* **Files to Show:** `mission17-ai/app.py` (`calculate_phash` / duplicate check)
* **Code Proof:** Difference hashing / pHash algorithm comparing image Hamming distances to detect duplicate submissions.
* **Panel Defense Script:**
  > *"To ensure data integrity, our AI computes a perceptual hash for every uploaded image. If a citizen submits a photo that matches a historical hash within a threshold Hamming distance, the submission is immediately flagged as a duplicate."*

### 3. Explainable AI & Transparent Rule Tracing
* **Files to Show:** `mission17-ai/app.py` (JSON output with `verdict`, `confidence`, and `decision_rules`)

### 4. Multilingual LLM Chatbot (Groq LLaMA 3)
* **Files to Show:** `mission17-backend/routes/chatbot.js`
* **Panel Defense Script:**
  > *"Our chatbot uses Groq LPUs to run LLaMA 3 inference with sub-500ms latency, delivering localized guidance in English, Tagalog, Pangasinan, and Ilocano to ensure digital inclusion for all community members."*

---

## 📝 PART 4: Technical Documentation & Usability (5 Points)

* **Files to Show:** Complete manuscript suite including `DATABASE_SCHEMA.md`, `USER_MANUAL.md`, `TESTING.md`, `SMART_CONTRACT.md`, and `API_DOCS.md`.
* **Highlight:** System Usability Scale (SUS) Score of **87.25 / 100** (*Grade A*).

---

## 🎯 Battle-Tested Answers to Tough Panel Questions

### Q1: "Why use Blockchain? Couldn't you just use a relational database with audit tables?"
> **Answer:** *"A database—even with audit tables—is controlled by the database administrator and can be secretly modified, truncated, or dropped. In contentious community disputes (such as property boundaries or barangay blotters), trust is paramount. By minting the resolution hash to the Ethereum Sepolia blockchain, we achieve decentralized mathematical immutability. No party—not even the server administrator—can rewrite history."*

### Q2: "What prevents a user from finding a tree picture on Google Images and uploading it?"
> **Answer:** *"Our verification pipeline employs two defensive layers: First, our perceptual hashing system identifies exact or modified duplicates from our database. Second, the mobile application enforces live camera capture and extracts EXIF metadata and GPS coordinates to verify that the photo was captured at the designated local venue within the active timeframe."*

### Q3: "Who pays for the Blockchain gas fees when a resident uses the app?"
> **Answer:** *"Our architecture uses a Gasless Sponsor Wallet Gateway on the backend. When an official resolves a report, the backend signs and broadcasts the transaction using the barangay's funded sponsor account. The resident never needs cryptocurrency, a web3 wallet, or gas money to benefit from blockchain immutability."*
