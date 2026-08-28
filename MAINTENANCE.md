# 🔧 Mission 17 & Barangay E-Services: System Maintenance & Incident Response Manual

<div align="center">

**Document Version:** `2.0.0` • **Maintenance Focus:** Security Rotations, Database Hygiene, Incident SLA, Disaster Recovery

</div>

---

## 📅 1. Routine Maintenance Schedule

| Frequency | Maintenance Task | Responsible Role | Verification Procedure |
| :--- | :--- | :--- | :--- |
| **Daily** | Monitor API Health & Error Rates | System Admin | Verify `GET /api/health` and PM2/Render error logs. |
| **Weekly** | Sponsor Wallet Gas Balance Inspection | Lead Developer | Check Sepolia ETH balance in sponsor wallet; top up if $< 0.05\text{ ETH}$. |
| **Monthly** | Third-Party Dependency Audit | Full-Stack Dev | Run `npm audit` and update non-breaking packages across all modules. |
| **Monthly** | Database Backup Recovery Drill | DBA / Lead Dev | Restore a staging collection from MongoDB Atlas point-in-time snapshot. |
| **Quarterly** | Cryptographic Secret Rotation | Security Lead | Rotate `JWT_SECRET` and SMTP App Passwords in `.env`. |
| **Bi-Annually** | Smart Contract & Threat Model Review | Security Lead | Conduct formal STRIDE review for newly added endpoints and features. |
| **Annually** | End-to-End Penetration Test & Audit | Independent Team | Execute full DREAD risk assessment and vulnerability scan. |

---

## 🔐 2. Cryptographic Key & Secret Rotation Runbooks

### 2.1 JWT Secret Rotation
1. Generate a new 64-character cryptographically secure hex secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update `JWT_SECRET` in the backend `.env` file.
3. Restart the backend service (`pm2 restart mission17-api` or cloud redeploy).
4. *Effect*: All existing user sessions will gracefully expire, requiring users to log in with fresh tokens.

### 2.2 Sponsor Wallet Private Key Rotation
1. Generate a new Ethereum wallet via Hardhat/Ethers.
2. Fund the new address with Sepolia testnet ETH.
3. Call `transferOwnership(newSponsorAddress)` on the `Mission17Ledger.sol` contract.
4. Update `ADMIN_PRIVATE_KEY` in the backend `.env` file and restart.

---

## 🍃 3. Database Health & Audit Log Pruning

### 3.1 Cold Storage Archival Policy
* **Active Window**: Keep the most recent **6 months** of audit logs and completed submissions in the primary MongoDB Atlas cluster.
* **Archival Procedure**: Export records older than 180 days to compressed CSV / AWS S3 cold storage archives:
  ```bash
  mongoexport --uri="<MONGO_URI>" --collection=auditlogs --query='{"timestamp":{"$lt":"2026-03-01T00:00:00Z"}}' --out=audit_archive_2026.json
  ```
* **Pruning Execution**: Delete archived records from the active cluster to preserve indexing performance and DRAM headroom.

---

## 🚨 4. Incident Response Protocol & Service Level Agreements (SLA)

### 4.1 Incident Severity Levels
| Severity | Description | Target Response Time | Target Resolution Time |
| :--- | :--- | :---: | :---: |
| **P0 - Blocker** | Entire system down, database connection failure, or security breach. | **< 15 Minutes** | **< 2 Hours** |
| **P1 - Critical** | Core feature unavailable (e.g., Blotter submission or Auth failing). | **< 30 Minutes** | **< 4 Hours** |
| **P2 - Major** | Non-critical feature degradation (e.g., Chatbot slow, duplicate alert). | **< 2 Hours** | **< 12 Hours** |
| **P3 - Minor** | Minor cosmetic UI bug or documentation typo. | **< 1 Business Day** | **< 3 Business Days** |

### 4.2 Incident Escalation Workflow
```
[ 1. Detection & Alerting ] ──► System Admin receives webhook / user report
              │
[ 2. Triage & Classification] ──► Assess Severity (P0–P3) and isolate affected subsystem
              │
[ 3. Containment & Hotfix ] ──► Deploy immediate fix via OTA (`eas update`) or Backend patch
              │
[ 4. Verification & Testing] ──► Validate fix in staging before broadcasting to production
              │
[ 5. Post-Mortem Analysis ] ──► Document root cause and update `TROUBLESHOOTING.md`
```