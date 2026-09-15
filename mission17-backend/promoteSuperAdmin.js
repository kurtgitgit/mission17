import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();

if (!email) {
  console.error('SUPER_ADMIN_EMAIL is required.');
  process.exitCode = 1;
} else if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is required.');
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOne({ email });
    if (!user) throw new Error(`No BrgyLink account exists for ${email}.`);
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new Error('Only an existing staff admin account can be promoted to Super Admin.');
    }
    if (user.accountStatus !== 'approved' || user.isVerified !== true) {
      throw new Error('The selected account must be approved and email-verified before promotion.');
    }

    const otherCaptain = await User.findOne({ role: 'super_admin', _id: { $ne: user._id } });
    if (otherCaptain) {
      throw new Error('Another Super Admin already exists. Review that account before transferring the role.');
    }

    user.role = 'super_admin';
    await user.save();
    console.log(`Promoted ${user.email} to Super Admin.`);
  } catch (error) {
    console.error(`Super Admin promotion failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
