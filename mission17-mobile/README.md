# 📱 Mission 17 Mobile: Resident e-Governance & SDG Gamification App

<div align="center">

**Framework:** React Native (Expo SDK 54) • **Language:** TypeScript • **Design System:** eGovPH Aesthetics

</div>

---

## 📌 Overview
The `mission17-mobile` client is a cross-platform (Android & iOS) mobile application designed for the residents of Barangay Bagong Pag-asa. It delivers instant mobile access to local government e-services (Blotter reports, Document clearances, Announcements) and empowers citizens to participate in gamified sustainability missions (SDGs) with automated AI verification.

---

## ✨ Features
* **🏛️ Digital Clearances**: Request Barangay Clearances and Certificates of Indigency with live status updates.
* **📝 Incident Blotter**: File geotagged blotter reports with photo evidence.
* **📸 AI Proof Camera**: Capture and submit SDG civic action proofs for instant AI validation.
* **🏆 Community Leaderboard**: Earn verified civic points and climb community badge tiers.
* **🤖 Multilingual Assistant**: 24/7 AI chatbot fluent in English, Tagalog, Pangasinan, and Ilocano.

---

## ⚡ Quickstart & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Local API IP (if testing on physical device)
Ensure your mobile phone and computer are on the same Wi-Fi network:
```bash
# In project root:
node sync-ip.js
```

### 3. Launch Expo Dev Server
```bash
npx expo start
```
* Scan the displayed QR code using the **Expo Go** application on Android or the Camera app on iOS.

---

## 🚀 Publishing Updates (Over-The-Air)
Per project guidelines, always default to OTA updates:
```bash
npx eas update --branch production --message "feat: Enhanced UI responsiveness and notification alerts"
```
