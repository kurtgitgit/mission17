import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('MONGO_URI must be set before running this diagnostic script.');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(async () => {
    try {
      const BlotterReport = mongoose.model(
        'BlotterReport',
        new mongoose.Schema(
          { userId: mongoose.Schema.Types.ObjectId, status: String },
          { strict: false }
        )
      );
      const User = mongoose.model(
        'User',
        new mongoose.Schema({ username: String, walletAddress: String }, { strict: false })
      );

      const latestReport = await BlotterReport.findOne().sort({ createdAt: -1 });
      console.log('Latest report:', latestReport);

      if (latestReport?.userId) {
        const user = await User.findById(latestReport.userId);
        console.log('Reporter user:', user);
      }
    } catch (error) {
      console.error(error);
    } finally {
      await mongoose.disconnect();
    }
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exitCode = 1;
  });
