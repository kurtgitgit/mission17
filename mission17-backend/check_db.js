import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://kurtperez2024:B9Wn7Vw49eF9G7A4@mission17.7a74y.mongodb.net/mission17-db?retryWrites=true&w=majority')
  .then(async () => {
    try {
      const BlotterReport = mongoose.model('BlotterReport', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, status: String }, { strict: false }));
      const User = mongoose.model('User', new mongoose.Schema({ username: String, walletAddress: String }, { strict: false }));

      const latestReport = await BlotterReport.findOne().sort({ createdAt: -1 });
      console.log('Latest Report:', latestReport);
      
      if (latestReport && latestReport.userId) {
        const user = await User.findById(latestReport.userId);
        console.log('\nReporter User:', user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      mongoose.disconnect();
    }
  });
