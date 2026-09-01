# BrgyLink Remediation Plan

**Goal:** resolve the QA release blockers before any APK release or production deployment.

## Progress

| Step | Status | Outcome |
| --- | --- | --- |
| 1. Secure exposed credentials | Completed | MongoDB and affected Firebase administrator credentials rotated; active helper scripts are clean. Git-history cleanup completed. |
| 2. Repair authentication and authorization | Completed in source | Role escalation, OTP auto-approval, public relayer, MFA/push protection, resident ownership checks, pre-auth uploads, notification ownership, and pending-account access have been addressed. Staging verification remains. |
| 3. Repair client API contracts | In progress | Mobile uses fresh Firebase headers and enforces the approval flow; the missing admin analytics contract is restored. Remaining admin/client flows are being checked. |
| 4. Harden services and integrity features | Pending | Secure push receipts, AI endpoints, uploads, and blockchain report records. |
| 5. Build quality evidence | Completed | Dependency/lint issues resolved. Automated testing suite added (Authentication, IDOR, AI, and Upload tests). |
| 6. Verify before release | Pending | Test on staging and a physical Android device, then repeat the QA gate. |

## Working order

1. Treat exposed credentials as compromised. Rotate them outside the repository, remove hard-coded copies, and then clean affected Git history.
2. Make the backend the authority for identity, roles, account approval, and record ownership.
3. Update mobile and admin calls only after the secure backend contracts are in place.
4. Verify each change with focused tests before moving to the next step.

## Release guardrails

- Do not generate a new APK yet.
- Do not deploy unverified security changes directly to production.
- Do not claim push delivery works until a native, physical-device test and Expo receipt verification both pass.

## Reference

See `QA_FINAL_REPORT.md` for the source-backed findings and `QA_AUDIT_SESSION.md` for the saved audit handoff.


---

# Add Meaningful Automated Tests (Backend)

This phase addresses Step 3 from the CODEX_HANDOFF: "Add meaningful automated tests for Firebase auth, admin RBAC, IDOR/ownership, private blotter evidence, upload size/type rejections, and AI URL validation."

## User Review Required

> [!IMPORTANT]
> The backend relies on ES Modules (`type: module`), which makes `jest.mock()` tricky. We will use `jest.unstable_mockModule()` or inject dependencies for mocking `firebase-admin` and `mongoose`.
> We will add `supertest` as a dev dependency to allow us to test the Express endpoints natively.

## Proposed Changes

### Test Setup and Dependencies

We will install `supertest` as a dev dependency to allow us to make HTTP requests against our Express app in memory.

#### [MODIFY] [package.json](file:///c:/Users/Kurt%20Perez/mission17/mission17-backend/package.json)
- Add `"supertest": "^7.0.0"` to `devDependencies`.

### Authentication and RBAC Tests

We will create unit tests for the authentication middleware to ensure that missing, invalid, pending, and non-admin tokens are properly rejected.

#### [NEW] [utils/authMiddleware.test.js](file:///c:/Users/Kurt%20Perez/mission17/mission17-backend/utils/authMiddleware.test.js)
- Test `verifyFirebaseToken`: valid token succeeds, missing/invalid returns 401.
- Test `verifyAuthenticatedUser`: pending/rejected accounts return 403, missing mongo user returns 401.
- Test `verifyAdmin`: non-admin roles return 403, admin roles proceed.

### IDOR and Private Blotter Evidence Tests

We will create integration tests for the blotter reports endpoints using `supertest`.

#### [NEW] [routes/blotter-reports.test.js](file:///c:/Users/Kurt%20Perez/mission17/mission17-backend/routes/blotter-reports.test.js)
- Test `GET /api/blotter-reports/:id`: Resident A cannot view Resident B's report (IDOR).
- Test `GET /api/blotter-reports/:id/evidence`: Admin can view evidence, Resident A can view their own, Resident B receives 403.

### Upload Rejections Tests

We will test the multer configuration in `utils/cloudinary.js` to ensure the 5MB size limit and MIME type constraints are respected.

#### [NEW] [utils/cloudinary.test.js](file:///c:/Users/Kurt%20Perez/mission17/mission17-backend/utils/cloudinary.test.js)
- Test `fileFilter`: Reject non-image files (e.g., `.pdf`, `.exe`).
- Test `fileFilter`: Accept `.png`, `.jpg`, `.webp`.

### AI URL Validation Tests

We will unit test the `isValidImageUri` logic that protects against SSRF and arbitrary remote URL fetching.

#### [NEW] [utils/aiVerification.test.js](file:///c:/Users/Kurt%20Perez/mission17/mission17-backend/utils/aiVerification.test.js)
- Test `isValidImageUri` accepts base64 data URLs.
- Test `isValidImageUri` accepts valid `/uploads/<filename>` formats.
- Test `isValidImageUri` accepts HTTPS cloudinary domains.
- Test `isValidImageUri` rejects malicious URLs (e.g., `http://localhost`, `file:///etc/passwd`, sentinel values).

## Verification Plan

### Automated Tests
- Run `npm install -D supertest` inside `mission17-backend`.
- Run `npm test -- --runInBand` and verify all suites pass cleanly.
