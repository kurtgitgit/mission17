# 🏛️ Barangay Pantal E-Services & Mission 17 Portal

**Barangay Pantal E-Services** is a comprehensive digital governance platform combined with **Mission 17**, an AI & Blockchain-powered app designed to gamify sustainable actions (SDGs). 

The platform features a modern, "Human-Designed" mobile app for residents (inspired by the eGovPH system) and a powerful web-based Admin Portal for barangay officials to manage community reports and services.

---

## 🚀 Key Features

### 🏛️ Barangay E-Services
* **📝 Blotter Reports (Blockchain Enabled):** Residents submit incident reports. Admins resolve them, and the resolution event is immutably recorded on the **Ethereum Blockchain (Sepolia Testnet)** using a Gasless Sponsor Wallet.
* **📄 Document Requests:** Streamlined requesting for barangay clearances and certificates with status tracking.
* **💡 Community Suggestions:** Anonymous or public suggestion box for community improvement.
* **📢 Announcements:** Real-time updates and pinned announcements from barangay officials.
* **🤖 Smart Chatbot:** AI-powered digital assistant (using **Groq** for blazing-fast responses) to help residents navigate services.

### 🌍 Mission 17 (SDG Gamification)
* **📸 AI Verification:** Uses a custom Computer Vision model (CNN) hosted on Hugging Face to verify photo evidence of civic duties like "Tree Planting" (SDG 13/15) and "Recycling" (SDG 12).
* **🛡️ Anti-Cheat System:** Duplicate image detection ensures users cannot farm points using old photos.
* **🏆 Gamification:** Residents earn points and climb the community leaderboard for valid contributions.

---

## 🛠️ Tech Stack

### **Frontend (Mobile App)**
* **Framework:** React Native (Expo)
* **Language:** TypeScript / JavaScript
* **Design System:** Custom centralized theme (`theme.ts`) with eGovPH aesthetics
* **Networking:** Axios

### **Frontend (Admin Web Portal)**
* **Framework:** React.js (Vite)
* **Styling:** Vanilla CSS (Human-Centered Design)

### **Backend (API)**
* **Runtime:** Node.js & Express.js
* **Database:** MongoDB (NoSQL) + Mongoose (ODM)
* **Architecture:** Modular MVC (Controllers separated from Routes)
* **Authentication:** JSON Web Tokens (JWT) + Bcrypt

### **Artificial Intelligence**
* **Proof Verification Server:** Python (Flask), TensorFlow, Docker (Hosted on **Hugging Face Spaces**)
* **Chatbot Engine:** Groq API (LLaMA 3)

### **Blockchain**
* **Network:** Ethereum (Sepolia Testnet)
* **Smart Contracts:** Solidity
* **Library:** Ethers.js

---

## 📂 Project Structure

```bash
mission17/
├── mission17-mobile/     # React Native App (Resident Frontend)
├── mission17-admin/      # React Vite Web App (Barangay Officials Portal)
├── mission17-backend/    # Node.js API & MongoDB Connection
├── mission17-ai/         # Python Flask Server & CNN Model
└── README.md             # This file
```

---

## ⚡ Installation & Setup

### **1. Prerequisites**
* Node.js (v18+)
* Python (3.8+)
* MongoDB Compass or MongoDB Atlas URI
* Expo Go (on your mobile device)

### **2. Backend Setup**
```bash
cd mission17-backend
npm install
# Ensure your .env file is set up with MONGO_URI, JWT_SECRET, and GROQ_API_KEY
npm run dev
# Server runs on http://localhost:5001
```

### **3. Admin Portal Setup**
```bash
cd mission17-admin
npm install
npm run dev
# Admin Portal runs on http://localhost:5173
```

### **4. AI Proof Verification Server Setup**
The AI Server is automatically deployed to **Hugging Face Spaces** via GitHub Actions. No local setup is required for production, but to run it locally:
```bash
cd mission17-ai
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py
# AI runs on http://localhost:7860
```

### **5. Mobile App Setup**
```bash
cd mission17-mobile
npm install
npx expo start
# Scan the QR code with your phone using Expo Go
```

---

## 🧪 Testing

* **Resident Login:** Register a new account on the mobile app or use existing credentials.
* **AI Verification (Missions):** Go to "Missions" > Select "Tree Planting" > Upload a photo. The Hugging Face AI server will analyze and accept/reject the image.
* **Blockchain (Blotter Reports):** Submit a Blotter Report on mobile. Go to the Admin Portal, find the report, and click **Resolved**. A "Ledger" button will appear linking directly to the transaction on **Sepolia Etherscan**.

---

## 👥 Authors

* **Kurt Perez** - *Lead Developer*
* **[Add Your Team Members Here]**

---

## 📄 License

This project is licensed for academic, community, and educational purposes.