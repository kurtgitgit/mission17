# Troubleshooting Guide: Mission 17

This guide addresses common technical hurdles and provides quick solutions for the Mission 17 ecosystem [cite: 2026-02-18].

| Issue | Potential Cause | Resolution |
| :--- | :--- | :--- |
| **MFA Email Not Received** | Invalid Google App Password or SMTP block [cite: 2026-02-18] | Verify `EMAIL_PASS` in `.env` and check the backend console for the `🔐 DEBUG OTP` log [cite: 2026-02-18]. |
| **"Invalid Token" Error** | JWT has expired or `JWT_SECRET` changed [cite: 2026-02-18] | Log out and log back in to generate a fresh 24-hour token [cite: 2026-02-18]. |
| **Audit Logs Not Loading** | Logged in as "Student" role [cite: 2026-02-18] | Ensure the user account has the admin role in the MongoDB `users` collection [cite: 2026-02-18]. |
| **Database Connection Fail** | IP address not whitelisted in Atlas [cite: 2026-02-18] | Log into MongoDB Atlas and add your current public IP to the Network Access list [cite: 2026-02-18]. |