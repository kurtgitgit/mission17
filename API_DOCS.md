# 📚 Barangay Bagong Pag-asa E-Services (BrgyLink): RESTful API Specification

<div align="center">

**Specification Version:** `2.0.0` • **Base URL:** `http://localhost:5001/api` • **Format:** `JSON / UTF-8`

</div>

---

## 📑 Table of Contents
1. [Global Conventions & Headers](#1-global-conventions--headers)
2. [Authentication & Session Management](#2-authentication--session-management)
3. [User & Role Administration](#3-user--role-administration)
4. [Community Civic Programs (SDGs)](#4-community-civic-programs-sdgs)
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
    "role": "resident"
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

---

### `GET /auth/me`
Retrieves current authenticated citizen profile.

* **Headers:** `Authorization: Bearer <TOKEN>`
* **Success Response (`200 OK`):**
```json
{
  "user": {
    "_id": "66bc89f1d0a1b2c3d4e5f678",
    "username": "kurtperez",
    "email": "kurt@example.com",
    "fullName": "Kurt Perez",
    "role": "resident"
  }
}
```

---

### `GET /auth/audit-logs` *(Admin Only)*
Retrieves chronological tamper-evident security audit logs.

* **Headers:** `Authorization: Bearer <ADMIN_TOKEN>`
* **Query Params:** `page=1&limit=50`

---

## 3. User & Role Administration

* `GET /auth/users`: List registered citizens (Admin only).
* `PATCH /auth/users/role/:id`: Update role (`resident`, `official`, `admin`) (SuperAdmin only).

---

## 4. Community Civic Programs (SDGs)

### `GET /auth/missions`
Retrieves all active community civic initiatives.

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
    "targetClass": "tree",
    "deadline": "2026-12-31T23:59:59.000Z"
  }
]
```

---

## 5. Proof Submissions & AI Verification

### `POST /auth/submit-mission`
Submits photo evidence for automated AI verification.

* **Request Body:**
```json
{
  "userId": "66bc89f1d0a1b2c3d4e5f678",
  "missionId": "66bc9a00b1c2d3e4f5a6b7c8",
  "missionTitle": "Community Tree Planting Drive",
  "image": "https://res.cloudinary.com/mission17/image/upload/v12345/proof.jpg"
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
    "perceptualHash": "d8e3f01b92a4c567"
  }
}
```

---

### `POST /auth/approve-mission` *(Admin Only)*
Formally verifies a submission.

* **Request Body:** `{ "submissionId": "66bc9b11c2d3e4f5a6b7c8d9" }`

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
Resolves a blotter report and anchors the resolution hash to Ethereum Sepolia.

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
Backend proxy that executes a gasless smart contract transaction on behalf of an official blotter resolution.

* **Request Body:**
```json
{
  "eventType": "BLOTTER_RESOLUTION",
  "entityId": "66bca123c4d5e6f7a8b9c0d1",
  "dataHash": "0x7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e"
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

---

## 10. Announcements & Bulletin
* `GET /announcements`: List all published notices.
* `POST /announcements/create` *(Admin)*: Create announcement.
* `DELETE /announcements/delete/:id` *(Admin)*: Remove announcement.

---

## 11. Community Suggestions
* `GET /suggestions`: Retrieve suggestions.
* `POST /suggestions/submit`: Submit idea (supports anonymous mode).
* `PATCH /suggestions/status/:id`: Update status (`under_review`, `approved`, `implemented`).

---

## 12. Barangay Officials Directory
* `GET /officials`: Retrieve current administration directory.
* `POST /officials/create` *(Admin)*: Add official profile.

---

## 13. Events & Calendar
* `GET /auth/events`: List community assemblies and cleanup schedules.

---

## 14. Notifications & Broadcasts
* `GET /auth/notifications`: Fetch user-specific alerts.
* `PATCH /auth/notifications/:id/read`: Mark alert as read.

---

## 15. File Uploads & System Health
* `GET /health`: Health check (`{"status": "OK"}`).
* `POST /auth/upload`: Upload image to Cloudinary CDN (`{"url": "..."}`).

---

## 16. Standard Error Codes
| HTTP Status | Error Code | Description / Remedy |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_FAILED` | Missing or malformed JSON fields. |
| `401 Unauthorized` | `INVALID_TOKEN` | Missing or expired JWT. |
| `403 Forbidden` | `FORBIDDEN_RESOURCE` | Insufficient RBAC privileges. |
| `404 Not Found` | `RESOURCE_NOT_FOUND` | Document or route not found. |
| `429 Too Many Requests` | `RATE_LIMIT_EXCEEDED` | Exceeded rate limit. |
| `500 Server Error` | `INTERNAL_SERVER_ERROR` | Unhandled backend exception. |