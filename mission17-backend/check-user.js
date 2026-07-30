import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const user = await User.findOne({ email: "perezkurt63@gmail.com" });
    console.log("User:", JSON.stringify(user, null, 2));
    process.exit(0);
}).catch(console.error);
