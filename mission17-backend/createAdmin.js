import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// 1. Connect to Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ DB Connected"))
  .catch((err) => console.log("❌ DB Error:", err));

const createAdmin = async () => {
  try {
    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt); // CHANGE THIS PASSWORD IF YOU WANT

    // 3. Create the Admin User
    const newAdmin = new User({
      username: "SuperAdmin",
      email: "admin@mission17.com",
      password: hashedPassword,
      role: "admin", // <--- This grants the power
      points: 9999
    });

    // 4. Save to DB
    await newAdmin.save();
    console.log("🚀 Admin Account Created Successfully!");
    console.log("📧 Email: admin@mission17.com");
    console.log("🔑 Pass: admin123");
    
    // 5. Exit
    process.exit();
    
  } catch (err) {
    if (err.code === 11000) {
      console.log("⚠️  Admin already exists.");
    } else {
      console.log("❌ Error:", err);
    }
    process.exit();
  }
};

createAdmin();