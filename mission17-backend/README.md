# 🛡️ Mission 17 Backend: RESTful API Gateway & Services

<div align="center">

**Runtime:** Node.js (v18+) • **Framework:** Express.js • **Database:** MongoDB Atlas • **Consensus:** Ethereum Sepolia

</div>

---

## 📌 Overview
The `mission17-backend` serves as the centralized API gateway, business logic orchestrator, and security enforcement layer for the Mission 17 ecosystem. It coordinates multi-factor authentication, blotter management, document processing, AI verification queues, and gasless smart contract transactions.

---

## 🛠️ Architecture & Core Modules

```bash
mission17-backend/
├── routes/               # 13 REST API Endpoint Handlers
│   ├── auth.js           # Authentication, MFA OTP, password recovery
│   ├── submissions.js    # SDG mission proof submission & approval
│   ├── blotter-reports.js# Incident filing & blockchain resolution
│   ├── document-requests.js # Clearance & certificate workflows
│   ├── blockchain.js     # Gasless sponsor transaction gateway
│   ├── chatbot.js        # Groq LLaMA 3 multilingual assistant
│   └── ...               # Announcements, Officials, Events, Notifications
│
├── controllers/          # Business logic and database operations
├── models/               # Mongoose Schemas with compound indexing
├── contracts/            # Solidity smart contracts (UUPS proxy pattern)
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
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_google_app_password
GROQ_API_KEY=gsk_your_groq_api_key
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key
ADMIN_PRIVATE_KEY=0x_your_sponsor_wallet_private_key
CONTRACT_ADDRESS=0x_deployed_contract_address
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

# Benchmark smart contract gas costs
node gas-perf-test.js
```
