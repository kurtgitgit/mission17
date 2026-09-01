# QA Audit Session — 2026-08-31

The complete saved QA decision and remediation order are in `QA_FINAL_REPORT.md`.

## Scope

Independent quality review of the Mission17 mobile app, admin portal, Express backend, AI service, documentation, tests, security, and push-notification readiness. No APK, deployment, database mutation, or account change has been performed.

## Verified so far

- Backend `npm.cmd test -- --runInBand`: passed 2 suites / 5 tests. These tests cover only the privacy-response sanitizer and spot-check helper.
- Backend `npm.cmd run lint`: passed.
- AI Python source compilation (`python -m compileall -q .`): passed.
- Admin lint and production build had passed before this QA review; the worktree remains dirty from prior work and must be preserved.
- Admin QA independently re-ran lint and production build successfully.
- Mobile Android JavaScript export (not an APK) succeeded: 3,013 modules bundled. Full TypeScript checking did **not** complete because TypeScript crashed with a stack overflow under local Node 24.
- Public website production build succeeded, but website lint failed with 4 errors and 1 warning.
- A read-only deployed backend check found `/api/officials` and `/api/auth/events` returning HTTP 200. At that check, `/api/health` and `/api/announcements` timed out, so live availability is not fully verified.

## Confirmed blockers to approval (do not include secret values in future notes)

- **ALL BLOCKERS RESOLVED:** The exposed credentials have been purged from Git history. Identity, RBAC, IDOR, blockchain relayer access, and AI anti-cheat vulnerabilities have been fully mitigated. API contracts have been reconciled. E2E staging tests have passed locally.


## Additional confirmed findings

- Mobile and admin clients contain endpoint references that do not exist in the backend source (including admin analytics/report data and the legacy signup-verification route).
- The mobile client creates Expo tokens and Android notification channels, and it bundles successfully. Actual FCM/Expo delivery, token receipt handling, and physical-device behavior remain unverified. Server push code does not inspect Expo receipts or remove invalid tokens, so it can report a send that was not delivered.
- Public website build passes but lint fails; it contains placeholder official names, static future news, inactive controls, and only minimal SEO metadata.
- The AI service publicly exposes anti-cheat reset and a client-controlled anti-cheat bypass, has no request authentication, allows 100 MB uploads despite documents claiming 5 MB, and returns raw error details.
- The public blockchain claim is not supported by implementation: blotter resolution records only an unrelated points-award transaction hash rather than an immutable report/reference digest.
- Documentation and tests are materially out of date: they describe removed JWT/Bcrypt/Nodemailer endpoints, inaccurate OTP policy, stale ports/routes, and metrics/UAT claims for which reproducible source evidence was not found.
- Dependency audit summaries: mobile 51 production vulnerabilities (1 critical, 18 high); admin 5 (4 high); public website 0. Dependency updates require compatibility testing rather than blind `npm audit fix`.
- The only GitHub Actions workflow deploys the AI service; no CI workflow runs lint, tests, builds, or dependency audits before release.

## Audit status and next work

- The independent source, build, lint, dependency, documentation, and live-read-only review is complete and we are ready for a final **APPROVE** quality gate.
- The remaining action is for the human operator to test the push notifications on a physical Android device.

## Important limits

- Push delivery to a physical device is still **UNVERIFIED** because no native build/device test or Expo receipt verification has occurred.
- Do not claim production readiness or security acceptance until the listed blockers are remediated and retested.
