# 💻 Mission 17 Admin: Barangay Officials Management Dashboard

<div align="center">

**Framework:** React 18 • **Build Tool:** Vite • **Design System:** Custom Human-Centered UI

</div>

---

## 📌 Overview
The `mission17-admin` portal provides barangay officials, mediators, and administrators with a centralized web dashboard to manage citizen document requests, mediate blotter incident reports, record privacy-safe resolution integrity proofs to Ethereum Sepolia when the ledger is configured, and publish community announcements.

---

## ✨ Features
* **📋 Blotter Mediation & Resolution Ledger**: Review incident reports, conduct hearings, and, after an official resolution, anchor a cryptographic digest of non-sensitive case metadata on Ethereum Sepolia. Resident data, narratives, locations, and evidence are never written on-chain.
* **📄 Document Request Processing**: Review valid IDs, issue electronic barangay clearances, and trigger resident notifications.
* **📢 Community Announcements**: Publish pinned bulletins and localized push advisories.
* **🛡️ Security Audit Logs**: Inspect chronological logs of logins, administrative overrides, and system events.

---

## ⚡ Quickstart & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
# Dashboard opens on http://localhost:5173
```

### 3. Production Build
```bash
npm run build
# Outputs static bundle to /dist (Deployable on Vercel / Netlify)
```
