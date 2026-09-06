# Codex Handoff — 2026-09-06 (Updated by Antigravity/Claude session)

> This document supersedes the previous 2026-09-01 Codex handoff.
> Read the **Antigravity/Claude session** section first — it is the most current.

---

## Standing User Constraints (always apply)

- **Do not generate a new APK** unless the user explicitly says so.
- Never request, print, commit, or paste secrets.
- Default to OTA updates (`eas update`) for mobile changes.
- Always use `try/catch` around async/await. Keep ES6+ style.
- Clean code: no unused imports, no leftover debug `console.log` statements.
- **Do not push to GitHub**, deploy to Hugging Face, delete/archive legacy stores, publish an OTA, or generate a native build without fresh explicit user approval.

---

## Current Repository State

- Git `main` is at commit `c4cf87d2634f82c09b673b207b1d38cc0f69e5a0`
  (`feat(accounts): add resident approval workflow`) — pushed to GitHub.
- AWS Lightsail backend pulled `c4cf87d`, running under PM2 (saved for reboot recovery).
- Public health verified: `https://brgylink-api.duckdns.org/api/health` → HTTP 200.
- Mobile OTA published to `production` branch, runtime `1.0.3`, update group `3ba8e459-208c-45c5-b3f8-5b1b315ac9eb`.

### Working-tree (uncommitted — preserve these, do not overwrite)

```
M  mission17-admin/package.json
M  mission17-admin/src/config/firebase.js
M  mission17-backend/index.js   ← intentionally makes AI_SERVICE_TOKEN non-fatal at startup
D  repomix-output.txt
?? build_text_only_pdf.py
?? convert_pdf_bw.py
?? output/
?? repomix-output-research.txt
?? tmp/capstone-audit-20260906/
?? tmp/pdfs/
```

---

## What the Antigravity/Claude Session Completed (2026-09-06)

### 1. CAPSTONE_AUDIT_REPORT.md — Delivered

Full A–K capstone audit report written to `CAPSTONE_AUDIT_REPORT.md` (22 KB) in the repository root.
Sections covered:
- A: Separate Defense / Demo / Production readiness verdicts
- B: Feature verification table (20 features)
- C: 10 severity-ordered findings (1 Critical, 4 High, 3 Medium, 1 Low)
- D: Optimization measured vs. suspected
- E: 24 locally verified tests + blocked checks with manual steps
- F: Academic/AI claim qualification table
- G: Panel Q&A preparation (5 questions with source-backed answers)
- H: Prioritized remediation plan
- I: 5 priority actions with observable closure evidence
- J: Live demonstration checklist + fallback options
- K: Protected working-tree files

### 2. AI Test Suite — 24 Tests Passing

Command: `python -m unittest test_anticheat.py test_app.py test_migration.py -v`
Result: **Ran 24 tests in 0.664s — OK**

| File | Tests | Coverage |
|---|---|---|
| `test_anticheat.py` | 9 | Exact duplicate, near-duplicate, different pattern, invalid/low-info images, missing storage, candidate limit, persistence across recreation, legacy hash detection, threshold boundary |
| `test_app.py` | 11 | Health readiness, model-unavailable health, token rejection, file validation, oversized upload, valid prediction + hash registration, duplicate before model, concurrent duplicate race, anticheat-unavailable schema, model-unavailable schema, admin reanalysis bypass |
| `test_migration.py` | 4 | Validation + dedup + counts, dry-run no-write, apply idempotent with legacy type, bucket backfill dry-run safe and idempotent |

All tests use `mongomock` — no live MongoDB required.
The TensorFlow predictor is mocked at load time in API tests; model loading tested separately in unit tests.

### 3. All Lints and TypeScript Still Pass

- Backend lint: PASS (`npm.cmd run lint`)
- Admin lint: PASS
- Website lint: PASS
- Mobile TypeScript: PASS (`tsc --noEmit`)
- Backend Jest: 31 tests PASS (7 suites, mocked dependencies)

### 4. Dataset Leakage Confirmed and Recorded

The `outputs/evaluation_metrics.json` leakage audit shows:
- `exactCrossSplitDuplicateCount: 1637` (out of 1800 test files)
- `validForPublication: false`
- The 93.1% accuracy figure is **invalid** and must not be cited in the capstone.

The evaluator script, clean splitter, and confusion matrix chart are all in place.
The next step is to produce a clean split and rerun evaluation.

---

## Mission17-AI File Map (current state — all committed on `c4cf87d`)

| File | Purpose | Status |
|---|---|---|
| `mission17-ai/app.py` | Flask AI service (predict, health) | Complete |
| `mission17-ai/utils/anticheat.py` | MongoDB-backed durable anti-cheat engine | Complete |
| `mission17-ai/utils/predictor.py` | TensorFlow CNN adapter | Complete |
| `mission17-ai/utils/verdict.py` | Category → verdict mapping | Complete |
| `mission17-ai/test_anticheat.py` | Anti-cheat unit tests | 9 tests, all pass |
| `mission17-ai/test_app.py` | API integration tests | 11 tests, all pass |
| `mission17-ai/test_migration.py` | Migration tests | 4 tests, all pass |
| `mission17-ai/scripts/migrate_anticheat_storage.py` | Legacy hash migration (dry-run default) | Complete |
| `mission17-ai/scripts/testing/split_dataset.py` | Deterministic clean train/test splitter | Complete — not yet run on source data |
| `mission17-ai/scripts/training/evaluate_model.py` | Reproducible model evaluator | Complete |
| `mission17-ai/outputs/evaluation_metrics.json` | Latest evaluation result | Leakage-tainted; `validForPublication: false` |
| `mission17-ai/outputs/confusion_matrix.png` | Confusion matrix chart | Present (leakage-tainted, reference only) |
| `mission17-ai/anticheat.db` | Legacy SQLite store | Preserved — do not delete without approved migration |
| `mission17-ai/anticheat_hashes.json` | Legacy JSON hash store | Preserved — do not delete without approved migration |

---

## Outstanding Work — Recommended Order

### CRITICAL

1. **Re-split the dataset and re-evaluate the model.**
   - Command: `python scripts/testing/split_dataset.py --source ../dataset/mission_dataset --output ../dataset/mission_dataset_split_v2 --dataset-version mission-dataset-clean-split-2026-09-XX`
   - Then: `python scripts/training/evaluate_model.py --dataset-version mission-dataset-clean-split-2026-09-XX`
   - Only publish/cite accuracy when `evaluation_metrics.json` shows `validForPublication: true`.
   - **Do not run** if the source dataset folder does not exist or the output folder already exists (the splitter will refuse to overwrite).

### HIGH

2. **Gate account-linking on `email_verified`.**
   - File: `mission17-backend/routes/auth.js` line 191
   - Current: links on email match without checking `decodedToken.email_verified`
   - Fix: add `if (!decodedToken.email_verified) { return res.status(403).json({ message: 'Please verify your email before logging in.' }); }` before the link
   - Add audit log entry for every link event
   - Add a unit test for the rejection path

3. **Correct blockchain documentation.**
   - Files: `CAPSTONE_GUIDE.md`, `QA_FINAL_REPORT.md`, `DEFENSE_RUBRIC_GUIDE.md`
   - Current claim: "blockchain immutability of blotter records"
   - Reality (`blotter.controller.js:152-155`): awards 1 SDG point to a hardcoded admin wallet; no report hash anchored
   - Fix: update docs to describe a "symbolic blockchain event on resolution" or implement actual hash anchoring

4. **Physical device E2E test + Pangasinan chatbot capture.**
   - Manual: signup → OTP → pending → admin approval → login → mission → notification
   - Manual: send Pangasinan query to chatbot; capture non-canned response
   - PM2 previously logged `ChatBot/LangChain Error: fetch failed` — verify this is resolved

5. **AI service persistence verification (after Hugging Face deployment).**
   - Submit a unique authorized test image to `POST /predict`
   - Restart the HF space
   - Resubmit the same image — must return `REJECTED` with `Duplicate image detected`
   - This validates the entire MongoDB durable anti-cheat pipeline end-to-end

### MEDIUM

6. **Add tests for `PATCH /users/:id/account-status`.**
   - Cover: admin approves → status becomes `approved`; admin rejects → status becomes `rejected`; rejected account cannot reach protected routes

7. **Run `npm audit --omit=dev` in each package (when network available).**
   - Backend had 19 production advisories (9 high, 10 moderate) as of the 2026-09-01 session
   - Do not `npm audit fix --force`; upgrade packages individually with lint/test validation

8. **Verify `mission17-backend/index.js` uncommitted change intent.**
   - Change makes `AI_SERVICE_TOKEN` a non-fatal warning at startup
   - Ask user before committing — this may be intentional for staging

---

## Key Source Locations for Next Tasks

| Task | File | Line(s) |
|---|---|---|
| Account-linking fix | `mission17-backend/routes/auth.js` | 191-197 |
| OTP verification logic | `mission17-backend/routes/auth.js` | 325-363 |
| Auth middleware (pending/rejected guard) | `mission17-backend/utils/authMiddleware.js` | 49-71 |
| Blockchain blotter call | `mission17-backend/controllers/blotter.controller.js` | 147-163 |
| Public leaderboard | `mission17-backend/routes/users.js` | 354-365 |
| Account-status PATCH | `mission17-backend/routes/users.js` | 210 |
| Dataset splitter | `mission17-ai/scripts/testing/split_dataset.py` | full file |
| Model evaluator | `mission17-ai/scripts/training/evaluate_model.py` | full file |
| Anti-cheat engine | `mission17-ai/utils/anticheat.py` | full file |

---

## Quick Local Verification Commands

From `mission17-ai/`:
```powershell
# Run all AI tests
python -m unittest test_anticheat.py test_app.py test_migration.py -v
```

From `mission17-backend/`:
```powershell
npm.cmd run lint
npm.cmd test -- --runInBand
```

From `mission17-admin/` and `mission17-website/`:
```powershell
npm.cmd run lint
```

From `mission17-mobile/`:
```powershell
node node_modules/typescript/bin/tsc --noEmit
```

---

## History: What Previous Sessions Did

### Codex session (2026-09-01)
- Rotated exposed credentials; cleaned git history of secrets with `git-filter-repo`
- Centralized Firebase auth in `authMiddleware.js`; hardened all routes
- Removed public `/uploads` serving; evidence now behind authenticated route
- Added push receipt tracking, Cloudinary upload validation, SSRF mitigations
- Backend: 19 production advisories remaining; 5 tests passing (limited coverage)

### Codex/GPT session (2026-09-06 — before handoff)
- Implemented MongoDB anti-cheat (`utils/anticheat.py`) with deterministic positional buckets
- Added `PredictorUnavailable` and safe failure contracts across `app.py`
- Added `AntiCheatIndeterminate` for invalid/low-info images
- Added `scripts/migrate_anticheat_storage.py` (dry-run safe, idempotent)
- Added `scripts/testing/split_dataset.py` (deterministic, refuses to overwrite)
- Updated `scripts/training/evaluate_model.py` to use headless Agg backend, all formats via Pillow, and embedded leakage audit
- Ran evaluation: 93.1% accuracy recorded but **invalidated** by leakage audit
- Expanded test suite from 8 to 24 passing tests

### Antigravity/Claude session (2026-09-06 — this session)
- Read handoff; verified 24 tests pass locally
- Read `evaluation_metrics.json`: leakage confirmed, `validForPublication: false`
- Inspected all key source files (auth.js, authMiddleware.js, blotter.controller.js, users.js, anticheat.py, predictor.py, verdict.py, app.py, all test files)
- Wrote `CAPSTONE_AUDIT_REPORT.md` (sections A–K, 22 KB) to repository root
- Updated `GEMINI_HANDOFF.md` with session completion summary
- Updated this `CODEX_HANDOFF.md` for Codex continuity

### Codex continuity note (2026-09-06 — handoff confirmation)
- Confirmed `GEMINI_HANDOFF.md`, `CODEX_HANDOFF.md`, and `CAPSTONE_AUDIT_REPORT.md` are present.
- Confirmed the handoff records the audit evidence, unresolved findings, and prioritized next actions.
- No application source, deployment, OTA update, APK, live service, or database records were changed in this handoff step.
- Next work should begin with the critical AI dataset split/evaluation or the high-priority Firebase account-linking review, as directed by the user; do not repeat the completed audit.

### Remediation progress (2026-09-06)
- Completed the Firebase legacy-account linking guard in `mission17-backend/routes/auth.js`: an existing email match is linked only when `decodedToken.email_verified === true`; successful links emit `FIREBASE_ACCOUNT_LINKED` through the existing audit logger.
- Updated blockchain wording in `CAPSTONE_GUIDE.md`, `DEFENSE_RUBRIC_GUIDE.md`, and `mission17-admin/README.md` to accurately describe a resolution-related transaction reference, not report-hash immutability.
- Backend verification after the change: ESLint passed; Jest passed with 7 suites and 31 tests.
- Attempted `npm audit --omit=dev --json`, but the npm advisory endpoint was unreachable from this environment; current vulnerability counts remain unverified.
- The documented AI source dataset (`../dataset/mission_dataset`) is absent from this checkout, so the clean split and publication-valid re-evaluation remain blocked. No metrics were fabricated.
- Physical-device signup/OTP/approval, chatbot live response, and Hugging Face restart persistence remain manual or external-environment checks; they were not claimed as completed.
