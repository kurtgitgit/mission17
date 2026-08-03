import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

async function getOtp() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: 'capstone.mission17@gmail.com' });
  console.log('OTP CODE IS:', user.otpCode);
  process.exit(0);
}
getOtp();
