# BrgyLink English and Tagalog chatbot improvement

User authorized judgment-led inline implementation, without further planning questions. No deployment or dependency changes.

## Design
Keep the shared Express gateway and existing Flask classifier. Add source-grounded bilingual answers for current resident workflows, prioritized specific intents, polite clarification for ambiguous messages, and safe referrals for unverified facts. Public announcements stay live and visibility-filtered. Emergency and private-record safeguards stay ahead of normal answers. Do not promise arbitrary-question accuracy or expose private records, credentials, legal/medical advice, fees, or processing guarantees.

## Tasks (RED -> GREEN)
1. Add a development regression matrix covering the eight mobile FAQs, English/Tagalog paraphrases, accounts, documents, blotters, feedback, announcements, notifications, troubleshooting, language choice, unknowns, and adversarial/conflicting inputs. Run it before implementation: expected failures on missing or wrong replies.
2. Implement a small shared language helper and curated workflow-answer helper; integrate without changing endpoint contracts. Replace obsolete Home labels. Ground classifier replies rather than trusting arbitrary upstream prose. Run chatbot tests: expected all passing.
3. Verify full backend tests, lint, Node syntax, and diff whitespace. Record executed evidence and remaining device/production limitations. One independent final review; fix important findings using reproducing tests. Leave changes local and preserve unrelated dirty files.

## Sources
- Mobile ChatBotScreen.tsx: eight FAQ chips.
- HomeScreen.tsx: Documents, Blotter report, eFeedback, Officials, Barangay Bulletins.
- ServicesScreen.tsx and requestValidation.ts: document choices, fields, My Requests, pickup/payment.
- BlotterReportScreen.tsx and backend blotter controller/model: incident submission and status workflow.
- SuggestionScreen.tsx and suggestions.controller.js: Write Message, My Inbox & History, anonymity.
- LoginScreen.tsx, SignupSuccessScreen.tsx, EditProfileScreen.tsx, SettingsScreen.tsx: account/security workflows.
- NotificationsScreen.tsx: selected deletion and preferences.
- announcementVisibility.js: active and unexpired public posts.

## Review focus
Check overlapping keywords (number/email/contact/complaint), compound questions, exact-current UI labels, Taglish and explicit language choice, accidental disclosure, unsafe classifier trust, unverified local claims, archived/expired live-data filtering, and behavior when upstream AI or database is unavailable. Development cases are not an independent holdout accuracy evaluation.

## Progress ledger
- Preflight: backend-only scope; no changes to auth, rate limits, dependencies, training artifacts, mobile UI, or production data. Existing dependency and document changes are unrelated and must remain untouched.
- Workflow: retain the plan and working-tree evidence instead of skill commit/cleanup steps because this batch has no release authorization.
- Task 1 complete: existing chatbot baseline 50/50; initial new regression run 122 failed, 8 passed (71 excluded), demonstrating missing/wrong behavior before implementation. Added further edge-case tests before their fixes (17 failures) and a separate privacy regression (1 failure).
- Task 2 implemented: centralized English/Tagalog language selection, source-grounded workflow answers, specific-before-general routing, current Home labels, and allowlisted classifier answer selection. Initial combined gate passed 251/251; additional edge-case gate passed 232/232 before the final privacy fix.
- Final review: fresh Astra reviewer found three Important intent-priority bugs and two lower-graded routing defects. No Critical finding. Missing reviewer template replaced by a read-only source-and-runtime review.
- Final: Ruling: regrade ordinary follow-up routing to Important because residents asking how to follow up were told about a staff-only triage outcome instead. Fix with explicit outcome wording versus ordinary tracking tests; cost if wrong is a missed triage explanation, covered by existing outcome tests.
- Final: Ruling: regrade trailing English/Tagalog requests to Important because language choice is central to this request and common phrasing was ignored. Fix with trailing-directive tests; cost if wrong is misdetected language, covered by explicit-language regressions.
- Final: fixed all five review findings in one pass: instructional-action distinction, language-directive/topic isolation, password-before-profile priority, ordinary follow-up versus staff outcome, and trailing reply-language choice. Reproducing regression gate failed 11 cases before fixes and passed 251/251 afterward. The remaining six review-gate cases already passed and protect related boundaries.
- Final: Ruling: compound account/password wording can still need a more specific follow-up; this change does not introduce conversation history or promise universal intent coverage. Cost is an extra question or a partial answer for unusual multi-part phrasing; stated in QA limitations.
- Task 3 complete: final `npm.cmd test -- --runInBand` passed 23 suites / 452 tests (303 chatbot checks), final `npm.cmd run lint` passed, all four changed runtime modules passed `node --check`, and scoped `git diff --check` passed. Expected simulated upstream/database failure logs remain in tests. No deferred Minor findings; two were regraded and fixed. No push, commit, deployment, APK, OTA, production data mutation, or device test performed.
