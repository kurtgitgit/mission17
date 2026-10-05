# 📖 Barangay Bagong Pag-asa E-Services (BrgyLink): End-User & Admin Operating Manual

<div align="center">

**Document Version:** `2.2.0` • **Target Audience:** Barangay Residents, Barangay Staff, System Administrators

</div>

---

## 📑 Table of Contents
1. [System Overview & Access Channels](#1-system-overview--access-channels)
2. [Part A: Resident Mobile Application Guide (React Native / Expo)](#2-part-a-resident-mobile-application-guide)
   - [2.1 Registration & Email Verification](#21-registration--email-verification)
   - [2.2 Requesting Barangay Documents](#22-requesting-barangay-documents)
   - [2.3 Filing Blotter & Incident Reports](#23-filing-blotter--incident-reports)
   - [2.4 Using BrgyLink AI](#24-using-brgylink-ai)
3. [Part B: Barangay Officials & Admin Web Portal Guide](#3-part-b-barangay-officials--admin-web-portal-guide)
   - [3.1 Official Login & Security Challenge](#31-official-login--security-challenge)
   - [3.2 Processing Blotter Reports & Lupon Hearings](#32-processing-blotter-reports--lupon-hearings)
   - [3.3 Document Request Fulfillment](#33-document-request-fulfillment)
   - [3.4 Publishing Community Announcements](#34-publishing-community-announcements)
   - [3.5 Reviewing Security Audit Logs](#35-reviewing-security-audit-logs)

---

## 🏛️ 1. System Overview & Access Channels

| User Role | Platform / Channel | URL / Application Download |
| :--- | :--- | :--- |
| **Residents / Citizens** | Mobile App (Android/iOS) | Download `BrgyLink.apk` from Public Website |
| **Public Citizens** | Public Barangay Website | Download the current Android APK from the BrgyLink public website |
| **Barangay Officials / Staff** | Officials Admin Dashboard | Use the authorized admin portal provided by the barangay |

---

## 📱 2. Part A: Resident Mobile Application Guide

### 2.1 Registration & Email Verification
1. Launch the **BrgyLink Mobile App** and tap **Create Account**.
2. In **Step 1**, enter your name, username, and email address. Names must not contain numbers.
3. BrgyLink sends a **6-digit verification code immediately after Step 1**. Check your inbox and **Spam or Junk** folder, then enter the code before continuing. Use the resend timer instead of requesting codes repeatedly.
4. In **Step 2**, enter your date of birth, mobile number, nationality, civil status, Purok, street, and other requested profile details. Residents must be **at least 15 years old**. Choose Purok 1–7; select **Other** only if the location is outside the confirmed list and provide the requested detail.
5. In **Step 3**, select an ID type (**PhilSys National ID/ePhilID is preferred**), then attach a clear front and back photo of the ID. Complete the password and consent fields.
6. Your account is created in Firebase Authentication and submitted to the barangay for approval. You may sign in after it is approved. If rejected, correct the stated reason and contact the barangay when needed.

---

### 2.2 Requesting Barangay Documents
1. From the Home Screen, tap **📄 Document Requests**.
2. Select your document:
   - *Barangay Clearance*
   - *Certificate of Indigency*
   - *Barangay Residency Certificate*
3. Enter the purpose of your request (e.g., *Employment*, *School Requirement*).
4. Attach a photo of your valid ID.
5. Tap **Submit Request**. Track your status (`Pending` ➔ `Processing` ➔ `Ready for Pickup` ➔ `Completed`) directly in the app.

---

### 2.3 Filing Blotter & Incident Reports
1. Select **📝 Blotter Reports** > **+ File New Report**.
2. Choose the incident type (e.g., *Noise Disturbance*, *Dispute*, *Ordinance Violation*).
3. Enter a clear free-text incident location within Barangay Bagong Pag-asa (for example, street, purok, landmark, or house number), then write the narrative statement.
4. Select the **incident date and time**—when it happened, not when the report is filed.
5. Attach photo evidence when available and tap **Submit Incident**.
6. Track the case in the app. When a Lupon hearing is scheduled, its stage, date, time, and official instructions appear in the report update.

---

### 2.4 Using BrgyLink AI
1. Tap the **🤖 Assistant** icon.
2. Start with a suggested question, such as requesting a clearance, filing a blotter, account help, or finding announcements.
3. You may also type a BrgyLink or barangay-service question in **English, Tagalog, Pangasinan, or Ilocano**.
4. BrgyLink AI provides guidance only. Do not send passwords, OTP codes, reset links, or sensitive personal details.
5. Confirm changing information—such as office schedules, fees, or officials—with the barangay office or official announcements.

---

## 💻 3. Part B: Barangay Officials & Admin Web Portal Guide

### 3.1 Official Login & Security Challenge
1. Open the **Officials Admin Portal**.
2. Enter official credentials and complete the required security checks.

---

### 3.2 Processing Blotter Reports & Lupon Hearings
1. Click **📋 Blotter Management** in the sidebar.
2. Review incident reports, evidence, and complainant statements.
3. Update the case status, respondent, Lupon hearing stage, hearing date/time, presiding officer, and remarks as appropriate.
4. Save only after making a change. Residents receive the updated hearing information in their case record.
5. Print the **Generic Lupon Summons Draft** only after the relevant hearing details are complete.
6. Resolve or dismiss a case only in accordance with the barangay's authorized process and record the corresponding remarks.

---

### 3.3 Document Request Fulfillment
1. Click **📄 Document Requests**.
2. Verify citizen valid IDs and click **Approve & Print Clearance**.
3. Click **Notify Citizen** to send a push notification that the document is ready for pickup.

---

### 3.4 Publishing Community Announcements
1. Click **📢 Barangay Bulletin** > **+ Create Announcement**.
2. Enter Title, Content, and Priority (*Normal*, *Urgent*).
3. Click **Publish** to broadcast to the website and mobile app.

---

### 3.5 Reviewing Security Audit Logs
1. Click **🛡️ Security Logs** (SuperAdmin).
2. Inspect real-time records of user logins, role updates, and official resolutions with IP addresses.
