import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./firebase-service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

async function run() {
  try {
    const user = await getAuth().getUserByEmail('capstone.mission17@gmail.com');
    await getAuth().updateUser(user.uid, {
      emailVerified: true
    });
    console.log('Successfully verified email for capstone.mission17@gmail.com');
  } catch (error) {
    console.error('Error verifying user:', error);
  }
}

run();

