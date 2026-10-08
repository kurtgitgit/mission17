# 🛡️ Mission 17 Backend: RESTful API Gateway & Services

<div align="center">

**Runtime:** Node.js (v18+) • **Framework:** Express.js • **Database:** MongoDB Atlas • **Consensus:** Ethereum Sepolia

</div>

---

## 📌 Overview
The `mission17-backend` serves as the centralized API gateway, business logic orchestrator, and security enforcement layer for the Mission 17 ecosystem. It coordinates resident authentication, blotter management, document processing, BrgyLink AI guidance, notifications, and blockchain audit references for resolved blotters.

Signup email verification is delivered through Gmail API OAuth (`EMAIL_USER`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REFRESH_TOKEN`); the backend does not use a Gmail SMTP app-password flow.

---

## 🛠️ Architecture & Core Modules

```bash
mission17-backend/
├── routes/               # 13 REST API Endpoint Handlers
│   ├── auth.js           # Authentication, MFA OTP, password recovery
│   ├── blotter-reports.js# Incident filing & privacy-safe resolution ledger
│   ├── document-requests.js # Clearance & certificate workflows
│   ├── blockchain.js     # Retired direct-write route (server workflow only)
│   ├── chatbot.js        # BrgyLink multilingual guidance proxy and safe fallback
│   └── ...               # Announcements, Officials, Notifications
│
├── controllers/          # Business logic and database operations
├── models/               # Mongoose Schemas with compound indexing
├── contracts/            # Solidity contracts (resolution integrity ledger)
├── config/               # Security, nodemailer, and database configuration
└── utils/                # Auth middleware, multer upload, audit logging
```

---

## ⚡ Quickstart & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in this directory:
```env
PORT=5001
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/mission17
JWT_SECRET=your_64_character_hex_secret
FIREBASE_WEB_API_KEY=your_firebase_web_api_key
EMAIL_USER=your_gmail_sender@gmail.com
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REFRESH_TOKEN=your_google_oauth_refresh_token
AI_SERVER_URL=https://<your-hugging-face-space>.hf.space/predict
AI_SERVICE_TOKEN=<shared-ai-service-token>
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key
ADMIN_PRIVATE_KEY=0x_authorized_resolution_ledger_wallet_private_key
BRGYLINK_RESOLUTION_LEDGER_ADDRESS=0x_deployed_resolution_ledger_address
AI_SERVER_URL=http://localhost:7860
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Launch Development Server
```bash
npm run dev
# Server listens on http://localhost:5001
```

---

## 🧪 Testing & Verification
```bash
# Run test suite
npm test

# Resolution-ledger payload and privacy tests
npm test -- --runInBand utils/blockchain.test.js
```
