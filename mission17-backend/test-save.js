import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        const user = await User.findOne({ email: 'capstone.mission17@gmail.com' });
        if (!user) {
            console.log("❌ User not found");
            process.exit(1);
        }

        console.log("Found user:", user.username);
        user.otpCode = "123456";
        user.otpExpires = Date.now() + 15 * 60 * 1000;
        
        console.log("Attempting save...");
        await user.save();
        console.log("✅ Save successful");

        process.exit(0);
    } catch (error) {
        console.error("❌ Test Failed:", error);
        process.exit(1);
    }
};

test();
