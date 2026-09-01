# BrgyLink Remediation Plan

**Goal:** resolve the QA release blockers before any APK release or production deployment.

## Progress

| Step | Status | Outcome |
| --- | --- | --- |
| 1. Secure exposed credentials | In progress | MongoDB and affected Firebase administrator credentials rotated; active helper scripts are clean. Git-history cleanup remains. |
| 2. Repair authentication and authorization | Completed in source | Role escalation, OTP auto-approval, public relayer, MFA/push protection, resident ownership checks, pre-auth uploads, notification ownership, and pending-account access have been addressed. Staging verification remains. |
| 3. Repair client API contracts | In progress | Mobile uses fresh Firebase headers and enforces the approval flow; the missing admin analytics contract is restored. Remaining admin/client flows are being checked. |
| 4. Harden services and integrity features | Pending | Secure push receipts, AI endpoints, uploads, and blockchain report records. |
| 5. Build quality evidence | Pending | Resolve dependency/lint issues, add regression tests, and align documentation with the code. |
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
