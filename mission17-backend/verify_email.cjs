const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function run() {
  try {
    const user = await admin.auth().getUserByEmail('capstone.mission17@gmail.com');
    await admin.auth().updateUser(user.uid, {
      emailVerified: true
    });
    console.log('Successfully verified email for capstone.mission17@gmail.com');
  } catch (error) {
    console.error('Error verifying user:', error);
  }
}

run();

