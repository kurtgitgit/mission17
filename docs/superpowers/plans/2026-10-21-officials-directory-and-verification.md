# Officials Directory and Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make officials management intuitive and keep the website and bilingual chatbot grounded in the same current directory, with a clear exit from public verification.

**Architecture:** Preserve Express/Mongoose as the source of truth. Replace numeric order entry with role-grouped ordering controls, connect the public website to the existing active directory, and route official-information questions to deterministic live-data answers after safety checks. Make the public verification change additive to its existing dirty work.

**Tech Stack:** Existing React/Vite, Express, Mongoose, Jest/Supertest, and browser checks; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-21-officials-directory-and-verification-design.md`

## Global Constraints

- Planning only until approval; deployment requires a separate explicit request.
- Preserve `#0038A8` blue, existing website branding, routes, archive history, legacy blotter references, and unrelated dirty changes.
- Canonical website return URL: `https://mission17-app.vercel.app/`.
- One current directory; no static name/phone fallback or training-data roster.
- Publish only directory fields, never archive reasons, private records, credentials, or account/ID information.
- Keep the existing `order` range 1–99; no data migration or destructive roster script.
- Emergency and private-record safeguards run before official answers; retain other FAQ behavior and language controls.

## Review Focus

- Duplicate order values and a concurrent add/archive/reorder must not silently drop, duplicate, or partially reorder records (Task 1).
- A bottom-of-page Edit, a second Edit while the form is open, and reduced motion must all reveal the correct form with focus (Task 1).
- An unavailable directory must not display a hardcoded old captain, fabricated phone, or contradictory empty-state message (Task 3).
- Named/role-specific English and Tagalog questions must not receive the first three unrelated officials or a model-invented answer (Task 4).
- A direct verification visit with no history must still have a working return link, including after an error/result (Task 2).

---

### Task 1: Understandable officials ordering and reliable edit navigation

**Files:**
- Modify: `mission17-admin/src/pages/Officials.jsx`
- Modify: `mission17-admin/src/styles/PortalAdmin.css` (only scoped officials styles if needed)
- Modify: `mission17-backend/routes/officials.js`
- Create: `mission17-backend/utils/officialOrdering.js`
- Create: `mission17-backend/routes/officials.ordering.test.js`
- Test: `mission17-backend/routes/officials.authorization.test.js`

**Interfaces:**
- `compareOfficials(a, b)` orders by the spec's position sequence, then existing numeric order, then stable `_id` tie-break; legacy missing order behaves as 99.
- `PATCH /api/officials/reorder` (before `/:id` routes), admin-only, body `{ orderedIds: string[], expectedIds: string[] }`. Both represent the complete active roster; `expectedIds` is the ordered snapshot the client loaded. Return `{ message, officials }` on success, 400 for invalid/permuted/group-breaking payloads, 409 for stale state, and no partial changes on any failure.
- Reorder writes use a Mongoose transaction; cap the active reorder set at 99, reject larger sets clearly, and verify deployment transaction support before enabling controls. If unavailable, stop this task and report rather than introducing non-atomic multiple requests. Do not add infrastructure automatically.
- GET active/all ordering uses the same comparator. New/position-changed/restored records append within the appropriate group; existing numeric values are preserved until an intentional reorder normalizes active entries to 1..N.

- [x] Add failing tests: unauthenticated/resident denial; duplicate/invalid/archived/omitted IDs; no cross-group moves; stable duplicate weights; stale snapshot 409; simulated write failure rolls back; successful reorder survives GET; create/position-change/restore appends in the correct group. Assert no writes for rejected payloads and no archived-record changes.
- [x] Run backend Jest for `officials.ordering.test.js` and confirm the intended failures before implementation.
- [x] Implement ordering comparator, transaction-backed endpoint, and consistent read/create/update/restore behavior. Audit successful reorder through existing `logAudit`; do not change identity/duplicate protections.
- [x] Remove numeric field; show `Display order is grouped by position. Use Move up or Move down to arrange officials within the same position.` Add labeled controls, boundary/pending disabling, conflict reload prompt, and failure feedback without pretending a failed save succeeded. Never allow repeated requests while saving.
- [x] Add form/heading refs and a post-render effect keyed by edited official ID and form visibility; scroll into view then focus heading using `preventScroll`. Use instant movement for reduced motion. Apply the same visibility behavior to Add Official.
- [x] Run backend targeted tests; browser-check first/last boundaries, keyboard operation, failed save recovery, reload persistence, archived tab, bottom-of-list Edit, switching Edit targets, and reduced motion. A visible refreshed roster must match persisted order.
- [x] Commit only Task 1 source/tests after checks pass.

### Task 2: Return path from public verification

**Files:** `mission17-admin/src/pages/PublicVerify.jsx`, `mission17-admin/src/styles/PublicVerify.css`.

**Interface:** Ordinary same-tab anchor `Back to official website` -> `https://mission17-app.vercel.app/`; no auth or history requirement.

- [x] Add a browser regression assertion for a fresh `/public-verify` visit: the link is visible, keyboard reachable, and has the exact target; repeat after mocked successful and failed verification.
- [x] Confirm the assertion fails on current UI, then add the link and responsive focus styling without overwriting pending error handling or changing verification requests/results.
- [x] Run the browser checks at 390px and desktop widths; confirm no admin-login link was reintroduced. Review the delta against the pre-existing dirty patch before committing only the new task change.

### Task 3: Website uses the current published directory and contacts

**Files:**
- Modify: `mission17-website/src/App.jsx`, `mission17-website/src/index.css`
- Create: `mission17-website/src/config/api.js`
- Create: `mission17-website/src/hooks/useOfficials.js`
- Modify: `mission17-backend/routes/officials.js`
- Extend: `mission17-backend/routes/officials.authorization.test.js` or add `officials.public.test.js` for endpoint behavior.

**Interfaces:**
- Existing `GET /api/officials?status=active` returns the active ordered directory; public projection is `_id name position photo contact email term termNumber committee order`. Archived/all responses remain admin-only and preserve existing admin fields.
- `useOfficials()` -> `{ officials, loading, error, refresh }`. Read `VITE_API_BASE_URL` when set, otherwise `https://brgylink-api.duckdns.org/api`; explicit localhost override for development. Use request cancellation and stale-response protection. Fetch on mount, visible tab refocus, and refresh; no polling dependency.

- [x] Add failing endpoint tests for archived exclusion and public projection, plus browser fixtures for 13+ active officials, missing captain, multiple captain records, missing/invalid contact, edited phone/term, empty roster, malformed response, request failure, and retry/refocus refresh. Assert stored numbers keep leading zeroes and each `tel:` link belongs to the matching person.
- [x] Implement public field projection without changing protected archive reads; verify existing CORS accepts the public website and supported local preview origin without broadening production CORS to arbitrary sites.
- [x] Implement hook and remove ALL static roster/captain/term values from the officials section. Render captain records from data without silently dropping records; use saved term/termNumber, `_id` keys, and avoid duplicate `Committee on` prefixes. Preserve API order within the established role sections.
- [x] Add distinct loading, empty, and unavailable states with retry/refresh. Missing contacts show `Contact number not available`, not an invented substitute. React-render plain text, allow only validated telephone/mail links, and keep card layout responsive.
- [x] Run backend endpoint tests, website lint/build, and browser checks at 390px/desktop; confirm a changed mock roster appears after refresh and archive records never appear.
- [x] Commit only Task 3 files after passing checks.

### Task 4: Ground English/Tagalog official answers in the current directory

**Files:**
- Modify: `mission17-backend/routes/chatbot.js`
- Modify: `mission17-backend/routes/chatbotLiveData.js`
- Extend: `mission17-backend/routes/chatbot.test.js`, `mission17-backend/routes/chatbotBilingual.test.js`

**Interfaces:**
- Add `isOfficialsQuestion(message)` and `getOfficialsReply(message, officials, language)` in `chatbotLiveData.js`; the latter returns deterministic roster/person/role/committee details or a clarification/missing-information response.
- `requestLiveChatReply` officials query reads all active directory entries with only published fields; remove the arbitrary three-record cap for officials, not announcements. Match before truncation. Full-roster requests include all names/roles without claiming a partial list is complete; individual queries include available relevant committee/term/contact details.
- In the actual POST handler, preserve emergency/private-record and other applicable safety/workflow replies, but defer ordinary officials-directory redirects to live lookup. Officials lookup failure returns a localized safe answer immediately; it must not fall through to upstream AI to invent a roster.

- [x] Write failing tests through the real POST handler for captain, kagawads, secretary, treasurer, SK, named-official phone, committee leader, newly added official, full roster >3, explicit language directive, unknown name/role, missing phone, ambiguous `Who is the barangay?` / `Sino ang barangay?`, empty roster, and DB outage. Assert response language, requested person's matching details, archived exclusion, and no upstream AI call on unavailable facts.
- [x] Include negative cases: emergency involving a captain still gets emergency guidance; private account/case/ID questions are not answered from the public roster; text stored in a name/committee is rendered as data, not model instructions; unrelated FAQ/announcement and existing Ilocano behavior are not regressed.
- [x] Implement targeted matching with role aliases and normalized names. Match full names or unambiguous supported short names; ambiguous names ask for clarification instead of choosing arbitrarily. Contacts come only from published matching records.
- [x] Use distinct polite English/Tagalog copy for no match, absent field, and unavailable service; suggest the Officials directory or barangay office without supplying an unverified replacement number. Example outage: `Sorry, I cannot retrieve the current officials directory right now. Please try again or check the Officials directory.`
- [x] Update tests that intentionally asserted the old redirect-only policy; preserve safety tests. Run `npm.cmd test -- --runInBand routes/chatbot.test.js routes/chatbotBilingual.test.js` and then the backend suite/lint, recording unrelated baseline failures separately.
- [x] Commit only Task 4 files after checks pass. No AI training/deployment or mobile build is required for backend answer logic.

### Task 5: Integrated revision gate and handoff

- [x] Run admin and website `npm.cmd run lint` and `npm.cmd run build`; backend targeted tests/full suite/lint; `git diff --check`. Record execution evidence rather than inferring readiness from source alone.
- [x] Browser-test one fixture roster across admin, public website, and actual chatbot endpoint. Change/add/archive/restore an official in a disposable test environment only; verify the subsequent website fetch/chat response agrees, while a current open website updates on the next documented refresh trigger.
- [x] Visually inspect desktop/narrow screenshots for ordering control clarity, edit focus/scroll position, phone wrapping, empty/error states, and public return navigation.
- [x] Read the full scoped diff, check the five Review Focus conditions, and ensure unrelated blotter/security/dependency modifications are excluded. Record remaining device/production checks honestly.
- [x] Hand off the local result for approval. A later authorized release deploys backend first, verifies health and directory/chat endpoints, then deploys admin/website; publishing mobile OTA is not automatically needed.

## Plan self-review

All five requests map to Tasks 1–4; Task 5 checks the shared directory end to end. The grouped Move up/Move down interaction and next-fetch synchronization were approved and implemented. See `2026-10-21-officials-directory-progress.md` for execution evidence, review fixes, and documented departures from the original plan. Existing unrelated dirty work was preserved; no deployment was performed.
