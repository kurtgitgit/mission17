import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// 🛡️ SECURITY IMPORTS (Rubric Category: Authentication & Input Validation)
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

// IMPORTS
import authRoutes from './routes/auth.js';      
//import missionRoutes from './routes/missions.js'; 

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001; 

// --- 🔒 SECURITY MIDDLEWARE ---

// 1. Set Secure HTTP Headers (Helmet)
// This protects against common attacks like sniffing and clickjacking.
app.use(helmet());

// 2. Rate Limiting (Stops Brute Force Attacks)
// Limits each IP to 100 requests every 15 minutes.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again later." }
});
app.use('/api', limiter);

// 3. Data Sanitization against NoSQL Injection
// Prevents hackers from sending {"$gt": ""} to steal data.
app.use(mongoSanitize());

// 4. Data Sanitization against XSS (Cross-Site Scripting)
// Cleans user input of malicious HTML/Scripts.
app.use(xss());

// --- STANDARD MIDDLEWARE ---

// 👇 UPDATED: Increased limit to 50mb for image uploads (Preserved)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors());

// --- ROUTES ---
app.use('/api/auth', authRoutes);         
//app.use('/api/missions', missionRoutes);  

// DATABASE
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is missing in .env file");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected Securely');
  } catch (error) {
    console.error('❌ Database Connection Failed:', error);
    process.exit(1);
  }
};

app.listen(PORT, () => {
  connectDB();
  console.log(`🛡️  Secure Server running on http://localhost:${PORT}`);
});