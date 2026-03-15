
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const UserSchema = new mongoose.Schema({
  email: String,
  username: String,
  isVerified: Boolean
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // List all users to see what's in the DB
    const allUsers = await User.find({});
    
    // Check specific users
    const emailsToCheck = ['kusa.perez.up@phinmaed.com', 'owner@gmail.com'];
    
    for (const email of emailsToCheck) {
      const user = allUsers.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
      if (user) {
        console.log(`USER_DETAILS for ${email}:`, JSON.stringify({
          _id: user._id,
          username: user.username,
          isVerified: user.isVerified
        }));
      } else {
        console.log(`USER_NOT_FOUND: ${email}`);
      }
    }
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkUser();
