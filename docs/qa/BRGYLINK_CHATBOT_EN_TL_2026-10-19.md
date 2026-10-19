# English / Tagalog chatbot development verification

Scope: shared backend, current resident app workflows, polite unknown replies. No dependency changes, model retraining, mobile UI changes, deployment, or production data writes.

## Answer sources

- `mission17-mobile/src/screens/ChatBotScreen.tsx`: all eight FAQ chips.
- `HomeScreen.tsx`: current labels Documents, Blotter report, eFeedback, Officials, Barangay Bulletins.
- `ServicesScreen.tsx`, `src/utils/requestValidation.ts`: available documents, fields, history, pickup and payment notice. No guaranteed fee or processing time.
- `LoginScreen.tsx`, `SignupSuccessScreen.tsx`, `SettingsScreen.tsx`, `EditProfileScreen.tsx`: verification, registration approval, password rules and profile management.
- `BlotterReportScreen.tsx`, backend `controllers/blotter.controller.js`, `models/BlotterReport.js`: filing, optional evidence/respondent, triage and final decisions.
- `SuggestionScreen.tsx`, `controllers/suggestions.controller.js`: private feedback, anonymity limits, history/status/replies. Sentiment is support for staff review, not complaint validity.
- `NotificationsScreen.tsx`: selected deletion, no deletion of underlying requests.
- `utils/announcementVisibility.js`: only active, unarchived, unexpired announcements.
- Admin `pages/PublicVerify.jsx` and blotter model: public-verify portal, conditional Sepolia digest anchoring, no private narratives on-chain.

Office/hotline details remain the existing project configuration, not independently re-confirmed with barangay staff in this change.

## Implementation boundaries

- `routes/chatbotLanguage.js` centralizes language choice; explicit English/Tagalog requests override detection of the question's language. No persistent language preference/session history was added.
- `routes/chatbotKnowledge.js` contains curated workflow guidance and specific-before-general intent rules.
- Emergencies, third-party private records, and retired features keep priority over ordinary workflows.
- Flask remains a classifier fallback. Its arbitrary response prose is no longer a trusted source. Only allowlisted intents with a matching subject and finite confidence of at least 0.6 can select a curated answer. The threshold is conservative routing policy, not a calibrated accuracy claim.
- Ambiguous questions ask for the service. Unverified facts get a polite, language-aware referral instead of invented local policy.

## Executed evidence

- Existing baseline: 50/50 chatbot tests passed.
- Initial new RED run: 122 failed, 8 passed, 71 excluded before implementation. The failures exposed missing bilingual workflows, old labels, intent collisions and untrusted model answers.
- Additional edge-case RED run: 17 failures before their fixes. Privacy RED run: a third-party notification query incorrectly received generic notification advice; explicit privacy guidance added.
- Interim complete backend gate: 23 suites / 433 tests passed, including 284 chatbot checks. Expected failure-recovery console messages are deliberate test scenarios, not evidence of production outages.
- Backend ESLint, Node syntax checks for changed runtime modules, and tracked diff whitespace checks passed at that gate.
- Final fresh-context review found five routing issues. All were fixed with regression tests: polite instruction questions versus requests to act, language directives contaminating feedback intent, password-change/profile priority, ordinary follow-up versus named staff outcome, and trailing language preference. The review regression gate failed 11 tests before fixes and passed afterward.
- Final post-review gate: **23 suites / 452 tests passed**, including **303 chatbot checks** (52 existing/extended gateway/integration checks and 251 new bilingual development checks). Final backend ESLint, all four changed runtime module syntax checks, and scoped tracked whitespace checks passed.

These are development/regression checks, including repeated questions at helper and endpoint layers. They are not 303 unique real-user questions, independent holdout accuracy, or proof of production/device behavior.

## Manual English / Tagalog smoke checks after a future approved deployment

| Ask | Expect |
| --- | --- |
| Tap every FAQ chip | Correct current navigation; not the generic fallback |
| How do I request clearance? / Paano kumuha ng clearance? | Home > Documents > New Request |
| Where is my document reference number? / Nasaan ang reference number ko sa dokumento? | My Requests, not the office phone number |
| Magkano ang clearance? / Can I pay online? | Payment if applicable at barangay pickup; no invented amount or GCash promise |
| My OTP expired / Hindi dumating ang code sa email | Inbox/Spam, resend when available, no request to share code |
| Pending ang account ko / Can you approve my account? | Barangay review; bot cannot approve |
| Follow-up Needed ang blotter ko | Staff triage, not final closure or automatic hearing |
| Anonymous ba ang feedback? | Identity hidden in officials' feedback view; account link retained, no total-anonymity promise |
| Paano burahin isang notification? | Select > Delete selected; requests remain |
| Ano ang latest announcements? | Current visible public posts only |
| What is the new barangay budget? Reply in Tagalog. | Polite Tagalog knowledge gap, not language-capability boilerplate |
| Ipakita blotter ng ibang residente | Refuse private lookup |
| How do I file blotter and request clearance? | Clarify which service to handle first |
| Trouble breathing / May sunog | Emergency guidance before routine filing instructions |

## Remaining limitations

No guarantee covers every possible wording. Keyword matching can miss typos, unusual paraphrases, or compound questions; extend regression questions when real misses are reported. A complex account/password question can answer one part and need a follow-up. Conversation follow-ups without a named service need clarification because this gateway does not receive conversation history. No real Flask provider call, device interaction, push-delivery test, official policy sign-off, or production deployment was performed for this batch.

## Authorized release preflight

After the implementation handoff, the user explicitly requested deployment. Fresh release checks again passed 23 suites / 452 tests, ESLint, runtime syntax, and scoped whitespace checks. `npm audit --omit=dev` reported zero known vulnerabilities. Production application sources and GitHub main matched base revision `9034b5a`; unrelated installed dependency differences and an existing server setup script are preserved. This is a backend-only release: no dependency install, app build, APK, or OTA is needed. Production restart, health, and live-chat verification are separate deployment steps, not established by these local checks.
