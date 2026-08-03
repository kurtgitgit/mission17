import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';

async function createUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Check if it exists just in case
    const existing = await User.findOne({ email: 'capstone.mission17@gmail.com' });
    if (existing) {
      console.log('User already exists in MongoDB, updating...');
      await User.updateOne(
        { email: 'capstone.mission17@gmail.com' },
        { $set: { firebaseUid: 'DX7ZMdx2OXa7GOq05kmGGDoO1A83', role: 'admin', accountStatus: 'approved' } }
      );
    } else {
      const user = new User({
        firebaseUid: 'DX7ZMdx2OXa7GOq05kmGGDoO1A83',
        email: 'capstone.mission17@gmail.com',
        username: 'Mission17Admin',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        accountStatus: 'approved',
        points: 0,
        isVerified: true
      });
      await user.save();
    }
    console.log('? Admin User injected successfully!');
  } catch (err) {
    console.error('? Error:', err);
  }
  process.exit(0);
}
createUser();
