# 🛡️ Mission 17 & Barangay E-Services: STRIDE & DREAD Threat Model

<div align="center">

**Frameworks Applied:** Microsoft STRIDE • DREAD Risk Rating • OWASP Top 10 Security Architecture

</div>

---

## 🏗️ 1. Data Flow Diagrams (DFD) & Trust Boundaries

```
[ Trust Boundary 1: Untrusted Public Internet ]
           │
           ├────────► [ Resident Mobile App (Expo) ] ─────┐
           ├────────► [ Admin Web Portal (React) ]   ─────┼── (HTTPS / TLS 1.3)
           └────────► [ Public Barangay Website ]    ─────┘
                                                           │
[ Trust Boundary 2: Hardened API Gateway (DMZ) ]           ▼
           ┌───────────────────────────────────────────────────────────┐
           │ Express.js Gateway (Rate Limiter, Helmet, MongoSanitize)  │
           └─────────────────────────────┬─────────────────────────────┘
                                         │
[ Trust Boundary 3: Internal Microservices & Storage ]
           ├─────────────────────────────┼─────────────────────────────┐
           ▼                             ▼                             ▼
   [ Node.js Controllers ]     [ Python AI Service ]     [ MongoDB Atlas ]
   (JWT / Bcrypt / MFA)       (TensorFlow / pHash)      (AES-256 at Rest)
           │
[ Trust Boundary 4: Decentralized Consensus Layer ]
           ▼
   [ Ethereum Sepolia Blockchain (UUPS Proxy Smart Contract) ]
```

---

## 🎯 2. Comprehensive STRIDE Threat Matrix

| STRIDE Category | Component / Asset | Threat Description | Severity | Implemented Mitigation Strategy |
| :--- | :--- | :--- | :---: | :--- |
| **Spoofing** | Resident / Admin Login | Attacker impersonates a barangay official or steals citizen session credentials. | **High** | • **Bcrypt Hashing** with work factor 10.<br/>• **6-Digit MFA OTP** via Nodemailer.<br/>• **24-Hour JWT Lifespan** signed with secure HS256 secret. |
| **Spoofing** | Civic Proof Upload | Attacker submits fake or downloaded images to spoof task completion. | **Medium** | • **TensorFlow CNN** domain classification.<br/>• **EXIF Timestamp & Geolocation Validation** from live camera. |
| **Tampering** | API Request Payloads | Attacker injects malicious NoSQL operators (`$gt`, `$ne`) or XSS payloads. | **High** | • **`express-mongo-sanitize`** to strip query operators.<br/>• **`xss-clean`** sanitization on all string inputs. |
| **Tampering** | Blotter Resolution Records | Malicious official attempts to alter historical blotter resolutions. | **Critical** | • **Ethereum Sepolia Blockchain**: Resolution hashes are permanently written to smart contract event logs. |
| **Repudiation** | Dispute / Blotter Mediation | Resident denies filing a blotter or official denies resolving an issue. | **High** | • **Tamper-Evident `AuditLog`**: Captures `userId`, `action`, IP address, and timestamp.<br/>• **Blockchain Tx Hash** as non-repudiable legal receipt. |
| **Information Disclosure** | Environment & DB Secrets | Leakage of database connection strings or blockchain private keys. | **Critical** | • **Environment Isolation**: All secrets stored strictly in server-side `.env`.<br/>• **Client Key Isolation**: Mobile/web apps never receive private keys. |
| **Information Disclosure** | User Personal Data | Interception of citizen records over public Wi-Fi networks. | **High** | • **Enforced TLS 1.3 / HTTPS** for all API endpoints.<br/>• **AES-256 Clustered Encryption** on MongoDB Atlas. |
| **Denial of Service (DoS)** | AI Microservice | Attacker floods image prediction endpoint with massive image payloads. | **High** | • **5MB Upload File Size Cap**.<br/>• **Express Rate Limiting** (1000 req/min).<br/>• **Sequential Worker Queue** in Node.js backend. |
| **Elevation of Privilege** | Citizen Mobile App | Resident attempts to invoke admin endpoints (`/auth/approve-mission`). | **Critical** | • **Role-Based Access Control (RBAC)** middleware (`verifyAdmin`) validating JWT role claims before routing. |

---

## 📊 3. DREAD Risk Assessment & Scoring

The DREAD model assesses risk on a scale from 1 (Low) to 10 (Critical) across 5 metrics:
$$\text{Risk Score} = \frac{\text{Damage} + \text{Reproducibility} + \text{Exploitability} + \text{Affected Users} + \text{Discoverability}}{5}$$

| Threat Scenario | Damage | Reproducibility | Exploitability | Affected Users | Discoverability | Overall Score | Risk Level |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Unauthorized Blotter Alteration** | 9 | 2 | 2 | 8 | 3 | **4.8 / 10** | **Low (Mitigated via Blockchain)** |
| **NoSQL Database Injection** | 10 | 1 | 2 | 10 | 2 | **5.0 / 10** | **Low (Mitigated via Sanitizer)** |
| **Admin Privilege Escalation** | 9 | 1 | 2 | 10 | 2 | **4.8 / 10** | **Low (Mitigated via RBAC & JWT)** |
| **Recycled Photo Point Farming** | 4 | 2 | 2 | 3 | 4 | **3.0 / 10** | **Low (Mitigated via pHash)** |
| **API Denial of Service (DoS)** | 7 | 4 | 4 | 9 | 5 | **5.8 / 10** | **Medium (Mitigated via Rate Limits)** |

---

## 🤖 4. AI & Machine Learning Threat Model

1. **Adversarial Image Perturbation**:
   - *Threat*: Injecting imperceptible noise to fool the CNN classifier into labeling random items as trees or recycling.
   - *Mitigation*: Dual-stage confidence thresholding ($\ge 85\%$) combined with required admin queue confirmation for low-confidence or high-point tasks.
2. **Perceptual Hash Collision / Point Replay**:
   - *Threat*: Submitting re-cropped or resized versions of previously approved photos.
   - *Mitigation*: Difference hashing (pHash) with strict Hamming distance tolerance ($D_H \le 5$) detecting visual resemblance regardless of compression or scaling.

---

## ⛓️ 5. Blockchain & Smart Contract Threat Model

1. **Private Key Depletion / Compromise**:
   - *Threat*: Attacker accesses sponsor wallet private key and drains gas funds.
   - *Mitigation*: Backend-only key storage, minimal wallet funding (0.1 Sepolia ETH), and automated low-balance alerting.
2. **Replay & Frontrunning Attacks**:
   - *Threat*: Attacker re-submits a previously mined resolution transaction.
   - *Mitigation*: Ethereum nonce serialization and unique entity hash indexing in `Mission17Ledger.sol`.