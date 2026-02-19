# 🛡️ Mission 17 Threat Model & Security Analysis

## 1. System Architecture (Data Flow)
**User (Mobile App)** ➡ [HTTPS/TLS] ➡ **API Gateway (Rate Limiter)** ➡ **Node.js Backend** ➡ **MongoDB Atlas**
                                          ⬇
                                    **AI Service (Python)**

## 2. STRIDE Threat Analysis
| Threat Category | Potential Risk | Mitigation Strategy (Implemented) |
| :--- | :--- | :--- |
| **S**poofing | Attacker impersonating a user. | **JWT Authentication:** Every request requires a valid, signed token. |
| **T**ampering | Modifying mission points or images. | **Input Validation:** Backend sanitizes all inputs. **Hash Verification:** Images are processed directly by AI. |
| **R**epudiation | User denying they uploaded a fake image. | **Audit Logging:** Database records timestamp and user ID for every submission. |
| **I**nformation Disclosure | Leaking passwords or DB credentials. | **Bcrypt Hashing:** Passwords are never stored as plain text. **.env:** Secrets are isolated from code. |
| **D**enial of Service | Crashing the server with spam. | **Rate Limiting:** API limits requests to 100 per 15 minutes per IP. |
| **E**levation of Privilege | Normal user accessing Admin features. | **Role-Based Access Control (RBAC):** Middleware checks for `isAdmin` flag on sensitive routes. |

## 3. OWASP Top 10 Protections
1.  **Injection:** Prevented using Mongoose sanitization (NoSQL) and parameterized queries.
2.  **Broken Auth:** Rate limiting on login endpoints prevents brute force.
3.  **Sensitive Data Exposure:** All connections use TLS; Passwords are hashed.
4.  **XSS (Cross-Site Scripting):** `helmet` and `xss-clean` middleware sanitize headers and body.