# BrgyLink Chatbot Test Plan

Prepared: 2026-10-14 (Asia/Manila)
Status: Execution in progress. See the dated execution record below; full evaluation remains incomplete.

## Execution record — 2026-10-14 local checks

This record is an initial local pass, not completion of the full evaluation plan.

- Tested checkout: commit `f97a99c8d165b8bd66cf6d85bf4f96859241c0af`, with local working-tree changes. Chatbot classifier version: 7.
- SHA-256 at the time of this execution record:
  - `smart_classifier.py`: `CC65B9DEA5AAF6DF7E1BCA340C294C54E20D9497D561E41B30628A46D1FDBB64`
  - `intents_brgylink_curated.json`: `25E37910E6103C9906676E64123AD3EFFB8D2C617F64C985A30B3F8987680295`
  - `knowledge_base.json`: `1945F096E461625C7795F4AF3842D5703B3C661E07A9A9C708CED3B7912916B6`
  - `smart_classifier.pkl`: `793E4E5F5F152FA3D68C030118357AA90464E3DBFFC7CC10FCB52B3EF100459D`
- Baseline `python -m unittest test_app.py`: 16 tests passed before the focused fix. Rerun after the fix: 17 tests passed.
- Backend Jest chatbot unit subset: 15 tests passed; the selected test-name filter skipped the other 112 tests in that run.
- Full `routes/chatbot.test.js` attempt: 15 unit tests passed; 14 endpoint integration tests could not execute because `MongoMemoryServer` failed to start (`mongod` fassert error). No endpoint assertion result is inferred from this setup failure.
- Direct invocation of the Express route handler with synthetic request/response objects and mocked database/model dependencies: 9/9 route-source/validation assertions passed (FAQ, emergency, empty announcements, AI-down fallback, successful mocked gateway, empty and oversized input). This bypasses the HTTP listener and rate-limit middleware; it is not a full server integration test.
- An in-process, 20-message Flask test-client smoke run used an ephemeral test-only service token. Before the fix, 19/20 expected intents matched and 19/20 expected languages matched. One emergency wording was treated as out-of-scope, and one short Tagalog emergency received an English answer. This small hand-authored smoke set is not an accuracy benchmark.
- Fixed the breathing-emergency phrase coverage and Tagalog language detection, with four focused regression examples in `test_app.py`. Full AI-service test suite now passes. `py_compile` and `git diff --check` pass.
- Post-fix rerun of the same 20 messages, each in a fresh synthetic session: 20/20 HTTP 200; all 18 cases with a specified intent matched; 20/20 expected language labels matched; zero hits in the listed deterministic safety checks. This remains a developer-authored smoke set, not a reviewed golden set or accuracy estimate.
- Runtime harness checks in this environment could not bind a localhost TCP port (`EACCES`). The in-process Flask client avoids network access. The Flask environment did not provide `AI_SERVICE_TOKEN`; the test token was assigned only in process memory, not written to an environment file.
- Knowledge-base inventory: 37 service entries, 0 marked verified, 37 with no source, and 12 marked `needs_staff_verification`. This blocks defensible fact-scoring until an authorized reviewer supplies/approves sources.
- The resident screen sends `history`, but the Express route accepts only `message`; the gateway forwards only the message. Therefore mobile multi-turn memory has not been demonstrated. The classifier is a rules/TF-IDF system backed by curated responses; it is not evidence of a Groq or generative-model evaluation.
- No deployed service, production database, real resident data, or physical device was tested. No online accuracy, factual correctness, or user-impact claim follows from these checks.

Next full-evaluation gates: repair or replace the MongoDB test fixture; obtain barangay and native-language review for local and language-specific claims; then freeze a reviewed development set and independent holdout before calculating accuracy-style metrics. These gates are not required to finish the limited, defense-deadline review below, but remain required before claiming verified local facts or benchmark accuracy.

## Deadline-adjusted defense review (2026-10-14; three days remaining)

An authorized barangay reviewer is unavailable before the defense. Do not wait for one, mark unreviewed knowledge-base entries as verified, or present this limited review as equivalent to official barangay approval. Continue with a clearly bounded desk evaluation:

1. Check general legal/procedural statements only against primary or government sources, including the Local Government Code and DILG Katarungang Pambarangay materials. Record the exact source and relevant provision for each checked claim.
2. Treat Bagong Pag-asa-specific fees, required documents, eligibility rules, office hours, contact details, and processing promises as unknown unless already established by BrgyLink UI/source or an accessible official publication. Test that the bot defers these unknowns instead of inventing values.
3. Prioritize emergency, privacy, unsupported/retired feature, fabricated action/approval, service outage, and core app-navigation cases. Reuse developer-authored smoke tests only as regression checks; they are not a gold set.
4. Run a small, transparently labelled defense smoke set across the available routes and languages. Do not publish an accuracy percentage, a statistical confidence claim, or language-quality certification from this convenience sample.
5. State limitations plainly: local facts and Ilocano/Pangasinan fluency remain unverified; MongoDB-backed HTTP integration and native-device behavior remain unverified unless separately executed successfully.

Suggested three-day sequence: Day 1, source-map general claims and freeze the limited cases; Day 2, execute deterministic chatbot/API and mobile checks, logging blocked setup separately; Day 3, rerun regressions and prepare a concise evidence table with sample size, pass/fail/blocked counts, source/version, and limitations. Keep the full evaluation plan above as future work.

## Purpose

Evaluate whether residents receive correct, relevant, understandable answers and whether the chatbot handles unsupported questions, uncertainty, sensitive requests, service failures, and normal mobile use reliably. Produce reproducible evidence for the capstone defense.

This plan evaluates the chatbot. Image-classification metrics from other BrgyLink AI features are outside its scope and must not be used as chatbot accuracy.

## Current implementation to evaluate

- Mobile: `mission17-mobile/src/screens/ChatBotScreen.tsx` sends a message and history to `POST /api/chatbot`.
- Backend: `mission17-backend/routes/chatbot.js` selects controlled FAQs, scope fallback, live data, or the AI gateway. The response exposes a source label. History is currently ignored, and the gateway forwards only the current message.
- Live data: `mission17-backend/routes/chatbotLiveData.js` formats public officials and announcements. Route priority can make some helper behavior unreachable for particular questions; evaluate the full route as well as the helper.
- AI service: Flask `/chat` uses `mission17-ai/chatbot_runtime/service.py` and `smart_classifier.py`, with rules, TF-IDF intent classification, and curated answers. Optional session state exists here but is not connected through the current backend gateway.
- Language handling exists for English, Tagalog, Ilocano, and Pangasinan. Its presence is not proof of language quality.
- Existing coverage includes `mission17-backend/routes/chatbot.test.js` and `mission17-ai/test_app.py`. The Python suite also contains tests for another AI feature; report chatbot-specific counts separately.
- The current backend integration setup removes the AI service token. It therefore cannot establish that the successful remote AI path works.

## Phase 1 — Establish a reproducible baseline

1. Record commit, relevant uncommitted diff, runtime/dependency versions, classifier version, and hashes of the knowledge base, intent dataset, and model artifact. Include these identifiers with every report.
2. Map the reachable routing decisions, response schema, input limits, gateway timeout, rate limit, and mobile timeout.
3. Run existing relevant tests and preserve output. Record test infrastructure failures separately from application defects.
4. Inspect whether each test actually triggers its intended branch. Failure simulations must assert that the mocked dependency was reached; a passing fallback assertion alone is insufficient.
5. Use disposable test dependencies and a temporary database. If the MongoDB test process cannot start, run mock-based route tests and explicitly mark real database integration blocked until resolved.

Output: baseline results, route inventory, test-coverage gaps, and environment record.

## Phase 2 — Establish the reference answers

Create a reference sheet for supported services and factual claims. Each entry records the claim, source, source date/version, reviewer, and verification status.

- Verify app-navigation instructions against the current resident UI.
- Verify office hours, contact information, requirements, fees, and processing timelines against an approved barangay source. A value being hardcoded or labelled verified in source is insufficient evidence.
- Use controlled public-data fixtures to establish expected announcement and directory results.
- Define when a referral, clarification, or knowledge-gap response is correct.
- Include removed Civic Tasks/Events workflows and unsupported claims about downloads, approvals, dispatch, and personal case access.
- Check emergency wording and sensitive-topic handling against an approved reference before grading them as correct. Distinguish immediate danger, ordinary health questions, negation, and historical incidents.

Unconfirmed factual cases remain pending validation and are counted visibly. They cannot silently become passes or disappear from the report.

Output: source-backed answer rubric and unresolved-fact list.

## Phase 3 — Build the evaluation cases

Target 160 structured cases: 40 underlying scenarios expressed in each of the four supported languages. Include natural mixed-language phrasing within the relevant variants. Translations are related cases, so report both scenario-family and individual-message results.

| Category | Scenarios | Messages across four languages |
| --- | ---: | ---: |
| Supported services and navigation | 12 | 48 |
| Typos, ambiguity, multi-part questions, conflicting keywords | 8 | 32 |
| Unknown facts and unrelated topics | 6 | 24 |
| Emergencies, privacy, injection, and false authority | 6 | 24 |
| Public data availability, filtering, and routing | 4 | 16 |
| Removed features and unsupported capabilities | 4 | 16 |
| Total | 40 | 160 |

Add 40 independently authored holdout questions, targeting 10 per language. Freeze them before tuning; check for exact and near duplicates against training patterns, development cases, and paraphrase families. Holdout cases must not be used to choose thresholds or revise answers. Once used to guide a fix, they become regression cases and fresh holdout questions are needed for another independent evaluation.

Each case records ID, category, language, input, environment/fixtures, reference source, acceptable behavior, prohibited claims, expected route where applicable, severity, and review status. AI can draft questions; source checks and human review establish the reference answers. Fluent reviewers are needed for Ilocano and Pangasinan language-quality claims.

Output: 160-case development set, 40-case holdout set, and overlap audit. These are planned counts, not completed tests or statistical guarantees.

## Phase 4 — Test the classifier and AI service directly

- Measure intent classification on independently labelled, eligible intent cases using accuracy, macro F1, and a confusion matrix.
- Separate classifier decisions from rule-based overrides; report unknown-intent handling and rejection rates.
- Check response facts against the reference sheet, regardless of whether intent classification was correct.
- Exercise low confidence, close competing intents, and out-of-scope inputs. The returned confidence is a similarity-related score, not a probability or accuracy percentage.
- Test malformed payloads, missing/wrong service token, input boundaries, service exceptions, and stable error responses.
- Exercise direct-service session separation and expiry independently of mobile behavior. Verify that one synthetic session cannot affect another.

Output: direct-service results, classifier metrics, and reproducible failures.

## Phase 5 — Test the complete backend route

Run cases against Express and verify status, response schema, answer, route source, and which dependencies were actually invoked.

- Controlled FAQ success and correct precedence over other routes.
- Active versus inactive announcements, empty data, malformed public fields, sorting/limits, and database errors.
- Successful gateway responses, invalid JSON, empty response, authentication failure, server errors, network rejection, and timeout.
- Guarded answers containing invented fees, processing promises, download claims, personal data, or claims that the bot performed an action.
- Empty, non-string, oversized, and unusual Unicode input; normalization boundaries and JSON handling.
- Rate-limit behavior under an isolated test configuration, including recovery. The existing limiter skips test mode, so ordinary tests alone will not exercise it.
- End-to-end backend-to-Flask execution using temporary service credentials, followed by a small deployed compatibility check when the deployment version and authorization are established.

Test both safe failure and useful success. A generic referral on every supported question is safe but fails usefulness.

Output: route-by-route results and integration failure report.

## Phase 6 — Test conversations and the resident interface

Create 12 scripted conversations, targeting three per language and six turns per conversation. Cover follow-ups, topic changes, corrected details, language changes, repeated questions, and attempted boundary bypasses.

The current backend has no connected conversational state. Report that limitation explicitly. Measure safe handling of ambiguous follow-ups; do not claim memory based on the visible message history or direct-service sessions. Implementing memory would be a separate product change.

On the actual mobile interface check typing, keyboard visibility, send-button/loading behavior, scrolling, long replies, slow responses, offline recovery, repeated taps, leaving/reopening the screen, and accessibility labels. Synthetic user details are sufficient.

Output: transcript review, UI evidence, and clearly identified device/platform coverage. Browser emulation does not establish native-device success.

## Phase 7 — Measure reliability and review answers

- Record latency and error rates per route. Separate first/cold requests from warm requests.
- Measure median and p95 latency using adequate repeated requests; document sample size and concurrency. Run failure injection and load exercises in the isolated environment.
- Review factual correctness, relevance, completeness, language quality, safe handling, and unjustified refusal separately.
- Apply deterministic assertions to verifiable requirements and human review to meaning and language quality.
- An optional LLM judge may flag questionable answers. Calibrate it against human-reviewed examples, track disagreement, and keep its score separate from measured correctness.

Proposed engineering targets, to freeze before execution:

- Zero observed critical failures in the test suite: private-data disclosure, dangerous emergency misdirection, fabricated actions/approvals, or successful unauthorized instruction takeover.
- Every designated critical safety and privacy case must pass.
- At least 90% fully acceptable responses overall and at least 85% in each evaluated language, reported separately for development and holdout sets. These are project targets, not certified benchmarks.
- All selected API-contract and failure-recovery checks pass.
- Candidate warm-response p95 targets: local controlled replies under 1 second, fixture-backed public-data replies under 2 seconds, AI-path replies under 10 seconds in the stated test environment. Reassess feasibility before freezing targets; report cold starts separately.

Publish actual counts and denominators. Exclude blocked cases from the executed-case percentage but show their count prominently. A release cannot pass a gate while required critical cases remain blocked. Zero observed failures does not establish zero risk outside the tested cases.

## Phase 8 — Findings, fixes, and final evidence

For every defect retain the case ID, input, expected result, actual result, source/route, version, reproduction steps, and impact. Prioritize safety and wrong factual instructions before language polish.

After a fix, rerun the failed cases and affected regression coverage. Preserve before/after results and use fresh holdout cases whenever the earlier holdout influenced the fix.

Planned deliverables:

1. Reference sheet and approved grading rubric.
2. Versioned datasets and overlap audit.
3. Repeatable Python/Express test runner and commands.
4. Raw JSON/CSV results, logs, and conversation/UI evidence.
5. Defect register with severity and reproduction steps.
6. Final report separating source inspection, automated execution, human review, device checks, deployed checks, failures, and blocked work.
7. Defense-ready wording with actual results and limitations.

## Execution order and dependencies

Start with baseline and reference inventory, then deterministic API coverage and dataset construction. These can proceed using isolated harnesses without rebuilding the admin-login/Firebase setup. Factual approval and native-language review can proceed while technical checks run. Execute the frozen holdout after fixes and freeze the final report against the tested version.

This document is a plan. It does not authorize production load testing, deployment, changes to real resident records, or a claim that the chatbot has passed.
