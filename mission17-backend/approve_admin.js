import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Import the User model directly if needed, or define a simple schema
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', userSchema, 'users');

    const result = await User.findOneAndUpdate(
      { email: 'perezkurt63@gmail.com' },
      { $set: { accountStatus: 'approved', isVerified: true } },
      { new: true }
    );
    
    if (result) {
      console.log('Successfully approved user account:', result.email);
    } else {
      console.log('User account not found in database.');
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });
