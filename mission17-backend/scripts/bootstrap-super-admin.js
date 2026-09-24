import 'dotenv/config';
import mongoose from 'mongoose';
import { getAuth } from 'firebase-admin/auth';
import '../config/firebase-admin.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { bootstrapSuperAdmin } from '../utils/bootstrapSuperAdmin.js';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const confirmation = args.find((arg) => arg.startsWith('--confirm-email='))?.slice('--confirm-email='.length).trim().toLowerCase();
const email = process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const configuration = {
  email,
  username: process.env.BOOTSTRAP_SUPER_ADMIN_USERNAME,
  firstName: process.env.BOOTSTRAP_SUPER_ADMIN_FIRST_NAME,
  lastName: process.env.BOOTSTRAP_SUPER_ADMIN_LAST_NAME,
  password: process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD,
  apply,
};

if (!email || !configuration.username || !configuration.firstName || !configuration.lastName) {
  console.error('BOOTSTRAP_SUPER_ADMIN_EMAIL, BOOTSTRAP_SUPER_ADMIN_USERNAME, BOOTSTRAP_SUPER_ADMIN_FIRST_NAME, and BOOTSTRAP_SUPER_ADMIN_LAST_NAME are required. No recovery action was taken.');
  process.exitCode = 1;
} else if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is required. No recovery action was taken.');
  process.exitCode = 1;
} else if (apply && (!email || confirmation !== email)) {
  console.error('Refusing to apply. Use --apply --confirm-email=<the exact BOOTSTRAP_SUPER_ADMIN_EMAIL>.');
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await bootstrapSuperAdmin({
      auth: getAuth(),
      UserModel: User,
      AuditLogModel: AuditLog,
      configuration,
    });
    console.log(result);
  } catch (error) {
    console.error(`Bootstrap Super Admin failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
