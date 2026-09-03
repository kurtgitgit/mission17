# Mission17-AI Implementation Plan

**Updated:** September 3, 2026
**Objective:** make civic-task photo verification durable, secure, testable, and defensible by replacing ephemeral local anti-cheat storage with a least-privilege MongoDB implementation and producing reproducible evidence.

## Current status

| Phase | Status | Exit requirement |
| --- | --- | --- |
| 1. Design and security contract | In progress | Schema, secrets, failure behavior, and migration strategy approved |
| 2. MongoDB anti-cheat implementation | Pending | Exact and near-duplicate detection persists across restarts |
| 3. Automated testing | Pending | Deterministic local test suite passes |
| 4. Model and documentation verification | Pending | Documentation matches measured evidence |
| 5. Deployment and acceptance testing | Pending | Deployed persistence, security, and regression checks pass |

## Scope and guardrails

- Keep `/predict` protected by the existing backend-to-AI service token.
- Keep the current TensorFlow model and decision threshold unchanged unless evaluation evidence supports a change.
- Do not generate a new APK for these server-side changes.
- Do not commit MongoDB credentials, `AI_SERVICE_TOKEN`, uploaded photos, personal data, or production test records.
- Use a separate least-privilege MongoDB database user for the AI service. It may access only the anti-cheat database and collection.
- If anti-cheat storage is unavailable, do not silently approve a submission. Return an unavailable or uncertain result for backend/manual review.
- Tests must use an isolated test database and delete only records created by that test run.

## Phase 1 — Design and security contract

### 1.1 Environment variables

Define the following Hugging Face Secrets without placing values in source control:

- `AI_SERVICE_TOKEN`: shared only with the backend and used to protect `/predict`.
- `ANTICHEAT_MONGO_URI`: connection string for a dedicated least-privilege MongoDB user.
- `ANTICHEAT_DB_NAME`: dedicated database name.
- `ANTICHEAT_COLLECTION`: defaults to `photo_hashes`.

### 1.2 MongoDB collection schema

Each hash record should contain:

- `hashValue`: normalized hexadecimal perceptual hash.
- `hashType`: `phash` or `dhash`.
- `algorithmVersion`: version identifier for future migrations.
- `bucket`: indexed candidate bucket used for bounded near-duplicate searches.
- `submissionRef`: optional non-personal reference; never store email, name, Firebase UID, or the image itself.
- `createdAt`: UTC creation timestamp.
- `expiresAt`: optional retention timestamp if a retention period is adopted.

Required indexes:

- Unique compound index on `hashType`, `algorithmVersion`, and `hashValue`.
- Candidate-search index on `hashType`, `algorithmVersion`, and `bucket`.
- Optional TTL index on `expiresAt` if approved by the project owner.

### 1.3 Duplicate decision behavior

- Exact duplicate: reject.
- Near duplicate within the approved Hamming-distance threshold: reject or flag according to documented policy.
- Valid, unique, high-confidence mission photo: register hashes after verification.
- Low-confidence model result: return `UNCERTAIN`; do not register hashes.
- MongoDB unavailable or timed out: return an unavailable/uncertain result; do not approve or register.
- Authorized administrator re-analysis may bypass duplicate rejection but must not create duplicate records.

### 1.4 Concurrency strategy

- Use the unique index to prevent simultaneous exact-hash registration.
- Treat a duplicate-key result during registration as a duplicate rather than a successful unique submission.
- Keep duplicate checking and registration behavior idempotent.
- Document that near-duplicate concurrency cannot be made fully atomic without a transaction or reservation design; route ambiguous races to manual review.

**Phase 1 exit criteria:** schema, least-privilege access, failure behavior, threshold policy, retention decision, and migration approach are documented and approved.

## Phase 2 — MongoDB anti-cheat implementation

1. Add a pinned MongoDB Python driver dependency.
2. Replace SQLite operations in `utils/anticheat.py` with a MongoDB repository that has explicit connection and operation timeouts.
3. Preserve pHash and dHash generation while adding an algorithm version.
4. Use indexed buckets to fetch a bounded candidate set before calculating Hamming distance in Python.
5. Enforce a maximum candidate count and log when manual review is required because the bound is exceeded.
6. Register hashes only after a verified result.
7. Convert storage failures into safe unavailable/uncertain responses.
8. Remove the hosted runtime dependency on `anticheat.db`.

### Existing hash migration

1. Inspect and deduplicate hashes from `anticheat.db` and `anticheat_hashes.json`.
2. Import only valid normalized hexadecimal hashes.
3. Record the source algorithm/version used for migrated values.
4. Verify imported counts and exact-match behavior.
5. Archive or remove obsolete local hash stores only after MongoDB verification and a recoverable backup.

**Phase 2 exit criteria:** a registered hash remains detectable after the AI service and database client restart, and storage failure never produces an approval.

## Phase 3 — Automated testing

### 3.1 Anti-cheat unit and integration tests

- Exact duplicate is detected.
- Recompressed/resized near duplicate is detected within the approved threshold.
- Clearly different images are not marked duplicate.
- Empty, corrupted, and unsupported images are rejected.
- Low-information images do not produce misleading duplicate results.
- Duplicate-key concurrency is handled safely.
- Candidate-query limits are enforced.
- MongoDB timeout/unavailable behavior fails safely.
- Hashes persist across repository/engine recreation.
- Test cleanup removes only records tagged with the current test-run identifier.

### 3.2 API tests

- `/health` returns a valid service status without exposing secrets.
- `/predict` rejects a missing or incorrect service token.
- `/predict` rejects missing, empty, oversized, unsupported, and invalid image content.
- A valid authorized request returns a schema-valid result.
- Duplicate, uncertain, model-unavailable, and database-unavailable results use predictable status and response fields.
- Administrator re-analysis bypass works only through the authenticated backend contract.

### 3.3 Platform reliability

- Replace print-based expectations with assertions.
- Remove console-output assumptions that fail under Windows encodings.
- Pin test dependencies and document the exact test command.

**Phase 3 exit criteria:** all tests pass deterministically on Windows and in the deployment environment, and intentional failures are reported correctly.

## Phase 4 — Model, documentation, and observability

1. Replace inaccurate “Ollama Vision” wording with “TensorFlow CNN” in logs, comments, and documentation.
2. Validate that `labels.txt`, model output dimensions, and verdict mappings agree.
3. Evaluate the saved model against a held-out dataset using a reproducible script.
4. Record dataset version, sample count, class distribution, confusion matrix, accuracy, precision, recall, and F1 score.
5. Remove or mark the README’s accuracy claims as unverified until reproduced.
6. Document model limitations, class coverage, confidence threshold, false-positive/negative risks, and human-review requirements.
7. Add structured operational logs without credentials, image data, or personal information.
8. Record storage/model availability in health diagnostics without revealing connection details.

**Phase 4 exit criteria:** the deployed implementation and README agree, and every published metric is supported by reproducible evidence.

## Phase 5 — Deployment and acceptance testing

### 5.1 Pre-deployment

1. Back up the current working AI deployment reference and record the last known-good commit.
2. Create the least-privilege MongoDB user and collection indexes.
3. Add required values as Hugging Face Secrets.
4. Run the complete local test suite.
5. Confirm the Git diff contains no credentials, personal data, generated databases, or unintended model changes.

### 5.2 Deployment

1. Deploy through the existing GitHub-to-Hugging-Face workflow.
2. Confirm container startup and model loading.
3. Verify `/health`.
4. Verify unauthorized `/predict` access is rejected.
5. Submit an authorized unique test image and record its non-personal test reference.
6. Restart/redeploy the Hugging Face service.
7. Resubmit the same image and verify it is rejected as a persistent duplicate.
8. Test backend handling of verified, rejected, uncertain, timeout, AI-unavailable, and database-unavailable outcomes.

### 5.3 Rollback

- If startup, MongoDB, authorization, or integration verification fails, redeploy the recorded last known-good commit.
- Preserve MongoDB records during rollback unless corruption is proven.
- Do not restore SQLite as a production source of truth.
- Document the failure and required corrective action before attempting another deployment.

## Privacy and retention policy

- Store perceptual hashes and minimal non-personal metadata only.
- Never store the submitted image in the anti-cheat collection.
- Never attach resident names, emails, addresses, Firebase UIDs, or authentication tokens.
- Decide and document whether hashes remain for the project lifetime or expire through a TTL policy.
- Restrict database access to the AI service account and authorized maintainers.
- Avoid printing hash values in normal production logs.

## Final acceptance criteria

- Duplicate-photo records persist across Hugging Face restarts and redeployments.
- `/predict` remains inaccessible without the backend service token.
- The AI MongoDB account cannot access unrelated application collections.
- Exact and near-duplicate checks are bounded and tested.
- Concurrent exact duplicates cannot both be treated as unique.
- MongoDB failure never silently approves a submission.
- All automated AI tests pass in clean environments.
- No credentials, uploaded images, or personal data are committed or logged.
- Model metrics and documentation are reproducible and accurate.
- A rollback has been documented and exercised or safely simulated.

## Work order

1. Approve Phase 1 design decisions.
2. Implement and test the MongoDB repository in isolation.
3. Integrate it with `/predict` and safe failure responses.
4. Migrate existing valid hashes.
5. Complete model/documentation verification.
6. Deploy, restart, and execute acceptance tests.
7. Update the quality-assurance report using measured evidence.
