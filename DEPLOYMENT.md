# Deployment Guide: Mission 17
This guide outlines the procedures for deploying the Mission 17 ecosystem, including the Node.js backend, MongoDB Atlas integration, and the dual-frontend architecture [cite: 2026-02-18].

## 1. Infrastructure Preparation
Before deploying, ensure the following cloud services are configured [cite: 2026-02-18]:

Database: Set up a MongoDB Atlas cluster [cite: 2026-02-18].

Network Security: Add the server's IP address to the Atlas IP Whitelist [cite: 2026-02-18].

MFA Service: Generate a Google App Password for the Gmail account used by nodemailer [cite: 2026-02-18].

## 2. Environment Variables (.env)
The system relies on a secure .env file for all sensitive credentials [cite: 2026-02-18]. Ensure these are defined in the production environment [cite: 2026-02-18]:

Code snippet
PORT=5001
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/mission17
JWT_SECRET=your_32_character_random_string
EMAIL_USER=mission17.security@gmail.com
EMAIL_PASS=your_16_character_app_password
## 3. Backend Deployment Steps
Clone the Repository: Pull the latest code to the production server [cite: 2026-02-18].

Install Dependencies: Run npm install in the mission17-backend directory [cite: 2026-02-18].

Security Check: Run npm audit to verify there are no known vulnerabilities in the libraries [cite: 2026-02-18].

Start Production: Use a process manager like PM2 to keep the server running: pm2 start index.js --name mission17-api [cite: 2026-02-18].

## 4. Frontend Deployment (Web & Mobile)
Web Admin: Build the production bundle using npm run build and host the resulting /dist folder on a service like Vercel or Netlify [cite: 2026-02-18].

Mobile App: Use Expo Application Services (EAS) to build the .apk or .ipa file: eas build --platform android [cite: 2026-02-18].