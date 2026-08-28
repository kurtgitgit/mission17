# 🛡️ Barangay Bagong Pag-asa E-Services (BrgyLink): STRIDE & DREAD Threat Model

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
| **Spoofing** | Resident / Admin Login | Attacker impersonates an official or steals citizen credentials. | **High** | • **Bcrypt Hashing** with work factor 10.<br/>• **6-Digit MFA OTP** via Nodemailer.<br/>• **24-Hour JWT Lifespan**. |
| **Spoofing** | Civic Proof Upload | Attacker submits fake or downloaded images. | **Medium** | • **TensorFlow CNN** domain classification.<br/>• **EXIF Metadata Validation** from camera. |
| **Tampering** | API Request Payloads | Attacker injects malicious NoSQL operators (`$gt`, `$ne`) or XSS. | **High** | • **`express-mongo-sanitize`** to strip query operators.<br/>• **`xss-clean`** sanitization. |
| **Tampering** | Blotter Resolution Records | Malicious official attempts to alter historical blotter resolutions. | **Critical** | • **Ethereum Sepolia Blockchain**: Resolution hashes are permanently anchored in smart contract logs. |
| **Repudiation** | Dispute / Blotter Mediation | Resident denies filing a blotter or official denies resolving an issue. | **High** | • **Tamper-Evident `AuditLog`**: Captures `userId`, `action`, IP address, and timestamp.<br/>• **Blockchain Tx Hash** as non-repudiable legal receipt. |
| **Information Disclosure** | Environment & DB Secrets | Leakage of database connection strings or blockchain private keys. | **Critical** | • **Environment Isolation**: Secrets stored strictly in server-side `.env`.<br/>• **Client Key Isolation**: Clients never receive private keys. |
| **Denial of Service (DoS)** | AI Microservice | Attacker floods image prediction endpoint with large files. | **High** | • **5MB Upload File Size Cap**.<br/>• **Express Rate Limiting** (1000 req/min).<br/>• **Sequential Worker Queue**. |
| **Elevation of Privilege** | Citizen Mobile App | Resident attempts to invoke admin endpoints (`/auth/approve-mission`). | **Critical** | • **Role-Based Access Control (RBAC)** middleware (`verifyAdmin`) validating JWT role claims. |