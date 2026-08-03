import 'dotenv/config';
import { getAuth } from 'firebase-admin/auth';
import admin from './config/firebase-admin.js';

try {
  console.log('getAuth:', typeof getAuth);
  const auth = getAuth();
  console.log('auth:', !!auth);
} catch (e) {
  console.log('Error:', e);
}

