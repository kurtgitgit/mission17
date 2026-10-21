# SDD ledger — plan: docs/superpowers/plans/2026-10-21-officials-directory-and-verification.md

Base: a3cf1bb8ff9ea92737b453b9923adaa4d5827796. Approved inline execution, no deployment.

Pre-flight: Tasks 1/3/4 consume the same active official ordering and published field projection; keep one server comparator and one public projection. Task 2 has pre-existing dirty error-handling changes; preserve its exact baseline.

Ruling: Work in the existing non-main codex/admin-mobile-revisions checkout, preserve unrelated work, and track scoped deltas instead of copying a dirty checkout into a new worktree — PublicVerify already contains pending fixes the new return link must coexist with — risk is accidental staging; use explicit paths and inspect staged hunks before committing.

Ruling: Use a native PowerShell ledger in docs rather than Bash-only skill bookkeeping scripts — the scripts require a POSIX toolchain not guaranteed on this Windows host — no product behavior affected.

Threat boundary: public directory/chat may return only already-published active officials' name/role/contact/term/committee; reorder is admin-only, validates complete IDs, uses transactions, and must reject stale or malformed payloads. Directory values never go to an external LLM for official answers. Preserve all existing auth, CORS, private-record and emergency guards.

Task 1: in progress. Read plan/spec and current officials route, model, admin form, layout scroll container, existing authorization tests. Transaction probe in sandbox unavailable; bounded read-only external probe requested. Controls will fail closed when support cannot be established.

Task 1: RED: actual replica-set endpoint tests failed for missing endpoint/wrong grouping; browser test reproduced offscreen edit heading. GREEN: 24/24 ordering/authorization tests, real UI edit scroll/focus/second target, removed number field, group boundaries, persisted order and conflict recovery. Windows sandbox Mongo startup failed; disposable Mongo works outside sandbox. Admin lint and build passed.

Ruling: Deployment database capability was not retrievable even with the bounded external read-only probe. Implement a staff-only runtime capability check and keep controls disabled unless true; exercise transactions on a real disposable local replica set — avoids enabling unsafe writes without asserting production support — production availability must be verified during a separately authorized deployment.

Task 2: RED browser found no return link. GREEN: fresh visit + keyboard focus + successful/failed result navigation checks passed at 390px/1440px. Existing error utility/import preserved; no admin login link added.

Task 3: RED browser could not find the newly published fixture official because site was static. GREEN: actual source website checks pass for 16 officials, two/no captains, dynamic terms, matching phones and missing/invalid numbers, explicit refresh/tab refocus, empty/error/malformed data and recovery at 390px/1440px. Public DTO exclusion checked by real API tests; CORS source already accepts mission17-app.vercel.app, no CORS edits.

Ruling: Public API field projection shipped with Task 1 because its ordering response uses the same DTO — avoids briefly exposing archive notes through the new reorder response — no additional public fields or privileged read access added.

Task 3: Website full lint/build passed after factoring initial async loading separately from refresh UI state. Browser checks repeated against the final hook, all pass.

Task 4: RED 20/23 new endpoint scenarios failed on old behavior. Implemented dedicated deterministic official-question matching module, live published-field lookup (no three-person cap), localized missing/ambiguous/outage replies, no upstream AI for failed directory lookup. Additional English/Tagalog phrasing and private-vs-normal-workflow cases tested. Existing redirected-roster endpoint assertions intentionally updated; pure offline FAQ behavior and other language workflows retained.

Ruling: Keep official matching/formatting in routes/chatbotOfficials.js rather than extending the announcement live-data formatter — the domain-specific matching is independently testable and announcement behavior should not change — one extra focused module, no new service/dependency/training.

Ruling: The original author-added normal-workflow regression asked “How does the captain resolve a blotter case?” but asserted the existing resolution answer, which that existing phrasing did not select even before this task. Narrowed the input to the existing supported “Who resolves a blotter case: the captain?” — tests the new private-record guard regression without expanding unrelated workflow classification — no change to chatbotKnowledge.js.

Task 5: Full backend suite PASS: 27 suites, 497 tests passed, 1 optional browser test skipped in ordinary runs. Opt-in integrated browser/API test separately PASS (18/18 total), including admin form creation -> real public API -> website phone -> real chatbot -> archive -> restore using one disposable Mongo replica set. Backend lint PASS. Admin lint/build PASS; website lint/build PASS. All three standalone browser checks passed again. Scoped diff whitespace check PASS. Fresh whole-change reviewer running.

No production writes, push, deployments or OTA updates. Physical dialer/device behavior not exercised.

Final review: fresh gpt-6-astra reviewer found five important issues: stale detail edit could restore an old numeric order; overlapping add/reorder could violate append order; recognized queries could reach AI when a generic exclusion returned null; capitalized named-person questions were missed; Health committee matching discarded the word Health. No minors deferred.

Final fix pass: new real-Mongo overlapping-write regressions reproduced both ordering bugs. Added one shared OfficialDirectoryRevision transaction guard for all active-directory mutations (create/edit/archive/restore/reorder), acquired before reading membership, and omitted order entirely from ordinary detail updates. Five review regressions initially RED; focused tests then GREEN. Strengthened the null-result AI test with an explicitly configured dummy service token: removing the terminal guard produced a captured upstream call (no real network call), proving the boundary test, then restored the guard.

Ruling: Serialize membership and ordinary edits with reorder using one small internal revision document — a transaction around reorder alone cannot protect against newly inserted records escaping its snapshot — adds one metadata collection and requires Mongo transaction support for all directory mutations, not only reorder. On unsupported/unconfirmed topology, writes return 503 rather than silently falling back to unsafe saves. Production topology must be checked before release; no infrastructure is changed automatically.

Final: Ruling: Review declined unrelated dirty security/blotter/dependency work and preexisting verification error handling — those remain outside this change and untouched — local suite results do not certify their production readiness.

Final: Ruling: Production database topology, actual deployment and handset behavior were not judged — no deployment was requested and local disposable replica-set verification is not production/device proof — later release must verify those separately.

Final verification: after all review fixes, full backend suite PASS: 27/27 suites, 504 passing tests, 1 optional browser test skipped. Optional browser/API integration explicitly rerun and PASS: 20/20 including overlapping create/reorder and stale edit checks. Backend lint PASS; admin lint/build PASS with no warnings; website lint/build PASS. Public website browser checks also run in its own standalone Vite app at 390px/1440px (not only the combined fixture), explicitly waiting for painted content; full roster/captain mobile screenshots visually inspected. All three source-browser regressions pass.

Ruling: Consolidate the completed tasks into one focused local commit after the full review gate rather than intermediate task commits — shared API projection, chatbot and integrated tests evolved together, and PublicVerify needs selective staging to exclude pending error fixes — trades per-task commit granularity for a self-contained tested revision. No push or deployment.
