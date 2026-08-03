import 'dotenv/config';
import admin from './config/firebase-admin.js';

try {
  console.log('Admin:', !!admin);
  console.log('Auth type:', typeof admin.auth);
  if (typeof admin.auth === 'function') {
    console.log('It is a function');
  } else {
    console.log('It is NOT a function');
  }
} catch (e) {
  console.log('Error:', e);
}

