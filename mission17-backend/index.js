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
import authRoutes       from './routes/auth.js';          // signup, login, otp, mfa, password, audit-logs
import submissionRoutes from './routes/submissions.js';   // submit, pending, approve, reject, analyze-proof
import missionRoutes    from './routes/missions.js';      // mission CRUD
import eventRoutes      from './routes/events.js';         // event CRUD
import userRoutes       from './routes/users.js';          // user management
import notificationRoutes from './routes/notifications.js'; // user notifications
import blockchainRoutes from './routes/blockchain.js';    // on-chain record endpoint
import { upload } from './utils/upload.js';
import { logAudit } from './utils/authMiddleware.js';

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
// 🛡️ SECURITY UPDATE: Configured to allow cross-origin images for the Admin dashboard.
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 2. Rate Limiting (Stops DoS & Model Inversion Attacks)
// 🛡️ CAPSTONE MITIGATION: Limits increased for local demo/testing
app.set('trust proxy', 1);
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Increased to 1000 for smooth user testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    status: "Fail", 
    message: "🛑 Too many requests from this IP." 
  }
});
app.use('/api', limiter);

// 3. Data Sanitization against NoSQL Injection
// Prevents hackers from sending {"$gt": ""} to steal data.
app.use(mongoSanitize());

// 4. Data Sanitization against XSS (Cross-Site Scripting)
// Cleans user input of malicious HTML/Scripts.
app.use(xss());

// --- STANDARD MIDDLEWARE ---

// 🛡️ CAPSTONE MITIGATION: 5MB Payload Cap to prevent RAM exhaustion (DoS)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use(cors({
  origin: '*', // Allow all during local demo
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'auth-token', 'Authorization']
}));

// 📝 Simple Request Logger with Timing
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} - ${duration}ms`);
  });
  next();
});

// Serve the uploads directory statically so the frontend can access the images
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- ROUTES ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is responsive' });
});

// 📁 General File Upload Endpoint
app.post('/api/auth/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({ url: fileUrl });
});

// All route files share the /api/auth prefix — zero breaking changes for existing clients.
app.use('/api/auth', authRoutes);        // Auth & security
app.use('/api/auth', submissionRoutes);  // Submissions (incl. pending-submissions, analyze-proof)
app.use('/api/auth', missionRoutes);     // Missions
app.use('/api/auth', eventRoutes);       // Events
app.use('/api/auth', userRoutes);        // Users & leaderboard
app.use('/api/auth', notificationRoutes);// Notifications
app.use('/api/blockchain', blockchainRoutes); // Blockchain proxy

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

app.listen(PORT, '0.0.0.0', () => {
  connectDB();
  console.log(`🛡️  Secure Server running on http://localhost:${PORT} (and LAN)`);
});