# Security Documentation: Mission 17
This document outlines the security controls, authentication protocols, and data protection measures implemented to secure user data and system integrity [cite: 2026-02-18].

## 1. Authentication & Access Control
Mission 17 employs a multi-layered authentication strategy to prevent unauthorized access [cite: 2026-02-18]:

Multi-Factor Authentication (MFA): Users must verify their identity via a 6-digit One-Time Password (OTP) sent to their registered email address using nodemailer [cite: 2026-02-18].

Role-Based Access Control (RBAC): The system strictly separates "student" and "admin" privileges using custom Express middleware (verifyAdmin) [cite: 2026-02-18].

JWT Security: Session management is handled via JSON Web Tokens (JWT) signed with a unique JWT_SECRET and set to expire after 24 hours [cite: 2026-02-18].

## 2. Data Protection
We prioritize the confidentiality and integrity of all stored information [cite: 2026-02-18]:

Password Hashing: Plain-text passwords are never stored; the system uses Bcrypt with a salt factor of 10 to generate irreversible hashes [cite: 2026-01-23, 2026-02-18].

Encryption at Rest: The MongoDB Atlas database automatically encrypts all storage volumes using AES-256 [cite: 2026-02-18].

Encryption in Transit: All API communication is forced over TLS/SSL to prevent Man-in-the-Middle (MITM) attacks [cite: 2026-02-18].

## 3. Security Auditing & Monitoring
The system maintains a non-repudiable trail of all critical actions [cite: 2026-02-18]:

Audit Logging: Every login, mission submission, and administrative approval is recorded in the AuditLog collection [cite: 2026-02-18].

Logged Metadata: Each log entry captures the userId, action, IP address, and timestamp [cite: 2026-02-18].

Admin Dashboard: A dedicated interface allows authorized personnel to review security logs in real-time [cite: 2026-02-18].