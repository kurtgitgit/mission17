# 🔍 Mission 17 & Barangay E-Services: Subsystem Troubleshooting & Diagnostic Guide

<div align="center">

**Document Version:** `2.1.0` • **Coverage:** Mobile, Web Admin, Public Portal, Node API, AI Service, Blockchain, Gmail API

</div>

---

## 🛠️ 1. Mobile Application (React Native / Expo)

| Symptom / Error | Probable Root Cause | Step-by-Step Resolution |
| :--- | :--- | :--- |
| **"Network Error" or `ECONNREFUSED` on mobile** | Mobile app is pointing to `localhost` instead of local IP address on LAN. | 1. Run `node check-ips.js` or `ipconfig` to find your machine's Wi-Fi IP.<br/>2. Run `node sync-ip.js` to update API endpoints across mobile services.<br/>3. Ensure phone and computer are on the same Wi-Fi network. |
| **"EAS Update failed to load"** | Mismatched runtime version or offline device. | 1. Verify `runtimeVersion` in `app.json`.<br/>2. Publish only a runtime-compatible update to the production channel.<br/>3. For native dependency/configuration changes, build and install a new APK instead. |
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

## 🤖 5. BrgyLink AI Chatbot Service (Python / Hugging Face)

| Symptom / Error | Probable Root Cause | Step-by-Step Resolution |
| :--- | :--- | :--- |
| **`503 Service Unavailable` on Hugging Face** | Space entered sleep state due to inactivity. | 1. Retry after a short wait to wake the Space.<br/>2. Check the Hugging Face Space build logs and the backend `CHATBOT_AI_URL` / `AI_SERVER_URL` setting. |
| **Chatbot returns its safe fallback reply** | The AI service URL is unavailable, returns an error, or the question is outside the verified knowledge base. | 1. Check the backend PM2 logs for `Chatbot AI gateway error`.<br/>2. Confirm the Space endpoint and service token.<br/>3. Keep official details in the approved knowledge base or direct the resident to the barangay office. |

---

## ⛓️ 6. Blockchain & Smart Contracts (Ethereum Sepolia)

| Symptom / Error | Probable Root Cause | Step-by-Step Resolution |
| :--- | :--- | :--- |
| **`CALL_EXCEPTION` or `insufficient funds for gas`** | Sponsor wallet has run out of Sepolia testnet ETH. | 1. Check wallet balance using `node check-wallet.js`.<br/>2. Request testnet ETH from a Sepolia faucet (e.g., Alchemy or Google Cloud Faucet). |
| **`NONCE_EXPIRED` or Transaction Replacement Underpriced** | Simultaneous transactions sent before previous mined. | 1. Allow 15 seconds between administrative resolution submissions.<br/>2. Backend automatically re-fetches latest nonce via `provider.getTransactionCount(address, 'latest')`. |

---

## 📧 7. Signup Email Verification (Gmail API OAuth)

| Symptom / Error | Probable Root Cause | Step-by-Step Resolution |
| :--- | :--- | :--- |
| **Gmail API authorization fails** | OAuth consent or refresh token is invalid, expired, or revoked. | 1. Verify `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REFRESH_TOKEN` in the backend `.env`.<br/>2. Re-authorize the sender account to obtain a replacement refresh token when required.<br/>3. Restart `brgylink-backend` with `--update-env`. |
| **Verification code not arriving** | Recipient delay, recipient filtering, or Spam/Junk classification. | 1. Ask the resident to check Inbox, Spam, Junk, Promotions, and search for `BrgyLink`.<br/>2. Use the resend timer; do not repeatedly request codes.<br/>3. Inspect `pm2 logs brgylink-backend --lines 100 --nostream` for the send result. |
| **Code rejected** | Code expired, was replaced by a newer resend, or was entered incorrectly. | Return to the verification screen, request one new code after the timer, then enter only the latest 6-digit code. |
