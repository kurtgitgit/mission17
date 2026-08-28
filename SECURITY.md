# 🛡️ Barangay Bagong Pag-asa E-Services (BrgyLink): Security Architecture

<div align="center">

**Document Version:** `2.0.0` • **Security Classification:** `Confidential / Technical Manuscript`

</div>

---

## 📌 1. Security Philosophy & Defense-in-Depth

The **Barangay Bagong Pag-asa E-Services Platform (BrgyLink)** adopts a **Defense-in-Depth (DiD)** strategy across all system layers:

```
+-------------------------------------------------------------------------+
| Layer 1: Client Hardening (Expo Keystore, React Native Secure Storage)  |
+-------------------------------------------------------------------------+
| Layer 2: Network & Edge Security (TLS 1.3, Rate Limiting, Helmet HTTP)  |
+-------------------------------------------------------------------------+
| Layer 3: Application Security (Bcrypt, JWT, MFA OTP, MongoSanitize, XSS)|
+-------------------------------------------------------------------------+
| Layer 4: Storage Encryption (AES-256 at Rest on MongoDB Atlas)          |
+-------------------------------------------------------------------------+
| Layer 5: Blockchain Immutability (Ethereum Sepolia Cryptographic Proof) |
+-------------------------------------------------------------------------+
```

---

## 🔐 2. Authentication & Session Management

### 2.1 Password Hashing & Storage
* **Algorithm**: **Bcrypt** with adaptive work factor (`saltRounds = 10`). Plaintext passwords are never stored.

### 2.2 JWT (JSON Web Token) Lifecycle
* **Signing Algorithm**: HMAC-SHA256 (`HS256`) signed with a cryptographically secure 256-bit entropy secret (`JWT_SECRET`).
* **Expiration**: Tokens are strictly limited to a **24-hour lifespan**.

### 2.3 Multi-Factor Authentication (MFA / 2FA)
* **Delivery Mechanism**: Time-based 6-digit One-Time Password (OTP) dispatched via encrypted SMTP (`nodemailer`).
* **OTP Expiration**: OTP tokens expire after **5 minutes**.
* **Brute-Force Throttle**: Maximum of 3 incorrect OTP attempts before code invalidation.

---

## 👥 3. Role-Based Access Control (RBAC) Matrix

| Capability / Route Module | Resident / Citizen | Barangay Official | System Administrator |
| :--- | :---: | :---: | :---: |
| **Browse Bulletins & Officials** | ✅ Read | ✅ Read | ✅ Read |
| **Request Barangay Documents** | ✅ Submit / Track | 🔄 Process / Issue | 🔄 Manage All |
| **Submit Blotter Reports** | ✅ Submit Own | 👁️ Review / Mediate | 👁️ Full Access |
| **Resolve Blotter & Anchor On-Chain** | ❌ Denied | ✅ Sign Resolution | ✅ Sign Resolution |
| **Submit Civic Program Proofs** | ✅ Submit Proof | ❌ N/A | ❌ N/A |
| **Approve / Reject Civic Proofs** | ❌ Denied | ✅ Review Queue | ✅ Full Override |
| **Access Tamper-Evident Audit Logs** | ❌ Denied | ❌ Denied | ✅ Full Read |
| **User Role Administration** | ❌ Denied | ❌ Denied | ✅ Full CRUD |

---

## 🔒 4. Cryptographic Standards & Data Protection

### 4.1 Data at Rest (Database Encryption)
* The MongoDB Atlas clustered storage engine enforces transparent data encryption using **AES-256**.

### 4.2 Data in Transit (Network Encryption)
* All communication requires **TLS 1.3 / HTTPS**.

### 4.3 Blockchain Private Key Isolation
* The **Sponsor Wallet Private Key** (`ADMIN_PRIVATE_KEY`) is stored strictly in server-side environment variables on the backend. Mobile and web clients never have access to private keys.

---

## 🛡️ 5. API Gateway Hardening & OWASP Top 10 Mitigations

* **Helmet HTTP Headers**: Enforces `X-Content-Type-Options: nosniff` and restrictive CSP.
* **NoSQL Injection Sanitization**: `express-mongo-sanitize` strips prohibited MongoDB operators (`$gt`, `$ne`).
* **Cross-Site Scripting (XSS) Scrubbing**: `xss-clean` middleware scans and cleans all incoming strings.
* **Rate Limiting**: Enforces **1,000 requests per minute per IP address**.