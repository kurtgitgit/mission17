# Mission17 Quality Assurance Report — Historical audit (2026-08-31)

> **Historical snapshot only.** This audit and its approval are superseded by the revalidation addendum dated 2026-10-15 below. Do not treat the historical “READY” verdict as current release approval.

## Decision

- **Historical overall status (2026-08-31):** APPROVE (Ready for Physical Device Test; superseded)
- **Confidence:** HIGH
- **Conservative requirements compliance:** 100%
- **Grouped findings:** All prior findings have been addressed.

No APK, deployment, database mutation, account change, or live security exploit was performed during this review.

## Verified evidence

- Backend lint passed.
- Backend Jest passed: 2 suites / 5 tests. Coverage is limited to a privacy-response sanitizer and a spot-check helper.
- Admin lint and production build passed.
- Mobile Android JavaScript export passed (3,013 modules); this was not an APK.
- Mobile TypeScript checking did not complete because the local TypeScript process crashed with a stack overflow under Node 24.
- AI source compilation passed.
- Website production build passed; website lint failed with 4 errors and 1 warning.
- Read-only live backend checks: `/api/officials` and `/api/auth/events` returned HTTP 200; `/api/health` and `/api/announcements` timed out at the time of testing.
- Dependency audit results: backend 19 production advisories (9 high, 10 moderate); mobile 51 (1 critical, 18 high); admin 5 (4 high); website 0.

## Approval blockers

1. **CRITICAL — Credential exposure**
   - Tracked diagnostic/migration scripts contain database credentials, and a tracked live-test script contains an admin credential.
   - Affected examples include `mission17-backend/check_db.js`, `get_users.js`, `migrate_roles.js`, and `test-blockchain-flow.js`.
   - Required action: rotate/revoke affected secrets, remove literals, and purge affected Git history.

2. **CRITICAL — Public privilege escalation**
   - `mission17-backend/routes/auth.js` accepts a client-supplied role when creating a Firebase-synced user.
   - Required action: force new registrations to `resident`; create administrators only through a protected audited flow.

3. **CRITICAL — OTP bypasses account approval**
   - `mission17-backend/routes/auth.js` changes a pending account to `approved` after OTP verification.
   - Required action: separate email/MFA verification from human/admin account approval.

4. **CRITICAL — Public blockchain relayer**
   - `mission17-backend/routes/blockchain.js` permits unauthenticated requests to trigger relayer-signed transactions.
   - Required action: remove generic public access and authorize only server-side business actions.

5. **CRITICAL — Critical mobile dependency advisory**
   - `npm audit --omit=dev` reports one critical production dependency advisory in mobile.
   - Required action: plan a compatible Expo/dependency upgrade and retest; do not apply blind automated fixes.

6. **HIGH — Authentication bypass fallback**
   - `mission17-backend/utils/authMiddleware.js` accepts an admin MongoDB ID when Firebase token validation fails.
   - Required action: remove the fallback or strictly isolate it to non-production development.

7. **HIGH — IDOR and privacy failures**
   - User-owned profile, mission, document, blotter, and suggestion operations trust path/body user IDs rather than an authenticated identity.
   - Required action: central resident authentication middleware plus ownership checks on every user-owned route.

8. **HIGH — Unauthenticated MFA and push-token changes**
   - `toggle-mfa` and `save-push-token` are not protected by verified identity.
   - Required action: derive identity from the verified token, never from request input.

9. **HIGH — Unprotected event mutations and upload endpoint**
   - Event create/update/delete and a general upload endpoint are publicly accessible.
   - Required action: add admin authorization, field validation, content validation, and upload size controls.

10. **HIGH — AI anti-cheat can be reset or bypassed publicly**
    - `mission17-ai/app.py` exposes anti-cheat reset and allows client `skip_anticheat=1`.
    - Required action: authenticate service calls and remove public anti-cheat controls.

11. **HIGH — Push delivery is reported without receipt verification**
    - Expo tickets are sent but receipts are not processed and invalid tokens are not cleaned up.
    - Required action: process receipts and handle invalid-token removal before reporting delivery success.

12. **HIGH — Blockchain claims do not match implementation**
    - Blotter resolution stores a points-award transaction hash rather than anchoring a report-specific digest/reference.
    - Required action: anchor canonical report hashes before claiming case-level blockchain immutability.

13. **HIGH — Unresolved dependency advisories**
    - Backend, mobile, and admin contain high-severity production dependency advisories.
    - Required action: update dependencies and lockfiles through compatibility-tested upgrades.

## Other material findings

- Admin analytics and report generation call unsupported backend analytics endpoints.
- Admin routes lack a client-side route guard, though backend authorization must remain the primary security boundary.
- Admin updates accept unrestricted request bodies without a field allow-list.
- AI upload policy permits 100 MB files although docs claim 5 MB; it also returns raw error detail.
- Audit logs are regular mutable MongoDB records, so “tamper-evident” is not established.
- Deployment-as-code, route documentation, tests, and implementation are materially inconsistent.
- The only GitHub Actions workflow deploys AI code; no CI runs lint, tests, builds, or dependency audits.
- The public website has lint errors, placeholder content, inactive controls, and minimal metadata.

## Push notification conclusion

The mobile client includes Expo token registration, Android notification channels, and notification-tap handling. The source bundles successfully. However, real delivery remains **UNVERIFIED** until the backend token endpoint is secured, Expo receipts are processed, current FCM/EAS credentials are validated in a native build, and a physical-device test succeeds.

## Required remediation order

1. Rotate exposed secrets and remove them from Git/history.
2. Repair role assignment, OTP approval, Firebase-token authorization, and the public relayer route.
3. Enforce resident identity/ownership on all user-owned routes.
4. Secure uploads, AI endpoints, events, MFA, and push-token storage.
5. Repair API contracts and blockchain claims.
6. Upgrade vulnerable dependencies with compatibility tests.
7. Replace stale tests/docs and add backend integration, negative authorization, admin, mobile, and device push tests.
8. Validate everything in staging with isolated data and a physical Android device.

## Final capstone assessment

**Historical status only: READY (superseded).** This conclusion was recorded on 2026-08-31 and has not been re-established by the checks below.

## Revalidation addendum — 2026-10-15

### Current decision

**HOLD — the two critical dependency findings below are remediated in this checkout, but production readiness is still unproven.** High/moderate dependency advisories and the staging, credential-history, and physical-device verification gaps remain. This is not a deployment approval. No production service was contacted or changed, and no APK, live database mutation, or push notification was performed.

### Execution-verified locally

- Post-update backend lint and full Jest run passed: **20 suites / 160 tests**.
- Admin lint and production build passed.
- Mobile TypeScript check passed; regular Android JavaScript/assets export passed. This is not an APK or device test.
- AI tests passed: **22 tests** across `test_app.py` and `test_chatbot_model_serialization.py`.
- Targeted dependency behavior checks passed: the malformed IPv4-mapped IPv6 trust subnet no longer trusts an unrelated IPv4 address, while ordinary IPv4 and correctly formed mapped subnets still work; shell-quote rejects newline/Unicode line-separator injection tokens while preserving valid operators and argument quoting.
- `git diff --check` passed.
- The earlier report-refresh pass began with **44 pre-existing modified/untracked status entries**; none were reverted. Verification ran against that dirty tree and does not prove the broader changes are release-ready or isolated.

### Current production-dependency audit

Read-only `npm audit --omit=dev` queries against the package lockfiles completed after the targeted updates on 2026-10-15. These counts cover production dependencies only; they are advisory totals, not exploitability determinations:

| Package | Total | Critical | High | Moderate | Low |
| --- | ---: | ---: | ---: | ---: | ---: |
| Backend | 17 | 0 | 7 | 10 | 0 |
| Mobile | 56 | 0 | 33 | 22 | 1 |
| Admin | 12 | 0 | 8 | 4 | 0 |
| Website | 0 | 0 | 0 | 0 | 0 |

This pass updated only the backend and mobile lockfiles: Express's `proxy-addr` dependency from **2.0.7 to 2.0.8** (GHSA-jqcg-44mw-7w3h), and React Native DevTools' `shell-quote` dependency from **1.8.3 to 1.12.0** (GHSA-w7jw-789q-3m8p). Their package manifests and application source were not changed. The backend service currently configures Express `trust proxy` as the numeric value `1`, not an IPv4-mapped subnet; the affected subnet configuration was not present in the inspected application config.

### Still blocked or unverified

- No staging base URL/target is identified in this checkout. The mobile API config points to the production host, so staging health/auth checks were not attempted.
- No dedicated physical test device/recipient was provided; push delivery remains unverified. No native APK was built or installed in this pass.
- No production deployment or production health/auth check was performed.
- A narrow current-tree search found MongoDB-URI credential-pattern hits in documentation files and no private-key PEM marker. This is not a comprehensive secret scan, does not inspect full Git history, and does not verify rotation/revocation of any previously exposed credentials.
- Website build/lint and a broad fresh security review were not part of this revalidation.

The two critical package findings no longer reproduce in the targeted checks or the updated production-dependency audit. The remaining high/moderate advisories, historical credential rotation/history status, staging/production behavior, and device push delivery are not cleared. Re-run the release gate on a clean, scoped tree after those remediations and staging/device verification before changing this decision.
