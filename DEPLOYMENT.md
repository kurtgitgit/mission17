# 🚀 Mission 17 & Barangay E-Services: Production Deployment Manual

<div align="center">

**Document Version:** `2.1.0` • **Target Environments:** Linux VPS, Vercel, Expo EAS, Hugging Face

</div>

---

## 📋 Pre-Flight Production Readiness Checklist

- [x] All `.env` production secrets generated (JWT secret $\ge 64$ characters, strong MongoDB passwords).
- [x] MongoDB Atlas Network Access configured (IP Whitelisting or VPC Peering).
- [x] Gmail API OAuth credentials configured for signup email verification (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `EMAIL_USER`).
- [x] AI Microservice container running on Hugging Face Spaces with active HTTPS endpoint.
- [x] Ethereum Sepolia Sponsor Wallet funded with testnet ETH and smart contract deployed.
- [x] Expo EAS Application Service configured with production OTA update channels.
- [x] SSL/TLS certificates configured across all web domains.

---

## 🌐 1. Backend REST API Deployment (Node.js / Express)

### Option A: Cloud Deployment (Render / Railway / Heroku)
1. Link your GitHub repository (`kurtgitgit/mission17`).
2. Set Root Directory to `mission17-backend`.
3. Set Build Command: `npm install`
4. Set Start Command: `node index.js`
5. Configure Environment Variables in the cloud dashboard:
   ```env
   NODE_ENV=production
   PORT=5001
   MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/mission17?retryWrites=true&w=majority
   JWT_SECRET=your_production_64_char_hex_secret
   FIREBASE_WEB_API_KEY=your_firebase_web_api_key
   EMAIL_USER=your_gmail_sender@gmail.com
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
   GOOGLE_REFRESH_TOKEN=your_google_oauth_refresh_token
   AI_SERVER_URL=https://<your-hugging-face-space>.hf.space/predict
   AI_SERVICE_TOKEN=<shared-ai-service-token>
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_key
   ADMIN_PRIVATE_KEY=0x_your_sponsor_wallet_private_key
   CONTRACT_ADDRESS=0x_deployed_contract_address
   AI_SERVER_URL=https://your-huggingface-space.hf.space
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Option B: Linux VPS with PM2 Process Manager
```bash
cd ~/mission17/mission17-backend
npm install --production
npm audit --production
# Restart the existing production process; do not create a duplicate process.
pm2 restart brgylink-backend --update-env
pm2 save
```

Verify both health checks after PM2 has finished starting:
```bash
curl -fsS http://127.0.0.1:5001/api/health
curl -fsS https://brgylink-api.duckdns.org/api/health
```

---

## 🍃 2. Database Deployment (MongoDB Atlas)

1. Provision a MongoDB Atlas Cluster (M0 Sandbox for staging or M10+ for production).
2. **Network Security**: Under *Network Access*, add your backend server's static IP address or configure `0.0.0.0/0` with strict credential authentication.
3. **Database User**: Create a dedicated database user with `readWrite` privileges restricted to the `mission17` database.
4. **Point-In-Time Backups**: Enable continuous backup snapshots under Atlas Cloud Backup.

---

## 🤖 3. AI Service Deployment (Hugging Face Spaces)

The Python BrgyLink AI chatbot service is containerized for zero-maintenance cloud hosting:

1. Create a new Space on [Hugging Face](https://huggingface.co/spaces) with SDK: **Docker**.
2. Push the contents of `mission17-ai/` to the Space repository.
3. Hugging Face automatically builds the `Dockerfile`:
   ```dockerfile
   FROM python:3.10-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   EXPOSE 7860
   CMD ["python", "app.py"]
   ```
4. Verify the public endpoint: `https://<your-username>-<space-name>.hf.space/predict`.

---

## 💻 4. Admin Web Portal & Public Website Deployment (Vercel / Netlify)

### A. Officials Admin Portal (`mission17-admin`)
1. In Vercel/Netlify, set Root Directory: `mission17-admin`.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Set Environment Variable: `VITE_API_URL=https://your-backend-api.com/api`

### B. Public Barangay Portal (`mission17-website`)
1. Set Root Directory: `mission17-website`.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Ensure `public/BrgyLink.apk` is present so visitors can download the mobile application directly.

---

## 📱 5. Mobile App Deployment (Expo EAS & OTA Updates)

### A. Over-The-Air (OTA) JavaScript Updates
Use OTA only for JavaScript/assets compatible with the installed runtime version. Deploy dependent backend routes before publishing an OTA that calls them:
```bash
cd mission17-mobile
npx eas update --branch production --message "feat: Update UI styling and notifications"
```

### B. Building a Direct-Install Android APK
```bash
cd mission17-mobile
# Build the direct-install artifact using the configured APK profile.
npx eas build --platform android --profile apk
```
The currently hosted artifact is **BrgyLink 1.0.3 (Android versionCode 5)**. For each native build, replace `mission17-website/public/BrgyLink.apk`, commit the artifact, and deploy the public website. An OTA does not replace the downloadable APK.

---

## ⛓️ 6. Smart Contract Deployment (Ethereum Sepolia)

```bash
cd mission17-backend
# Deploy UUPS Upgradeable Proxy Smart Contract
node initialize-proxy.js
# Verify deployed bytecode on Sepolia Etherscan
```

---

## 🔍 7. Post-Deployment Verification Matrix

| Subsystem | Health Check URL / Command | Expected Status |
| :--- | :--- | :--- |
| **Backend API** | `GET https://your-api.com/api/health` | `{"status": "OK"}` |
| **AI Engine** | `GET https://your-space.hf.space/` | `{"status": "AI Server Online"}` |
| **Admin Portal** | Open the configured production admin URL | Loads the authorized staff login flow |
| **Public Website** | Open the configured production public-website URL | Loads homepage with direct APK download |
| **Blockchain** | Query contract address on `sepolia.etherscan.io` | Verified proxy contract state |
