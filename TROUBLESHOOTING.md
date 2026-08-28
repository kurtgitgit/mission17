# 🔍 Mission 17 & Barangay E-Services: Subsystem Troubleshooting & Diagnostic Guide

<div align="center">

**Document Version:** `2.0.0` • **Coverage:** Mobile, Web Admin, Public Portal, Node API, AI Service, Blockchain, SMTP

</div>

---

## 🛠️ 1. Mobile Application (React Native / Expo)

| Symptom / Error | Probable Root Cause | Step-by-Step Resolution |
| :--- | :--- | :--- |
| **"Network Error" or `ECONNREFUSED` on mobile** | Mobile app is pointing to `localhost` instead of local IP address on LAN. | 1. Run `node check-ips.js` or `ipconfig` to find your machine's Wi-Fi IP.<br/>2. Run `node sync-ip.js` to update API endpoints across mobile services.<br/>3. Ensure phone and computer are on the same Wi-Fi network. |
| **"EAS Update failed to load"** | Mismatched runtime version or offline device. | 1. Verify `runtimeVersion` in `app.json`.<br/>2. Run `npx eas update --branch production` to publish fresh assets. |
| **Camera / Photo Picker Crashing** | Missing Android permissions. | 1. Verify `CAMERA` and `READ_MEDIA_IMAGES` permissions in `app.json`.<br/>2. In mobile Settings, grant storage/camera permissions to Expo Go. |

---

## 💻 2. Officials Admin Dashboard (React / Vite)

| Symptom / Error | Probable Root Cause | Step-by-Step Resolution |
| :--- | :--- | :--- |
| **CORS Policy: No 'Access-Control-Allow-Origin'** | Backend API origin whitelist mismatch. | 1. In `mission17-backend/index.js`, ensure `cors({ origin: '*' })` or admin URL is allowed.<br/>2. Verify `VITE_API_URL` points to `http://localhost:5001/api`. |
| **"Session Expired / Unauthorized"** | JWT 24-hour token expired or `JWT_SECRET` changed. | 1. Log out of the Admin Portal.<br/>2. Log in again with admin credentials to receive a fresh token and OTP. |
| **Images Not Loading in Verification Queue** | Helmet blocking cross-origin media. | 1. Verify `helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })` is active in `index.js`. |

---

## 🌐 3. Public Barangay Portal (BrgyLink)

| Symptom / Error | Probable Root Cause | Step-by-Step Resolution |
| :--- | :--- | :--- |
| **"Download App" link returns 404 / expired** | Download link pointing to expired Expo EAS artifact. | 1. Place `BrgyLink.apk` in `mission17-website/public/BrgyLink.apk`.<br/>2. Ensure `App.jsx` points to `href="/BrgyLink.apk"` with `download="BrgyLink.apk"`. |

---

## 🛡️ 4. Backend REST API Server (Node.js / Express)

| Symptom / Error | Probable Root Cause | Step-by-Step Resolution |
| :--- | :--- | :--- |
| **`Error: listen EADDRINUSE: address already in use :::5001`** | Another node process is already running on port 5001. | **Windows PowerShell:**<br/>`Get-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess \| Stop-Process -Force`<br/>**Linux/macOS:**<br/>`npx kill-port 5001` |
| **`MongooseServerSelectionError: Could not connect to any servers`** | IP address not whitelisted in MongoDB Atlas. | 1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).<br/>2. Navigate to **Network Access** > **Add IP Address** > Select **Add Current IP Address**. |
| **`FATAL ERROR: Environment variable MONGO_URI is missing`** | Missing or incorrectly named `.env` file in backend root. | 1. Copy `sample.env` to `.env` in `mission17-backend/`.<br/>2. Populate all required keys listed in `DEPLOYMENT.md`. |

---

## 🤖 5. AI Proof Verification Server (Python / TensorFlow)

| Symptom / Error | Probable Root Cause | Step-by-Step Resolution |
| :--- | :--- | :--- |
| **`503 Service Unavailable` on Hugging Face** | Space entered sleep state due to inactivity. | 1. Send a warmup `GET` request to wake the container.<br/>2. Check container build logs on Hugging Face Spaces dashboard. |
| **`TypeError: cannot unpack non-iterable NoneType object`** | Corrupted or unsupported image file uploaded. | 1. Validate image format (`.jpg`, `.png`, `.webp`).<br/>2. Ensure file size does not exceed 5MB. |

---

## ⛓️ 6. Blockchain & Smart Contracts (Ethereum Sepolia)

| Symptom / Error | Probable Root Cause | Step-by-Step Resolution |
| :--- | :--- | :--- |
| **`CALL_EXCEPTION` or `insufficient funds for gas`** | Sponsor wallet has run out of Sepolia testnet ETH. | 1. Check wallet balance using `node check-wallet.js`.<br/>2. Request testnet ETH from a Sepolia faucet (e.g., Alchemy or Google Cloud Faucet). |
| **`NONCE_EXPIRED` or Transaction Replacement Underpriced** | Simultaneous transactions sent before previous mined. | 1. Allow 15 seconds between administrative resolution submissions.<br/>2. Backend automatically re-fetches latest nonce via `provider.getTransactionCount(address, 'latest')`. |

---

## 📧 7. Email & MFA OTP Dispatch (Nodemailer)

| Symptom / Error | Probable Root Cause | Step-by-Step Resolution |
| :--- | :--- | :--- |
| **`Invalid login: 535-5.7.8 Username and Password not accepted`** | Incorrect Google App Password or 2FA not enabled on Gmail. | 1. Generate a new 16-character **App Password** in Google Account security settings.<br/>2. Paste into `EMAIL_PASS` in `.env` without spaces. |
| **OTP not arriving in inbox** | Spam filter delay or SMTP throttling. | 1. Check Spam/Junk folder.<br/>2. For local testing, check backend console logs for the `🔐 DEBUG OTP: xxxxxx` output. |