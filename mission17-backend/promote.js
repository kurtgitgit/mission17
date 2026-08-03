import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

async function promote() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({ email: 'perezkurt63@gmail.com' });
    console.log('? Users found:', users);
  } catch (error) {
    console.error('? Error:', error);
  }
  process.exit(0);
}
promote();
