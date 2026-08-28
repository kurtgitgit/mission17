# 📖 Barangay Bagong Pag-asa E-Services (BrgyLink): End-User & Admin Operating Manual

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
   - [2.4 Submitting Proof for Community Programs (AI Verification)](#24-submitting-proof-for-community-programs-ai-verification)
   - [2.5 Using the Multilingual AI Chatbot](#25-using-the-multilingual-ai-chatbot)
3. [Part B: Barangay Officials & Admin Web Portal Guide](#3-part-b-barangay-officials--admin-web-portal-guide)
   - [3.1 Official Login & Security Challenge](#31-official-login--security-challenge)
   - [3.2 Processing Blotter Reports & Minting Blockchain Resolutions](#32-processing-blotter-reports--minting-blockchain-resolutions)
   - [3.3 Document Request Fulfillment](#33-document-request-fulfillment)
   - [3.4 Reviewing Civic Program Submissions](#34-reviewing-civic-program-submissions)
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
2. Tap **Create Account** and enter your Full Name, Email, Username, Phone Number, and Home Address.
3. Upon logging in, a **6-Digit One-Time Password (OTP)** will be dispatched to your registered email.
4. Enter the 6-digit code to complete verification.

---

### 2.2 Requesting Barangay Documents
1. From the Home Screen, tap **📄 Document Requests**.
2. Select your document:
   - *Barangay Clearance*
   - *Certificate of Indigency*
   - *Barangay Residency Certificate*
3. Enter the purpose of your request (e.g., *Employment*, *School Requirement*).
4. Attach a photo of your valid ID.
5. Tap **Submit Request**. Track your status (`Pending` ➔ `Processing` ➔ `Ready for Pick-up`) directly in the app.

---

### 2.3 Filing Blotter & Incident Reports
1. Select **📝 Blotter Reports** > **+ File New Report**.
2. Choose the incident type (e.g., *Noise Disturbance*, *Dispute*, *Ordinance Violation*).
3. Enter the location and narrative statement.
4. Optionally enable **"Submit Anonymously"**.
5. Attach photo evidence and tap **Submit Incident**.

---

### 2.4 Submitting Proof for Community Programs (AI Verification)
1. Tap the **🌱 Community Initiatives** tab.
2. Select an active program:
   - **SDG 15 - Community Tree Planting**
   - **SDG 12 - Clean & Segregated Waste Drive**
3. Tap **Upload Proof**.
4. Use your camera to capture live photographic proof.
5. Tap **Analyze & Submit**.
6. The **AI Vision Server** automatically verifies the image:
   - ✅ **Valid Proof**: Submission is verified and logged.
   - ⚠️ **Duplicate / Unclear Proof**: Flagged for administrator review.

---

### 2.5 Using the Multilingual AI Chatbot
1. Tap the **🤖 Assistant** icon.
2. Select your language: **English**, **Tagalog**, **Pangasinan**, or **Ilocano**.
3. Type your inquiry (e.g., *"Kasanok nga agkiddaw ti Barangay Clearance?"*).
4. Receive immediate, conversational guidance and service steps.

---

## 💻 3. Part B: Barangay Officials & Admin Web Portal Guide

### 3.1 Official Login & Security Challenge
1. Open the **Officials Admin Portal**.
2. Enter official credentials and complete Email OTP verification.

---

### 3.2 Processing Blotter Reports & Minting Blockchain Resolutions
1. Click **📋 Blotter Management** in the sidebar.
2. Review incident reports, evidence, and complainant statements.
3. Conduct mediation and click **Mark as Resolved**.
4. Enter the resolution statement and presiding officer's name.
5. Click **Confirm & Sign on Blockchain**.
6. The backend sponsor gateway will sign an Ethereum transaction on Sepolia. Click the **Sepolia Etherscan** link to view the permanent transaction receipt.

---

### 3.3 Document Request Fulfillment
1. Click **📄 Document Requests**.
2. Verify citizen valid IDs and click **Approve & Print Clearance**.
3. Click **Notify Citizen** to send a push notification that the document is ready for pick-up.

---

### 3.4 Reviewing Civic Program Submissions
1. Navigate to **🌱 Civic Submissions**.
2. Inspect AI confidence scores and perceptual hashes for pending submissions.
3. Approve valid submissions or provide feedback.

---

### 3.5 Publishing Community Announcements
1. Click **📢 Barangay Bulletin** > **+ Create Announcement**.
2. Enter Title, Content, and Priority (*Normal*, *Urgent*).
3. Click **Publish** to broadcast to the website and mobile app.

---

### 3.6 Reviewing Security Audit Logs
1. Click **🛡️ Security Logs** (SuperAdmin).
2. Inspect real-time records of user logins, role updates, and official resolutions with IP addresses.
