# 💻 Mission 17 Admin: Barangay Officials Management Dashboard

<div align="center">

**Framework:** React 18 • **Build Tool:** Vite • **Design System:** Custom Human-Centered UI

</div>

---

## 📌 Overview
The `mission17-admin` portal provides barangay officials, mediators, and administrators with a centralized web dashboard to manage citizen document requests, mediate blotter incident reports, sign resolution proofs to the Ethereum Sepolia blockchain, and moderate AI-evaluated civic submissions.

---

## ✨ Features
* **📋 Blotter Mediation & Blockchain Event**: Review incident reports, conduct hearings, and record a resolution-related gamification transaction on the Ethereum Sepolia ledger. The current implementation does not anchor the blotter report hash itself.
* **📄 Document Request Processing**: Review valid IDs, issue electronic barangay clearances, and trigger resident notifications.
* **AI Submission Moderation**: Review AI-analyzed SDG task proofs, inspect advisory verdicts, and make the final approval decision.
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
