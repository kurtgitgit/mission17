# Maintenance Plan: Mission 17

To ensure the long-term security and operational resilience of the Mission 17 platform, the following maintenance schedule is established [cite: 2026-01-05, 2026-02-18].

## 1. Security Rotations
* **Quarterly**: Rotate the `JWT_SECRET` in the `.env` file to invalidate all old sessions and mitigate potential token theft [cite: 2026-02-18].
* **Bi-Annually**: Update the Google App Password used for `nodemailer` to ensure the MFA service remains secure [cite: 2026-02-18].

## 2. Dependency Management
* **Monthly**: Run `npm audit` in both the backend and frontend directories to identify and patch known vulnerabilities in third-party libraries [cite: 2026-01-23, 2026-02-18].
* **Monthly**: Execute `npm update` to apply non-breaking security patches and performance improvements [cite: 2026-02-18].

## 3. Database & Audit Log Health
* **Audit Log Pruning**: Archive audit logs older than 6 months into a secondary "Cold Storage" collection or external CSV to maintain MongoDB performance [cite: 2026-02-18].
* **Backup Verification**: Periodically verify that MongoDB Atlas "Point-In-Time Recovery" snapshots are being generated successfully [cite: 2026-02-18].

## 4. Threat Model Lifecycle
* **Trigger-Based Updates**: The STRIDE and OWASP threat mappings must be updated whenever a new API endpoint or external integration is added to the system [cite: 2026-02-18].
* **Annual Review**: Conduct a full DREAD risk reassessment to ensure that security priorities still align with current usage patterns [cite: 2026-02-18].