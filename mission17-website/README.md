# 🌐 Mission 17 Website: Public Barangay Portal & APK Distribution

<div align="center">

**Framework:** React 18 • **Build Tool:** Vite • **Design:** Human-Centered UI

</div>

---

## 📌 Overview
The `mission17-website` (BrgyLink Portal) is the public-facing web landing page for Barangay Bagong Pag-asa. It showcases community announcements, barangay official directories, core digital services, and provides a direct, permanent download link for the `BrgyLink.apk` resident mobile application.

## Current hosted APK

`public/BrgyLink.apk` is served at `/BrgyLink.apk`. The hosted artifact is BrgyLink **1.0.3 (Android versionCode 5)**. When replacing it with a new EAS build, verify its checksum before committing, then deploy the public website so the download remains aligned with the release.

---

## ✨ Features
* **🏛️ Public Portal**: Official overview of Barangay Bagong Pag-asa leadership, services, and advisories.
* **📱 Direct APK Distribution**: Hosts `BrgyLink.apk` directly in `/public` for permanent, 1-click mobile app downloads.
* **📢 Community Bulletin**: Live feed of public news, coastal cleanups, and community assemblies.
* **📖 Resident Quick Guide**: Hosts the concise BrgyLink infographic manual for document requests, blotter reporting, account help, and BrgyLink AI guidance.

---

## ⚡ Quickstart & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
# Portal opens on http://localhost:5174
```

### 3. Production Build
```bash
npm run build
# Generates production assets and packages BrgyLink.apk into /dist
```
