# 📱 BrgyLink Mobile: Resident e-Governance & Community App

<div align="center">

**Framework:** React Native (Expo SDK 54) • **Language:** TypeScript • **Design System:** eGovPH Aesthetics

</div>

---

## 📌 Overview
The `mission17-mobile` client is a cross-platform (Android & iOS) mobile application designed for the residents of Barangay Bagong Pag-asa. It delivers mobile access to document requests, blotter incident reports, announcements, citizen feedback, and BrgyLink AI guidance.

## Current onboarding and release

Signup sends a 6-digit Gmail API verification code immediately after Step 1. Step 2 collects the resident profile (including age 15+, Purok 1–7, and street/address); Step 3 collects the preferred ID type, clear front/back ID images, password, and legal consent. Firebase Authentication retains password credentials while the BrgyLink API retains the resident profile and approval status.

The current direct-install Android release is **1.0.3 (versionCode 5)**. OTA updates only apply to runtime-compatible JavaScript/assets; use a new APK for native configuration or dependency changes.

---

## ✨ Features
* **🏛️ Digital Clearances**: Request Barangay Clearances and Certificates of Indigency with live status updates.
* **📝 Incident Blotter**: File geotagged blotter reports with photo evidence.
* **🤖 BrgyLink AI**: Suggested FAQ prompts and typed guidance for resident services, account recovery, and announcements.
* **🤖 Multilingual Assistant**: 24/7 AI chatbot fluent in English, Tagalog, Pangasinan, and Ilocano.
* **📢 Community Announcements**: Receive real-time push advisories and community bulletin updates.

---

## ⚡ Quickstart & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Local API IP (if testing on physical device)
```bash
# In project root:
node sync-ip.js
```

### 3. Launch Expo Dev Server
```bash
npx expo start
```
* Scan the displayed QR code using the **Expo Go** application on Android or iOS.
