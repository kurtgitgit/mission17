# 🛡️ Mission 17 & Barangay E-Services: Security Architecture & Policies

<div align="center">

**Document Version:** `2.0.0` • **Security Classification:** `Confidential / Technical Manuscript`

</div>

---

## 📌 1. Security Philosophy & Defense-in-Depth

The **Mission 17 & Barangay Bagong Pag-asa E-Services Platform** adopts a **Defense-in-Depth (DiD)** strategy. Security controls are enforced across every tier: client application, API gateway, application runtime, AI inference microservice, database store, and blockchain consensus layer.

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
* **Algorithm**: **Bcrypt** with adaptive work factor (`saltRounds = 10`).
* **Implementation**: Plaintext passwords are never stored in memory or written to disk. Bcrypt's salt generation automatically prevents precomputed rainbow table attacks.

### 2.2 JWT (JSON Web Token) Lifecycle
* **Signing Algorithm**: HMAC-SHA256 (`HS256`) signed with a cryptographically secure 256-bit entropy secret (`JWT_SECRET`).
* **Expiration**: Tokens are strictly limited to a **24-hour lifespan**.
* **Stateless Verification**: The backend validates signature integrity, issuer claims, and expiration timestamps on every protected request.

### 2.3 Multi-Factor Authentication (MFA / 2FA)
* **Delivery Mechanism**: Time-based 6-digit One-Time Password (OTP) dispatched via encrypted SMTP (`nodemailer`).
* **OTP Expiration**: OTP tokens expire after **5 minutes**.
* **Brute-Force Throttle**: Maximum of 3 incorrect OTP attempts before the code is invalidated, requiring a re-authentication trigger.

---

## 👥 3. Role-Based Access Control (RBAC) Matrix

Access permissions are enforced strictly via custom Express middleware (`authMiddleware.js` and `verifyAdmin.js`):

| Capability / Route Module | Resident / Citizen | Barangay Official | System Administrator |
| :--- | :---: | :---: | :---: |
| **Browse Bulletins & Officials** | ✅ Read | ✅ Read | ✅ Read |
| **Request Barangay Documents** | ✅ Submit / Track | 🔄 Process / Issue | 🔄 Manage All |
| **Submit Blotter Reports** | ✅ Submit Own | 👁️ Review / Mediate | 👁️ Full Access |
| **Resolve Blotter & Anchor On-Chain** | ❌ Denied | ✅ Sign Resolution | ✅ Sign Resolution |
| **Submit SDG Civic Proofs** | ✅ Submit Proof | ❌ N/A | ❌ N/A |
| **Approve / Reject SDG Proofs** | ❌ Denied | ✅ Review Queue | ✅ Full Override |
| **Access Tamper-Evident Audit Logs** | ❌ Denied | ❌ Denied | ✅ Full Read |
| **User Role & Status Administration** | ❌ Denied | ❌ Denied | ✅ Full CRUD |

---

## 🔒 4. Cryptographic Standards & Data Protection

### 4.1 Data at Rest (Database Encryption)
* The MongoDB Atlas clustered storage engine enforces transparent data encryption using **AES-256** (FIPS 140-2 compliant).
* Database backups, automated point-in-time snapshots, and underlying volume logs are encrypted by default.

### 4.2 Data in Transit (Network Encryption)
* All external communication between mobile clients, web dashboards, and backend services requires **TLS 1.3 / HTTPS**.
* Plain HTTP requests are rejected or redirected to secure HTTPS listeners.

### 4.3 Blockchain Private Key Isolation
* The **Sponsor Wallet Private Key** (`SPONSOR_PRIVATE_KEY`) is stored strictly in server-side environment variables on the backend.
* Mobile and web clients communicate with the backend proxy endpoint (`/api/blockchain/record`) and never have direct access to private keys or signing capabilities.

---

## 🛡️ 5. API Gateway Hardening & OWASP Top 10 Mitigations

### 5.1 HTTP Header Hardening (Helmet)
* Configures secure HTTP headers including `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and restrictive Content Security Policies (CSP).

### 5.2 NoSQL Injection Sanitization
* Integrated `express-mongo-sanitize` intercepts incoming request payloads (`req.body`, `req.query`, `req.params`) and strips prohibited MongoDB operators (such as `$gt`, `$ne`, `$where`).

### 5.3 Cross-Site Scripting (XSS) Scrubbing
* Integrated `xss-clean` middleware scans and cleans all incoming strings to neutralize malicious `<script>` tags and HTML entities.

### 5.4 Rate Limiting & DoS Prevention
* Express Rate Limiting restricts traffic to **1,000 requests per minute per IP address**, preventing Denial-of-Service (DoS) and automated brute-force attacks.

---

## 🤖 6. AI Microservice & File Upload Security

1. **File Type Whitelisting**: The upload middleware strictly permits image MIME types (`image/jpeg`, `image/png`, `image/webp`). Executable binaries (`.exe`, `.sh`, `.php`, `.js`) are rejected before disk buffering.
2. **Payload Size Caps**: Multipart form-data uploads are strictly capped at **5MB per file** to prevent buffer overflow and server memory exhaustion.
3. **Isolated Cloudinary Storage**: Uploaded proofs are stored on Cloudinary CDN with immutable URLs, isolating user media from the primary application server disk.

---

## 📜 7. Tamper-Evident Security Audit Logs

Every sensitive operation generates a non-repudiable log entry stored in the `AuditLog` collection:
* **Recorded Parameters**: `userId`, `action` (e.g., `LOGIN_SUCCESS`, `BLOTTER_RESOLVED`, `ROLE_UPDATED`), `ipAddress`, `userAgent`, and `timestamp`.
* **Access Restricted**: Only authorized System Administrators can query audit logs through `/api/auth/audit-logs`.

---

## 🚨 8. Vulnerability Disclosure & Incident Reporting

If you identify a potential security vulnerability within the Mission 17 ecosystem, please report it directly:
* **Lead Architect**: Kurt Perez
* **Security Contact**: `mission17.security@gmail.com`
* **Response SLA**: Vulnerability reports are triaged within **24 hours**, with patch releases prioritized according to CVSS severity scores.