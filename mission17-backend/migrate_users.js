
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const UserSchema = new mongoose.Schema({
  email: String,
  isVerified: Boolean
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function migrateUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Set isVerified: true for everyone who doesn't have it set explicitly
    const result = await User.updateMany(
      { isVerified: { $exists: false } }, 
      { $set: { isVerified: true } }
    );
    
    console.log(`MIGRATION_COMPLETE: ${result.modifiedCount} users verified.`);
    
    // Also check if owner@gmail.com specifically
    const owner = await User.findOne({ email: 'owner@gmail.com' });
    if (owner && !owner.isVerified) {
       owner.isVerified = true;
       await owner.save();
       console.log('OWNER_MANUALLY_VERIFIED');
    }

  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await mongoose.connection.close();
  }
}

migrateUsers();
