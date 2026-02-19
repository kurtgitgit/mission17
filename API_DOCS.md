# Mission 17: API Documentation
This API handles authentication, mission management, and security auditing for the Mission 17 platform [cite: 2026-02-18]. All endpoints return JSON and require a Content-Type: application/json header [cite: 2026-02-18].

## 1. Base Configuration
Base URL: http://localhost:5001/api [cite: 2026-02-18]

Authentication: Most routes require a Bearer Token in the Authorization header [cite: 2026-02-18].

## 2. Authentication Endpoints
### POST /auth/signup
Registers a new student user [cite: 2026-02-18].

Body: { "username": "string", "email": "string", "password": "8+ chars" } [cite: 2026-02-18]

Validation: Checks for existing email and enforces password complexity [cite: 2026-01-23, 2026-02-18].

### POST /auth/login
Initial login check. If MFA is enabled, it returns a 202 status [cite: 2026-02-18].

Body: { "email": "string", "password": "string", "isAdminLogin": boolean } [cite: 2026-02-18]

MFA Response: { "mfaRequired": true, "userId": "string" } [cite: 2026-02-18]

### POST /auth/verify-otp
Validates the 6-digit code sent via email [cite: 2026-02-18].

Body: { "userId": "string", "otp": "string" } [cite: 2026-02-18]

Success: Returns JWT token and user profile [cite: 2026-02-18].

## 3. Security & Audit Endpoints (Admins Only)
### GET /auth/audit-logs
Fetches a chronological feed of all system security events [cite: 2026-02-18].

Header: Authorization: Bearer <ADMIN_TOKEN> [cite: 2026-02-18]

Response: An array of objects containing action, username, timestamp, and ipAddress [cite: 2026-02-18].

## 4. Mission Management
### POST /auth/submit-mission
Allows students to upload mission proof [cite: 2026-02-18].

Body: { "userId": "ID", "missionId": "ID", "missionTitle": "string", "image": "base64/uri" } [cite: 2026-02-18]

Validation: Enforced via Mongoose Submission schema [cite: 2026-01-23, 2026-02-18].

### POST /auth/approve-mission
Admins verify a mission and trigger a simulated blockchain transaction hash [cite: 2026-02-18].

Body: { "submissionId": "string" } [cite: 2026-02-18]

Logic: Awards 100 points to the student upon success [cite: 2026-02-18].