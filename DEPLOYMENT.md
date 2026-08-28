# 🚀 Mission 17 & Barangay E-Services: Production Deployment Manual

<div align="center">

**Document Version:** `2.0.0` • **Target Environments:** Cloud PaaS, Docker, Mobile EAS, Ethereum Sepolia

</div>

---

## 📋 Pre-Flight Production Readiness Checklist

- [x] All `.env` production secrets generated (JWT secret $\ge 64$ characters, strong MongoDB passwords).
- [x] MongoDB Atlas Network Access configured (IP Whitelisting or VPC Peering).
- [x] Nodemailer Google App Password tested for MFA OTP delivery.
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
   EMAIL_USER=mission17.security@gmail.com
   EMAIL_PASS=your_16_char_google_app_password
   GROQ_API_KEY=gsk_your_groq_api_key
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
cd /var/www/mission17/mission17-backend
npm install --production
# Run security audit
npm audit --production
# Launch via PM2 clustering
pm2 start index.js --name "mission17-api" -i max
pm2 save
pm2 startup
```

---

## 🍃 2. Database Deployment (MongoDB Atlas)

1. Provision a MongoDB Atlas Cluster (M0 Sandbox for staging or M10+ for production).
2. **Network Security**: Under *Network Access*, add your backend server's static IP address or configure `0.0.0.0/0` with strict credential authentication.
3. **Database User**: Create a dedicated database user with `readWrite` privileges restricted to the `mission17` database.
4. **Point-In-Time Backups**: Enable continuous backup snapshots under Atlas Cloud Backup.

---

## 🤖 3. AI Service Deployment (Hugging Face Spaces)

The Python/TensorFlow computer vision engine is containerized for zero-maintenance cloud hosting:

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

### A. Over-The-Air (OTA) Instant Updates (Recommended)
As per project rules, publish code changes immediately without requiring residents to reinstall the APK:
```bash
cd mission17-mobile
npx eas update --branch production --message "feat: Update UI styling and notifications"
```

### B. Building Standalone Android APK
```bash
cd mission17-mobile
# Build preview/standalone APK via Expo Cloud
npx eas build --platform android --profile preview
```
Download the resulting `.apk` artifact and place it into `mission17-website/public/BrgyLink.apk` for permanent public hosting.

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
| **Admin Portal** | Navigate to `https://admin.brgylink.gov.ph` | Loads login with MFA modal |
| **Public Website** | Navigate to `https://brgylink.gov.ph` | Loads homepage with direct APK download |
| **Blockchain** | Query contract address on `sepolia.etherscan.io` | Verified proxy contract state |