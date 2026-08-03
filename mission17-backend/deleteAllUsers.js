import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import { getAuth } from 'firebase-admin/auth';
import admin from './config/firebase-admin.js';

async function wipeAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Wipe MongoDB
    const result = await User.deleteMany({});
    console.log('? MongoDB: Deleted ' + result.deletedCount + ' users');

    // Wipe Firebase
    const auth = getAuth();
    const listUsersResult = await auth.listUsers(1000);
    const uidsToDelete = listUsersResult.users.map(u => u.uid);
    
    if (uidsToDelete.length > 0) {
      await auth.deleteUsers(uidsToDelete);
      console.log('? Firebase: Deleted ' + uidsToDelete.length + ' users');
    } else {
      console.log('? Firebase: No users to delete');
    }
  } catch (err) {
    console.error('? Error:', err);
  }
  process.exit(0);
}
wipeAll();
