import 'dotenv/config';
import admin from './config/firebase-admin.js';

const email = 'perezkurt63@gmail.com';
async function cleanup() {
  try {
    const auth = admin.auth();
    const userRecord = await auth.getUserByEmail(email);
    await auth.deleteUser(userRecord.uid);
    console.log('? Firebase: Deleted user ' + userRecord.uid);
  } catch (error) {
    console.log('Firebase Error:', error);
  }
  process.exit(0);
}
cleanup();
