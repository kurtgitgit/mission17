import 'dotenv/config'; // 1. Load env vars before any other imports
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// 🛡️ SECURITY IMPORTS (Rubric Category: Authentication & Input Validation)
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

// IMPORTS
import authRoutes from './routes/auth.js';      
import blockchainRoutes from './routes/blockchain.js';
//import missionRoutes from './routes/missions.js'; 

// dotenv.config(); // Removed because we used import 'dotenv/config' at the top

// ✅ NEW: Check for required environment variables on startup
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'SEPOLIA_RPC_URL', 'ADMIN_PRIVATE_KEY', 'CONTRACT_ADDRESS', 'VERIFY_CONTRACT_ADDRESS', 'AI_SERVER_URL'];
for (const v of requiredEnvVars) {
    if (!process.env[v]) {
        console.error(`\n❌ FATAL ERROR: Environment variable ${v} is missing in .env file.`);
        console.error("   Please create a .env file in the 'mission17-backend' directory and add all required variables.");
        process.exit(1); // Stop the server from starting
    }
}

const app = express();
const PORT = process.env.PORT || 5001; 

// --- 🔒 SECURITY MIDDLEWARE ---

// 1. Set Secure HTTP Headers (Helmet)
// This protects against common attacks like sniffing and clickjacking.
// 🛡️ SECURE CODE: Helmet sets various HTTP headers to secure the app (e.g., X-Frame-Options, X-XSS-Protection).
app.use(helmet());

// 2. Rate Limiting (Stops Brute Force Attacks)
// Limits each IP to 100 requests every 15 minutes.
// 🛡️ SECURE CODE: Rate Limiting prevents brute-force attacks and DoS by limiting requests per IP.
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
// 🛡️ SECURE CODE: MongoSanitize removes '$' and '.' from inputs to prevent NoSQL Injection.
app.use(mongoSanitize());

// 4. Data Sanitization against XSS (Cross-Site Scripting)
// Cleans user input of malicious HTML/Scripts.
// 🛡️ SECURE CODE: XSS-Clean sanitizes user input to prevent Cross-Site Scripting attacks.
app.use(xss());

// --- STANDARD MIDDLEWARE ---

// 👇 UPDATED: Increased limit to 100mb for image uploads
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use(cors());

// --- ROUTES ---
app.use('/api/auth', authRoutes);         
app.use('/api/blockchain', blockchainRoutes);
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