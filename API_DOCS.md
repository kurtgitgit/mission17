# 📚 Mission 17 & Barangay E-Services: RESTful API Specification

<div align="center">

**Specification Version:** `2.0.0` • **Base URL:** `http://localhost:5001/api` • **Format:** `JSON / UTF-8`

</div>

---

## 📑 Table of Contents
1. [Global Conventions & Headers](#1-global-conventions--headers)
2. [Authentication & Session Management](#2-authentication--session-management)
3. [User & Role Administration](#3-user--role-administration)
4. [SDG Missions & Civic Tasks](#4-sdg-missions--civic-tasks)
5. [Proof Submissions & AI Verification](#5-proof-submissions--ai-verification)
6. [Blotter & Incident Reports (Blockchain Linked)](#6-blotter--incident-reports-blockchain-linked)
7. [Digital Document Requests](#7-digital-document-requests)
8. [Blockchain Sponsor Gateway](#8-blockchain-sponsor-gateway)
9. [Multilingual AI Chatbot](#9-multilingual-ai-chatbot)
10. [Announcements & Bulletin](#10-announcements--bulletin)
11. [Community Suggestions](#11-community-suggestions)
12. [Barangay Officials & Directory](#12-barangay-officials--directory)
13. [Events & Civic Gatherings](#13-events--civic-gatherings)
14. [Notifications & Broadcasts](#14-notifications--broadcasts)
15. [File Uploads & System Health](#15-file-uploads--system-health)
16. [Standard Error Codes](#16-standard-error-codes)

---

## 1. Global Conventions & Headers

### Request Headers
| Header | Type | Description |
| :--- | :--- | :--- |
| `Content-Type` | `string` | `application/json` (or `multipart/form-data` for file uploads) |
| `Authorization` | `string` | `Bearer <JWT_TOKEN>` (for protected citizen/admin routes) |
| `auth-token` | `string` | Optional legacy bearer header alternative |

### Standard Response Envelope
```json
{
  "status": "success",
  "data": { ... },
  "message": "Operation completed successfully"
}
```

---

## 2. Authentication & Session Management

### `POST /auth/signup`
Registers a new resident/citizen account.

* **Headers:** `Content-Type: application/json`
* **Request Body:**
```json
{
  "username": "kurtperez",
  "email": "kurt@example.com",
  "password": "SecurePassword123!",
  "fullName": "Kurt Perez",
  "phoneNumber": "+639123456789",
  "address": "Zone 4, Bagong Pag-asa"
}
```
* **Success Response (`201 Created`):**
```json
{
  "status": "success",
  "message": "User registered successfully. Please verify your email.",
  "userId": "66bc89f1d0a1b2c3d4e5f678"
}
```

---

### `POST /auth/login`
Authenticates a user and initiates session or MFA challenge.

* **Request Body:**
```json
{
  "email": "kurt@example.com",
  "password": "SecurePassword123!",
  "isAdminLogin": false
}
```
* **Success Response (`200 OK` - Direct Login):**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "66bc89f1d0a1b2c3d4e5f678",
    "username": "kurtperez",
    "email": "kurt@example.com",
    "role": "resident",
    "points": 250
  }
}
```
* **MFA Challenge Response (`202 Accepted`):**
```json
{
  "status": "mfa_required",
  "mfaRequired": true,
  "userId": "66bc89f1d0a1b2c3d4e5f678",
  "message": "A 6-digit OTP has been sent to your registered email."
}
```

---

### `POST /auth/verify-otp`
Validates the One-Time Password sent via Nodemailer.

* **Request Body:**
```json
{
  "userId": "66bc89f1d0a1b2c3d4e5f678",
  "otp": "849201"
}
```
* **Success Response (`200 OK`):**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "66bc89f1d0a1b2c3d4e5f678",
    "username": "kurtperez",
    "role": "admin"
  }
}
```

---

### `GET /auth/me`
Retrieves current authenticated profile from JWT token.

* **Headers:** `Authorization: Bearer <TOKEN>`
* **Success Response (`200 OK`):**
```json
{
  "user": {
    "_id": "66bc89f1d0a1b2c3d4e5f678",
    "username": "kurtperez",
    "email": "kurt@example.com",
    "points": 350,
    "role": "resident",
    "completedMissions": ["66bc901a..."]
  }
}
```

---

### `GET /auth/audit-logs` *(Admin Only)*
Retrieves chronological tamper-evident security audit logs.

* **Headers:** `Authorization: Bearer <ADMIN_TOKEN>`
* **Query Params:** `page=1&limit=50&action=LOGIN`
* **Success Response (`200 OK`):**
```json
[
  {
    "_id": "66bc9922a1b2c3d4e5f67890",
    "userId": "66bc89f1d0a1b2c3d4e5f678",
    "action": "USER_LOGIN_SUCCESS",
    "ipAddress": "192.168.1.15",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "timestamp": "2026-08-28T06:15:00.000Z"
  }
]
```

---

## 3. User & Role Administration

### `GET /auth/users` *(Admin Only)*
Fetches all registered users with pagination.
* **Headers:** `Authorization: Bearer <ADMIN_TOKEN>`
* **Response (`200 OK`):** Array of user documents without password hashes.

### `PATCH /auth/users/role/:id` *(SuperAdmin Only)*
Updates a user's role (`resident`, `official`, `admin`).
* **Request Body:** `{ "role": "official" }`

---

## 4. SDG Missions & Civic Tasks

### `GET /auth/missions`
Retrieves all active community missions.

* **Headers:** `Authorization: Bearer <TOKEN>`
* **Success Response (`200 OK`):**
```json
[
  {
    "_id": "66bc9a00b1c2d3e4f5a6b7c8",
    "title": "Community Tree Planting Drive",
    "description": "Plant a native tree in designated green zones and submit photo evidence.",
    "sdgNumber": 15,
    "sdgCategory": "Life on Land",
    "pointsReward": 100,
    "targetClass": "tree",
    "deadline": "2026-12-31T23:59:59.000Z"
  }
]
```

---

## 5. Proof Submissions & AI Verification

### `POST /auth/submit-mission`
Submits photo evidence for automated AI verification and admin approval.

* **Headers:** `Authorization: Bearer <TOKEN>`, `Content-Type: application/json`
* **Request Body:**
```json
{
  "userId": "66bc89f1d0a1b2c3d4e5f678",
  "missionId": "66bc9a00b1c2d3e4f5a6b7c8",
  "missionTitle": "Community Tree Planting Drive",
  "image": "https://res.cloudinary.com/mission17/image/upload/v12345/proof.jpg",
  "latitude": 16.035,
  "longitude": 120.442
}
```
* **Success Response (`201 Created`):**
```json
{
  "status": "success",
  "submission": {
    "_id": "66bc9b11c2d3e4f5a6b7c8d9",
    "status": "pending",
    "aiVerdict": "valid",
    "aiConfidence": 0.942,
    "perceptualHash": "d8e3f01b92a4c567",
    "pointsAwarded": 100
  }
}
```

---

### `POST /auth/approve-mission` *(Admin Only)*
Manually verifies or approves an AI-evaluated submission and mints on-chain rewards.

* **Request Body:** `{ "submissionId": "66bc9b11c2d3e4f5a6b7c8d9" }`
* **Success Response (`200 OK`):**
```json
{
  "status": "approved",
  "transactionHash": "0x4a8c9b0e1f2a3d4e5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a",
  "pointsAdded": 100
}
```

---

## 6. Blotter & Incident Reports (Blockchain Linked)

### `POST /blotter-reports/submit`
Submits an official incident/blotter report.

* **Request Body:**
```json
{
  "incidentType": "Noise Disturbance / Ordinance Violation",
  "narrative": "Excessive noise along Purok 3 past 11:00 PM.",
  "location": "Purok 3, Barangay Bagong Pag-asa",
  "evidenceImageUrl": "https://res.cloudinary.com/.../evidence.jpg",
  "isAnonymous": false
}
```

---

### `PATCH /blotter-reports/resolve/:id` *(Official/Admin Only)*
Resolves a blotter report and writes the immutable resolution fingerprint to Ethereum Sepolia.

* **Request Body:**
```json
{
  "resolutionSummary": "Mediation conducted at Barangay Hall; both parties reached amicable settlement.",
  "presidingOfficer": "Punong Barangay Juan Dela Cruz"
}
```
* **Success Response (`200 OK`):**
```json
{
  "status": "resolved",
  "reportId": "66bca123c4d5e6f7a8b9c0d1",
  "blockchainTxHash": "0x91f3a2b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2",
  "blockNumber": 6512403,
  "timestamp": "2026-08-28T06:30:00.000Z"
}
```

---

## 7. Digital Document Requests

### `POST /document-requests/submit`
Requests an official certificate or clearance.

* **Request Body:**
```json
{
  "documentType": "Barangay Clearance",
  "purpose": "Local Employment Requirements",
  "deliveryMode": "Pick-up",
  "attachedValidIdUrl": "https://res.cloudinary.com/.../id.jpg"
}
```

### `PATCH /document-requests/update-status/:id` *(Admin Only)*
Updates the fulfillment lifecycle (`pending` ➔ `processing` ➔ `ready_for_pickup` ➔ `released`).

---

## 8. Blockchain Sponsor Gateway

### `POST /blockchain/record`
Backend proxy that executes a gasless smart contract transaction on behalf of a resident action.

* **Request Body:**
```json
{
  "eventType": "BLOTTER_RESOLUTION",
  "entityId": "66bca123c4d5e6f7a8b9c0d1",
  "dataHash": "0x7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e"
}
```
* **Success Response (`200 OK`):**
```json
{
  "status": "success",
  "txHash": "0x91f3a2b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2",
  "network": "Ethereum Sepolia",
  "gasUsed": "28450"
}
```

---

## 9. Multilingual AI Chatbot

### `POST /chatbot/message`
Sends a user query to the Groq-accelerated LLaMA 3 engine.

* **Request Body:**
```json
{
  "message": "Kasanok nga agkiddaw ti Barangay Clearance?",
  "language": "Ilocano",
  "conversationHistory": []
}
```
* **Success Response (`200 OK`):**
```json
{
  "response": "Tapno maka-request ti Barangay Clearance: 1. Ag-login iti mobile app. 2. Pinduten ti 'Document Requests'. 3. Pilien ti 'Barangay Clearance' ken i-upload ti valid ID.",
  "languageDetected": "Ilocano",
  "latencyMs": 420
}
```

---

## 10. Announcements & Bulletin

* `GET /announcements`: List all published barangay notices.
* `POST /announcements/create` *(Admin)*: Create new announcement.
* `DELETE /announcements/delete/:id` *(Admin)*: Remove an announcement.

---

## 11. Community Suggestions

* `GET /suggestions`: Retrieve community suggestions.
* `POST /suggestions/submit`: Submit civic idea (supports anonymous mode).
* `PATCH /suggestions/status/:id`: Update status (`under_review`, `approved`, `implemented`).

---

## 12. Barangay Officials & Directory

* `GET /officials`: Retrieve current barangay administration directory.
* `POST /officials/create` *(Admin)*: Add an official profile.

---

## 13. Events & Civic Gatherings

* `GET /auth/events`: List scheduled community events.
* `POST /auth/events/rsvp`: RSVP for tree planting or cleanups to earn bonus SDG points.

---

## 14. Notifications & Broadcasts

* `GET /auth/notifications`: Fetch user-specific notifications.
* `PATCH /auth/notifications/:id/read`: Mark an alert as read.

---

## 15. File Uploads & System Health

### `GET /health`
* **Response (`200 OK`):** `{"status": "OK", "message": "Server is responsive"}`

### `POST /auth/upload`
Uploads an image asset to Cloudinary CDN storage.
* **Form-Data:** `image: <FILE_BINARY>`
* **Response (`200 OK`):** `{"url": "https://res.cloudinary.com/..."}`

---

## 16. Standard Error Codes

| HTTP Status | Error Code | Description / Remedy |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_FAILED` | Missing or malformed JSON fields. Verify schema. |
| `401 Unauthorized` | `INVALID_TOKEN` | Missing or expired JWT. Re-authenticate via `/login`. |
| `403 Forbidden` | `FORBIDDEN_RESOURCE` | Insufficient RBAC privileges (e.g. resident attempting admin action). |
| `404 Not Found` | `RESOURCE_NOT_FOUND` | Document, user, or route not found. |
| `429 Too Many Requests` | `RATE_LIMIT_EXCEEDED` | Exceeded 1000 requests/minute. Back off and retry. |
| `500 Server Error` | `INTERNAL_SERVER_ERROR` | Unhandled backend exception. Check server logs. |