import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// IMPORTS
import authRoutes from './routes/auth.js';      // 👈 NEW
//import missionRoutes from './routes/missions.js'; // (Keep this if you made it)

dotenv.config();
const app = express();
const PORT = 5001; // 👈 Forced to new port

app.use(express.json());
app.use(cors());

// --- ROUTES ---
app.use('/api/auth', authRoutes);         // 👈 LOGIN/SIGNUP ROUTES
//app.use('/api/missions', missionRoutes);  // (Keep this)

// DATABASE
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Database Connection Failed:', error);
    process.exit(1);
  }
};

app.listen(PORT, () => {
  connectDB();
  console.log(`Server running on http://localhost:${PORT}`);
});