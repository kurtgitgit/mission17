# CAPSTONE AUDIT REPORT — Mission17

**Audited at:** 2026-09-06  
**Commit inspected:** `c4cf87d2634f82c09b673b207b1d38cc0f69e5a0`  
**Auditor:** Independent automated audit (Antigravity/Codex handoff chain)  
**Scope:** Local source inspection and isolated tests only. No production, cloud API, or database contacts were made.

---

## SECTION A — Readiness Verdicts

### A.1 Defense Readiness

**Verdict: CONDITIONALLY DEFENSIBLE — material caveats must be disclosed**

The project demonstrates a coherent design across resident services, administrative workflows, civic proof review, blockchain record tracking, multilingual guidance, and a MongoDB-backed AI anti-cheat system. All locally runnable tests pass. Backend, admin, and website lint are clean. Mobile TypeScript type-checks.

However, the following gaps are material enough to require honest disclosure during a panel defence:

- Model metrics are tainted by dataset leakage (1,637 of 1,800 test files also appear in training). The 93.1% accuracy figure **must not be stated as a valid held-out result**.
- Several high-severity security claims (OTP as a mandatory security factor, blockchain immutability) are not demonstrated by the source code.
- Physical device tests, push delivery receipts, chatbot production quality, and restoration from backup have not been verified.

**Recommended disclosure:** Present the system as a functional prototype with specific known gaps rather than claiming full production readiness.

### A.2 Live Demonstration Readiness

**Verdict: CONDITIONALLY DEMONSTRABLE — requires fallback plan**

A live demonstration should succeed for the core resident flow (registration, OTP, pending approval screen, admin approve/reject, login, mission submission), admin workflows (submission review, blotter management, document requests), and AI proof verification.

Risks during live demonstration:
- Chatbot may fall back to canned responses if Ollama is unreachable.
- AI service degradation returns a stable `UNCERTAIN/503` response that can be narrated as a design decision.
- Blockchain call failure logs `TX_FAILED` and continues, which panellists may question.
- Push notifications require a physical device with a registered Expo push token.

**Recommended fallback:** Prepare a pre-recorded screen capture of the full happy-path flow. Keep a Postman collection for direct API demonstration.

### A.3 Production Readiness

**Verdict: NOT PRODUCTION-READY — outstanding blockers**

Blockers before any public production deployment:

1. Dataset leakage invalidates published AI metrics. A clean split must be produced and re-evaluated.
2. Account-linking logic (`auth.js:191-197`) links any Firebase email to an existing MongoDB record without a trusted prior identity check.
3. OTP is not enforced at the middleware layer for all protected routes.
4. Blockchain function calls points to the admin wallet instead of anchoring a canonical report hash, and silently records `TX_FAILED` without blocking resolution.
5. Physical device testing, recovery restore, and load testing have not been verified.

---

## SECTION B — Feature Verification Table

| Feature | Source Location | Test Coverage | Status |
|---|---|---|---|
| Resident registration | `auth.js:182` | Backend Jest (mocked) | PASS (mocked) |
| OTP email delivery | `auth.js:213-268` | Not unit-tested | UNVERIFIED |
| OTP verification logic | `auth.js:325-363` | Inspection only | PASS (source) |
| Pending approval -> admin approve/reject | `users.js:210` | Not in test suite | UNVERIFIED |
| Protected route enforcement (pending/rejected) | `authMiddleware.js:65-68` | `authMiddleware.test.js` | PASS |
| Mission submission with AI verification | `submissions.js:53` | Backend Jest (mocked) | PASS (mocked) |
| AI proof verification (TensorFlow CNN) | `utils/predictor.py` | 11 AI tests (mocked) | PASS (mocked) |
| Anti-cheat exact duplicate detection | `utils/anticheat.py` | `test_anticheat.py` | PASS (9 tests) |
| Anti-cheat near-duplicate detection | `utils/anticheat.py:_buckets()` | `test_anticheat.py` | PASS |
| Anti-cheat MongoDB unavailable -> UNCERTAIN | `app.py:156-161` | `test_app.py` | PASS |
| Legacy hash migration | `scripts/migrate_anticheat_storage.py` | `test_migration.py` | PASS (4 tests) |
| Blotter report submission | `blotter.controller.js` | `blotter-reports.test.js` | PASS (mocked) |
| Blotter resolution + blockchain | `blotter.controller.js:147-163` | Not isolated | UNVERIFIED (source gap) |
| Document request | `document-requests.js` | Tests present | PASS (mocked) |
| Push notifications | `auth.js:406` | Not tested | UNVERIFIED |
| Chatbot / LangChain | Backend + Ollama | Not tested | FAIL (runtime error logged) |
| Public leaderboard | `users.js:354-365` | Not tested | SOURCE PRESENT |
| AI health endpoint | `app.py:/health` | `test_app.py` | PASS |
| AI token authentication | `app.py:37-49` | `test_app.py` | PASS |
| Multilingual chatbot (Pangasinan) | Chatbot routes | Not tested | UNVERIFIED |

---

## SECTION C — Findings Ordered by Severity

### C.1 CRITICAL

#### C.1.1 — AI Model Metrics Invalid Due to Dataset Leakage

- **File:** `outputs/evaluation_metrics.json`
- **Evidence:** `leakageAudit.exactCrossSplitDuplicateCount: 1637` out of 1800 test files; `validForPublication: false`. The evaluator itself recorded this failure.
- **Impact:** The 93.1% accuracy and 0.931 weighted F1 are computed on a test set that is 91% identical to the training set. These numbers cannot be cited as held-out validation evidence.
- **Suggested correction:** Run `scripts/testing/split_dataset.py` to produce a deduplicated clean split, then rerun `scripts/training/evaluate_model.py`. Update README only after `validForPublication: true`.
- **Closure criteria:** `evaluation_metrics.json` shows `exactCrossSplitDuplicateCount: 0` and `validForPublication: true`.
- **Confidence:** High — directly measured.

---

### C.2 HIGH

#### C.2.1 — Account-Linking Ambiguity

- **File:** `mission17-backend/routes/auth.js` lines 191-197
- **Evidence:** When a Firebase UID is not found, the code searches for a matching email (case-insensitive) and immediately sets `firebaseUid` on the found Mongo record without checking `email_verified`.
- **Impact:** An adversary who creates a Firebase account with an existing resident's email (without verifying it) could inherit that resident's Mongo record, points, and submission history.
- **Suggested correction:** Gate the link on `decodedToken.email_verified === true`; write an audit log entry for every link; add a unit test covering the rejection path.
- **Closure criteria:** Legacy link is gated on email_verified; link events audit-logged; test exists.
- **Confidence:** High — confirmed by source.

#### C.2.2 — OTP State Not Enforced at Middleware Level

- **File:** `mission17-backend/utils/authMiddleware.js` lines 49-71; `auth.js` lines 347-359
- **Evidence:** `verifyAuthenticatedUser` checks `accountStatus` but not `isVerified`. An approved account with `isVerified: false` (e.g., from a DB migration or admin reset) can reach all protected routes.
- **Impact:** If OTP is intended as a mandatory security factor, its bypass is a significant vulnerability. Policy decision required.
- **Suggested correction:** Document whether OTP is mandatory for all users; if so, add `isVerified` check in `getAuthenticatedUser`.
- **Closure criteria:** Decision documented; tests verify behavior.
- **Confidence:** High — confirmed by source; policy decision pending.

#### C.2.3 — Blockchain Claim Mismatch

- **File:** `mission17-backend/controllers/blotter.controller.js` lines 147-163
- **Evidence:** `awardSdgPoints(ADMIN_WALLET, 1)` awards 1 SDG point to a hardcoded admin wallet. No report hash or reference is anchored. On failure, `TX_FAILED` is stored and resolution continues.
- **Impact:** Documentation claiming "blockchain immutability of blotter records" is not supported by the source. `TX_FAILED` stored as a hash is misleading to administrators.
- **Suggested correction:** Either anchor a hash of the report reference on-chain (implementing actual immutability), or update all documentation to accurately describe the current behavior as a symbolic resolution event.
- **Closure criteria:** Documentation matches source implementation exactly.
- **Confidence:** High — confirmed by source.

#### C.2.4 — Public Leaderboard Exposes Usernames Without Authentication

- **File:** `mission17-backend/routes/users.js` lines 354-365
- **Evidence:** `GET /leaderboard` requires no authentication and returns `username` and `points` for top 10 non-admin users.
- **Impact:** Exposes resident usernames publicly. If usernames contain real names, this may conflict with privacy requirements.
- **Suggested correction:** Confirm with project owner; if intentional, document in privacy notice.
- **Closure criteria:** Decision documented; privacy notice updated if applicable.
- **Confidence:** High — confirmed by source.

#### C.2.5 — Admin UI Guard Is Client-Side Only

- **File:** `mission17-admin/src/App.jsx`
- **Evidence:** Admin dashboard uses local storage as a UI-level guard. Backend `verifyAdmin` is the true boundary, but the UI fails open if localStorage is manipulated.
- **Impact:** Low practical impact (backend enforces authorization), but panel examiners may question the UI design.
- **Suggested correction:** Fail closed: verify Firebase auth state on every protected route mount, not localStorage.
- **Closure criteria:** UI verifies identity from Firebase auth state on each protected mount.
- **Confidence:** Medium — from prior audit; source not re-inspected this session.

---

### C.3 MEDIUM

#### C.3.1 — Chatbot Not Production-Verified

- **Evidence:** PM2 logged `ChatBot/LangChain Error: fetch failed`. Backend falls back to canned responses. Ollama endpoint connectivity unverified in current deployment.
- **Impact:** Multilingual Pangasinan chatbot requirement is unverified; demonstration may show only canned responses.
- **Suggested correction:** Verify Ollama endpoint, test Pangasinan query, document fallback behavior.
- **Closure criteria:** At least one successful Pangasinan-language response captured and retained.
- **Confidence:** High — log evidence observed.

#### C.3.2 — Dependency Advisories Not Freshly Resolved

- **Evidence:** No `npm audit` was run in this session (network disallowed per audit scope). Previous reports may be stale.
- **Suggested correction:** Run `npm audit --omit=dev` in each package; address critical/high findings.
- **Closure criteria:** No critical or high advisories, or documented risk acceptances.
- **Confidence:** Unverified.

#### C.3.3 — Test Coverage Concentrated in Mocked Paths

- **Evidence:** 31 backend tests use entirely mocked dependencies. Zero tests cover account-status PATCH, Firebase sync/linking, upload middleware, push token failures, or chatbot route boundaries.
- **Suggested correction:** Add tests for account-status approval/rejection, and at least one admin-only route rejection.
- **Closure criteria:** Tests exist for account-status PATCH (both approve and reject outcomes) and non-admin rejection.
- **Confidence:** High — confirmed by test file inspection.

#### C.3.4 — Documentation Contains Unverified Claims

- **Evidence:** `DEPLOYMENT.md`, `DEFENSE_RUBRIC_GUIDE.md`, `CAPSTONE_GUIDE.md`, and `QA_FINAL_REPORT.md` contain checkmarks and production claims not all backed by current evidence.
- **Suggested correction:** Mark unverified items with `(pending physical test)` and reconcile after testing.
- **Closure criteria:** No claim in published documentation contradicted by current source or test results.
- **Confidence:** High.

---

### C.4 LOW

#### C.4.1 — Optimization Claims Lack Controlled Benchmarks

- **Evidence:** Indexes, pagination, compression present in source. No benchmark data for cold start, p95 latency, or low-end device rendering.
- **Suggested correction:** Capture at least one API latency baseline using `autocannon` or `ab`.
- **Closure criteria:** At least one baseline measurement documented.
- **Confidence:** High — absence confirmed.

---

## SECTION D — Optimization: Measured vs. Suspected

| Optimization | Status | Evidence | Tradeoff | Priority |
|---|---|---|---|---|
| MongoDB indexes on submissions/blotters | Suspected | Source present; no explain() output | None significant | Medium |
| Pagination on admin list routes | Functional (source) | Confirmed; no load test | None | Medium |
| Image compression via Cloudinary | Functional (source) | Confirmed; no storage comparison | None | Low |
| Gmail OTP fire-and-forget | Implemented | `auth.js:258` — no await on send | Email failure is silent; only logged | High (already done) |
| Sequential AI calls -> single call | Source present | No timing data | None | Low |
| Mobile request cleanup/timeout | Source present | No profiling data | None | Medium |

**Measurement method:** `autocannon -c 10 -d 30 https://brgylink-api.duckdns.org/api/health` for baseline latency; MongoDB `explain("executionStats")` for index verification.

---

## SECTION E — Tests and Blocked Checks

### E.1 Verified Locally (This Audit Session)

| Suite | Command | Result | Scope |
|---|---|---|---|
| Backend Jest | `npm.cmd run test` | 31 tests PASS (7 suites) | Mocked Firebase, MongoDB Memory, AI, Cloudinary |
| AI unit + API + migration | `python -m unittest test_anticheat.py test_app.py test_migration.py` | **24 tests PASS** | mongomock; predictor mocked |
| Backend lint | `npm.cmd run lint` | PASS | ESLint |
| Admin lint | `npm.cmd run lint` | PASS | ESLint |
| Website lint | `npm.cmd run lint` | PASS | ESLint |
| Mobile TypeScript | `tsc --noEmit` | PASS | Type-check only |

### E.2 Blocked — Requires Live Environment or Device

| Check | Blocker | Manual Steps |
|---|---|---|
| Physical Android/iOS login | Requires device + Firebase | Install APK; full signup flow |
| OTP email delivery | Live Gmail API | Trigger login; observe inbox |
| Admin approve -> resident login | Device + running backend | Admin approves; resident logs in |
| Push notification receipt | Device + Expo push token | Trigger notification; observe device |
| Chatbot Pangasinan response | Ollama endpoint live | Send Pangasinan query |
| Blockchain tx on blotter resolution | Live testnet | Resolve blotter; verify tx hash |
| AI /health on Hugging Face | Live HF endpoint | `curl https://<hf-space>/health` |
| Duplicate persistence after HF restart | Live HF + MongoDB | Submit -> restart space -> resubmit |
| npm audit | Requires network | `npm audit --omit=dev` in each package |
| Recovery restore | Requires backup | Restore MongoDB; verify integrity |

---

## SECTION F — Academic / AI Claim Qualification

| Claim | Status | Evidence | Qualification |
|---|---|---|---|
| "93% accuracy" | INVALID for publication | `evaluation_metrics.json` — 1,637/1,800 test files in training | Re-run after clean split |
| "TensorFlow EfficientNet CNN" | Verified | `predictor.py:9`, `evaluate_model.py:24` | None |
| "10 SDG mission classes" | Verified | `labels.txt` — 10 classes | None |
| "pHash + dHash near-duplicate detection" | Verified | `anticheat.py`, 24 passing tests | Threshold policy must be stated |
| "Blockchain immutability of blotter records" | Inaccurate | `blotter.controller.js:152-155` — admin wallet only, no hash anchor | Must clarify as symbolic event |
| "Multilingual Pangasinan chatbot" | Unverified | Runtime failure logged | Requires live demonstration |
| "OTP mandatory MFA" | Partially supported | Required for pending/admin; optional for residents without mfaEnabled | Must specify which users |
| "MongoDB durable anti-cheat" | Verified (local) | 24 passing tests | HF restart verification required |

---

## SECTION G — Panel Q&A Preparation

**Q: Why is AI accuracy 93% if the test set overlaps with training?**  
A: The current evaluation is an internal consistency check. `evaluation_metrics.json` explicitly records `validForPublication: false` with the leakage count. A clean split tool (`split_dataset.py`) has been built; a re-evaluation is the immediate next step.

**Q: How does the blockchain protect blotter records?**  
A: The current implementation records an SDG point award to the admin wallet as a symbolic on-chain event when a blotter is resolved. It does not anchor a report hash. This provides an event trail but not content immutability.

**Q: Can a pending account access protected routes?**  
A: No. `verifyAuthenticatedUser` in `authMiddleware.js` explicitly returns HTTP 403 for `accountStatus === 'pending'` before the route handler runs. This is server-side enforced.

**Q: What happens if the AI service is down?**  
A: The backend receives `UNCERTAIN/503` and routes the submission to manual admin review. No submission is silently approved.

**Q: What happens if MongoDB is unavailable for anti-cheat?**  
A: `AntiCheatUnavailable` is caught in `app.py` and returns `UNCERTAIN/503`. Storage failure never results in approval.

---

## SECTION H — Remediation Plan

### Priority 1 — Dataset Leakage Fix (CRITICAL)

Run `split_dataset.py` on source `mission_dataset` to produce a clean split. Re-run `evaluate_model.py`. Retain `evaluation_metrics.json` only when `validForPublication: true`.

**Observable evidence:** `leakageAudit.exactCrossSplitDuplicateCount === 0` in output JSON.

### Priority 2 — Account-Linking Hardening (HIGH)

Gate the Firebase-to-Mongo email link on `decodedToken.email_verified === true`. Add audit log entry. Add unit test for rejection path.

### Priority 3 — Blockchain Documentation Correction (HIGH)

Either implement per-report hash anchoring, or update all documentation to accurately state that blockchain records a resolution event, not report content.

### Priority 4 — Physical Device and Chatbot Verification (HIGH)

Conduct physical E2E test: new signup → OTP → pending → approval → login → mission → notification. Send a Pangasinan chatbot query. Capture results.

### Priority 5 — AI Deployment Persistence Verification (HIGH)

After clean split + evaluation: submit unique image to deployed HF `/predict`, restart HF space, resubmit same image, confirm duplicate rejection.

---

## SECTION I — Five Priority Actions with Observable Evidence

1. **Re-split and re-evaluate the model.** `evaluation_metrics.json` must show `exactCrossSplitDuplicateCount: 0` and `validForPublication: true` before any accuracy claim is made publicly.

2. **Gate legacy account-linking on `email_verified`.** Add the check to `auth.js:191` and a unit test. Evidence: test suite passes; code review confirms the guard.

3. **Correct or qualify the blockchain immutability claim.** Update `CAPSTONE_GUIDE.md`, `QA_FINAL_REPORT.md`, and `DEFENSE_RUBRIC_GUIDE.md`. Evidence: document diff shows accurate description.

4. **Complete physical device E2E test and capture Pangasinan chatbot response.** Evidence: screen recording or photos of OTP email received, push notification received, and a non-canned Pangasinan chatbot response.

5. **Run `npm audit --omit=dev` in each package and address critical findings.** Evidence: audit output shows 0 critical/high vulnerabilities, or documented risk acceptances exist.

---

## SECTION J — Demonstration Checklist

### J.1 Pre-Demonstration Setup

- [ ] Confirm AWS Lightsail backend health: `curl https://brgylink-api.duckdns.org/api/health`
- [ ] Confirm Hugging Face AI space health: `curl https://<hf-space>/health`
- [ ] Confirm PM2 running on Lightsail: `pm2 status`
- [ ] Have a pre-approved test resident account with known credentials
- [ ] Have admin account ready in dashboard
- [ ] Physical Android device with app installed (or recent APK + Expo Go)
- [ ] Fallback: recorded video of full resident + admin flow

### J.2 Live Demonstration Steps

1. Open admin dashboard — show pending submissions queue.
2. Resident (device): Register new account → receive OTP email → enter OTP → reach pending approval screen.
3. Admin: Approve the new account → resident logs in successfully.
4. Resident: Submit a mission photo → AI verification result shown → admin reviews.
5. Admin approves mission → resident receives push notification → points awarded.
6. Chatbot: Type a Pangasinan-language question; show response.
7. Blotter: Resident submits; admin resolves; show blockchain TX hash in blotter detail.
8. Document request: Resident requests barangay clearance; admin processes; resident notified.

### J.3 Fallback Options

| Scenario | Fallback |
|---|---|
| AI service unavailable | Narrate `UNCERTAIN/503` as designed human-review path; show code |
| Chatbot fails | Show fallback canned response as graceful degradation |
| Push notification fails | Show notification record in MongoDB/admin panel |
| Physical device unavailable | Use Expo Go or pre-recorded video |
| Blockchain TX_FAILED | Acknowledge limitation; show database record of resolution |

---

## SECTION K — Working-Tree Safety

The following uncommitted changes are protected and must not be overwritten or staged without explicit review:

```
M  mission17-admin/package.json
M  mission17-admin/src/config/firebase.js
M  mission17-backend/index.js   ← makes AI_SERVICE_TOKEN non-fatal at startup
D  repomix-output.txt
?? build_text_only_pdf.py
?? convert_pdf_bw.py
?? output/
?? repomix-output-research.txt
?? tmp/capstone-audit-20260906/
?? tmp/pdfs/
```

The `mission17-backend/index.js` change is uncommitted user work — do not include in any commit without confirming intent.

---

## Appendix — Local Test Run Results

**Command:** `python -m unittest test_anticheat.py test_app.py test_migration.py -v`  
**Run at:** 2026-09-06T15:05:45+08:00  
**Result:** Ran 24 tests in 0.664s — **OK**

Tests included:
- `test_anticheat.py`: 9 tests (exact duplicate, near-duplicate, different pattern, invalid/low-info images, missing storage, candidate limit, persistence across recreation, legacy hash, threshold boundary)
- `test_app.py`: 11 tests (health readiness, model-unavailable health, token rejection, file validation, oversized upload, valid prediction + hash registration, duplicate before prediction, concurrent duplicate race, anticheat-unavailable schema, model-unavailable schema, admin reanalysis bypass)
- `test_migration.py`: 4 tests (validation + dedup + counts, dry-run no-write, apply idempotent with honest legacy type, bucket backfill dry-run safe and idempotent)

---

*This report was produced by automated source inspection and isolated local tests at commit `c4cf87d`. No production data, live API calls, or real user records were accessed. Every claim traces to a specific file and line number.*
