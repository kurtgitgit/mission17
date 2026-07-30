import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected to MongoDB.");
    const res = await User.deleteMany({ firebaseUid: { $exists: false } });
    console.log(`Deleted ${res.deletedCount} old users without a firebaseUid.`);
    process.exit(0);
}).catch(console.error);
