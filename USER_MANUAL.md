# 📖 Mission 17 & Barangay E-Services: End-User & Administrator Operating Manual

<div align="center">

**Document Version:** `2.0.0` • **Target Audience:** Barangay Residents, Barangay Staff, System Administrators

</div>

---

## 📑 Table of Contents
1. [System Overview & Access Channels](#1-system-overview--access-channels)
2. [Part A: Resident Mobile Application Guide (React Native / Expo)](#2-part-a-resident-mobile-application-guide)
   - [2.1 Registration & Multi-Factor Login](#21-registration--multi-factor-login)
   - [2.2 Requesting Barangay Documents](#22-requesting-barangay-documents)
   - [2.3 Filing Blotter & Incident Reports](#23-filing-blotter--incident-reports)
   - [2.4 Participating in SDG Missions (AI Proof Verification)](#24-participating-in-sdg-missions-ai-proof-verification)
   - [2.5 Using the Multilingual AI Chatbot](#25-using-the-multilingual-ai-chatbot)
   - [2.6 Checking Community Leaderboards](#26-checking-community-leaderboards)
3. [Part B: Barangay Officials & Admin Web Portal Guide](#3-part-b-barangay-officials--admin-web-portal-guide)
   - [3.1 Official Login & Security Challenge](#31-official-login--security-challenge)
   - [3.2 Processing Blotter Reports & Minting Blockchain Resolutions](#32-processing-blotter-reports--minting-blockchain-resolutions)
   - [3.3 Document Request Fulfillment](#33-document-request-fulfillment)
   - [3.4 Reviewing SDG Proofs (AI-Assisted Queue)](#34-reviewing-sdg-proofs-ai-assisted-queue)
   - [3.5 Publishing Community Announcements](#35-publishing-community-announcements)
   - [3.6 Reviewing Security Audit Logs](#36-reviewing-security-audit-logs)

---

## 🏛️ 1. System Overview & Access Channels

| User Role | Platform / Channel | URL / Application Download |
| :--- | :--- | :--- |
| **Residents / Citizens** | Mobile App (Android/iOS) | Download `BrgyLink.apk` from Public Website |
| **Public Citizens** | Public Barangay Website | `https://brgylink.gov.ph` |
| **Barangay Officials / Staff** | Officials Admin Dashboard | `https://admin.brgylink.gov.ph` |

---

## 📱 2. Part A: Resident Mobile Application Guide

### 2.1 Registration & Multi-Factor Login
1. Launch the **BrgyLink Mobile App**.
2. Tap **Create Account** and provide your Full Name, Email, Username, Phone Number, and Home Address.
3. Upon entering your credentials on login, a **6-Digit One-Time Password (OTP)** will be dispatched to your registered email address.
4. Input the 6-digit code to complete authentication.

---

### 2.2 Requesting Barangay Documents
1. From the Home Screen, tap **📄 Document Requests**.
2. Select your required document:
   - *Barangay Clearance*
   - *Certificate of Indigency*
   - *Barangay Residency Certificate*
3. Fill in the purpose of request (e.g., *Employment*, *School Enrollment*, *Financial Assistance*).
4. Attach a clear photo of a valid government ID.
5. Tap **Submit Request**. You can track the real-time status (`Pending` ➔ `Processing` ➔ `Ready for Pick-up`) from your activity tab.

---

### 2.3 Filing Blotter & Incident Reports
1. From the navigation menu, select **📝 Blotter Reports**.
2. Tap **+ File New Report**.
3. Choose the incident type (e.g., *Noise Disturbance*, *Property Boundary Dispute*, *Ordinance Violation*).
4. Enter the location and narrative statement describing the event.
5. Optionally toggle **"Submit Anonymously"** if you prefer to protect your identity.
6. Attach photographic or video evidence and tap **Submit Incident**.

---

### 2.4 Participating in SDG Missions (AI Proof Verification)
1. Tap the **🌍 Missions** tab on the bottom bar.
2. Select an active civic challenge:
   - **SDG 15 - Community Tree Planting** (*100 Points*)
   - **SDG 12 - Clean & Segregated Waste Drive** (*75 Points*)
3. Tap **Upload Proof**.
4. Use your camera to capture live photographic evidence of your contribution.
5. Tap **Analyze & Submit**.
6. The **Hugging Face AI Vision Server** will instantly evaluate your image:
   - ✅ **Valid Proof**: Points are immediately credited to your account.
   - ⚠️ **Duplicate / Unclear Proof**: The image will be flagged for review or duplicate rejection.

---

### 2.5 Using the Multilingual AI Chatbot
1. Tap the **🤖 Assistant** icon on the top-right header.
2. Select your preferred language: **English**, **Tagalog**, **Pangasinan**, or **Ilocano**.
3. Type your inquiry (e.g., *"Kasanok nga agkiddaw ti Barangay Clearance?"* or *"Anong requirements para sa Indigency?"*).
4. The Groq-accelerated LLaMA 3 engine will provide an instant, conversational response with direct action links.

---

### 2.6 Checking Community Leaderboards
1. Navigate to **🏆 Leaderboard**.
2. View your current tier: *Bronze*, *Silver*, *Gold*, or *Champion*.
3. See top community contributors in Barangay Bagong Pag-asa.

---

## 💻 3. Part B: Barangay Officials & Admin Web Portal Guide

### 3.1 Official Login & Security Challenge
1. Navigate to the **Officials Admin Portal** (`http://localhost:5173` or production URL).
2. Enter your authorized official credentials.
3. Complete the Email OTP challenge.
4. Access the centralized operational dashboard.

---

### 3.2 Processing Blotter Reports & Minting Blockchain Resolutions
1. In the sidebar, click **📋 Blotter Management**.
2. Select an incident report under the **Pending / Investigating** tab.
3. Review the complainant's narrative, location, and uploaded evidence.
4. Schedule mediation or record official action taken.
5. Click **Mark as Resolved**.
6. Enter the official resolution statement and presiding officer's name.
7. Click **Confirm & Sign on Blockchain**.
8. The backend sponsor gateway will sign an Ethereum transaction on Sepolia. Once mined (~12 seconds), click the **Sepolia Etherscan** link to view the permanent, immutable transaction receipt.

---

### 3.3 Document Request Fulfillment
1. Click **📄 Document Requests** in the admin sidebar.
2. Filter requests by status (`Pending`, `Processing`, `Ready for Pick-up`).
3. Click on a request to verify the citizen's attached valid ID.
4. Click **Approve & Print Clearance** to generate the official printable document.
5. Click **Notify Citizen** to send an automated push notification and SMS alert that their document is ready.

---

### 3.4 Reviewing SDG Proofs (AI-Assisted Queue)
1. Navigate to **🏆 Mission Submissions**.
2. The dashboard displays AI confidence scores and perceptual hash results for all pending civic submissions.
3. Click **Approve** to finalize reward token issuance or **Reject** with written feedback for the citizen.

---

### 3.5 Publishing Community Announcements
1. Click **📢 Barangay Bulletin** > **+ Create Announcement**.
2. Input Title, Body Content, Category (*Emergency*, *Advisory*, *Event*), and Priority (*Normal*, *Urgent*).
3. Check **"Pin to Top"** if it is a high-priority storm advisory or curfew alert.
4. Click **Publish**. The announcement is broadcast immediately to the public website and mobile app.

---

### 3.6 Reviewing Security Audit Logs
1. Click **🛡️ Security Logs** (SuperAdmin only).
2. Inspect the real-time chronological table of user logins, role modifications, and administrative resolutions with IP addresses and browser fingerprints.
