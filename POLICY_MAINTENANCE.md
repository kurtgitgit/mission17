# BrgyLink Policy Maintenance Register

## Status and owner

This register supports the **BrgyLink capstone prototype**. It is not an adopted Barangay policy or a certification of legal compliance. The proposed responsible office is the **Barangay Bagong Pag-asa Office**. Official privacy contact/Data Protection Officer: **pending designation by the Barangay**.

Current policy version: `2026-09-08-capstone-v1`
Release wording: **Subject to Barangay Bagong Pag-asa review and approval before official public deployment.**

## Approved prototype data inventory

| Data category | Prototype purpose | Main system area |
| --- | --- | --- |
| Account/profile and contact details | account creation, resident identification, service communication | Firebase Authentication and User record |
| Valid-ID and profile uploads | account-review evidence | upload service and User record |
| Document requests | process resident requests and show status | document-request records |
| Blotter reports and evidence | receive, review, and track reports | blotter records |
| Mission proof and civic activity | manual mission verification and points workflow | submissions and mission records |
| Feedback/suggestions | receive resident feedback | suggestion records |
| Expo notification token | account-review and service updates | User record / Expo delivery |
| Audit/security records | investigate authorized changes and protect the system | audit-log records |
| AI prompts or images sent to enabled features | chatbot response and advisory image verdict | configured AI services |

Do not add a new category, sensitive-data use, analytics, advertising, or facial-recognition feature until the Barangay reviews the purpose, access, retention, and resident notice.

## Active or configured prototype processors

- Firebase Authentication — account sign-in and identity tokens.
- MongoDB deployment — application database.
- Cloudinary — configured upload storage for images/documents.
- AWS Lightsail — backend hosting.
- Expo — configured push-notification delivery.
- Ollama Cloud — configured chatbot model service.
- Mission17 AI service (Hugging Face deployment) — configured advisory image-verification service.

Confirm the processor list and the active deployment configuration before official launch. Do not claim a provider processes data unless it remains enabled in source/configuration and deployment.

## Consent record

New resident signup records the accepted Privacy Notice version, Terms of Use version, and a server-recorded acceptance date. Existing users are not altered by this first-release consent change. The app must show the current policy version before submission.

## Required approval decisions before official deployment

1. Designate a privacy/accessibility contact and, if required, a Data Protection Officer.
2. Approve collection purposes, staff access roles, resident identity-review process, and processor agreements.
3. Approve a retention/deletion schedule for each data category, including IDs, reports, uploads, audit logs, and backups.
4. Approve a resident privacy-rights request process and verification method.
5. Complete security, accessibility, and live-device testing; record the results and remediation decisions.

## Change procedure

1. Draft the policy/data-processing change and have it reviewed by the Barangay-designated authority.
2. Update this register, the website legal page, mobile legal screen, backend `LEGAL_POLICY_VERSION`, and signup copy together.
3. Increment the version using `YYYY-MM-DD-description-vN`; preserve a dated change log below.
4. For a material change, notify affected users before the change takes effect and obtain fresh consent where required by the approved policy.
5. Test public routes, signup blocking, consent storage, keyboard access, text-size/high-contrast settings, and existing user login before release.

## Change log

| Version | Date | Change | Approval status |
| --- | --- | --- | --- |
| `2026-09-08-capstone-v1` | 2026-09-08 | First capstone-prototype notice, terms, accessibility, AI disclosure, essential browser-storage notice, and new-resident consent record. | Pending Barangay review |
