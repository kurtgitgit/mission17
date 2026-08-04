import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Fix 1: Make all admins approved and verified
    await User.updateMany(
      { role: 'admin' }, 
      { $set: { accountStatus: 'approved', isVerified: true } }
    );
    console.log('✅ All admins set to approved/verified');

    // Fix 2: Fix perezkurt63@gmail.com
    await User.updateOne(
      { email: 'perezkurt63@gmail.com' },
      { $set: { accountStatus: 'approved', isVerified: true } }
    );
    console.log('✅ perezkurt63@gmail.com set to approved/verified');

    mongoose.connection.close();
  })
  .catch(err => console.error(err));
