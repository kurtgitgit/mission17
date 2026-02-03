import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// IMPORTS
import authRoutes from './routes/auth.js';      
//import missionRoutes from './routes/missions.js'; 

dotenv.config();
const app = express();
const PORT = 5001; 

// 👇 UPDATED: Increased limit to 50mb for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors());

// --- ROUTES ---
app.use('/api/auth', authRoutes);         
//app.use('/api/missions', missionRoutes);  

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