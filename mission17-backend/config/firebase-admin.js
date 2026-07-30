import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (e) {
    throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT from process.env');
  }
} else {
  const filePath = join(__dirname, '../firebase-service-account.json');
  if (existsSync(filePath)) {
    serviceAccount = JSON.parse(readFileSync(filePath, 'utf8'));
  } else {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT env var or firebase-service-account.json file');
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export default admin;
