# Changelog

This document outlines the recent changes and security enhancements made to the Mission 17 application.

## 1. Bug Fix: Corrected Invalid Syntax in Mobile App

*   **File:** `mission17-mobile/MissionBlockchain.js`
*   **Issue:** The file, despite having a `.js` extension, contained TypeScript type annotations (`userId: string`), which is invalid JavaScript syntax.
*   **Resolution:** The type annotations were removed from the function signature to make the file syntactically correct JavaScript. This resolved the immediate error in the mobile application's blockchain service file.

## 2. Security Enhancement: Server-Side Blockchain Transactions

*   **File:** `mission17-mobile/MissionBlockchain.js`
*   **Vulnerability Mitigated:** "Risk: Financial Drain via Exposed Blockchain Key".
*   **Verification:** An analysis confirmed that the mobile application does **not** contain any hardcoded private keys. All blockchain interactions are handled by a secure backend.
*   **Mechanism:** The mobile app makes a `POST` request to the `/api/blockchain/record` endpoint on the backend server, delegating the responsibility of transaction signing. This prevents the private key from ever being exposed on the client-side, aligning with security best practices.

## 3. Code Documentation: Enhanced Backend Security Comments

*   **File:** `mission17-backend/routes/blockchain.js`
*   **Task:** To clearly document the security measures for educational and review purposes.
*   **Change:** A detailed comment was added to the `/api/blockchain/record` endpoint in the backend. This comment explicitly describes how the endpoint serves as a secure gateway for blockchain interactions, validating input and using a securely stored private key from environment variables to sign transactions. This helps clarify the security architecture for future developers and reviewers.

**Added Input Sanitization for AI Model Uploads:** Implemented checks to validate files uploaded to the AI prediction endpoint.

  - **Risk:** Without proper validation, a malicious actor could upload very large files to cause a Denial of Service (DoS) by exhausting server resources (disk, memory, CPU). Alternatively, they could upload executable script files, which, if ever processed by a misconfigured server, could lead to Remote Code Execution (RCE).

  - **Mitigation:**
    - **File Type Whitelisting:** The system now strictly allows only specific image file extensions (`.png`, `.jpg`, `.jpeg`, `.webp`) to be uploaded, preventing script execution.
    - **File Size Limitation:** A maximum upload size of 5MB is enforced to prevent resource exhaustion attacks.