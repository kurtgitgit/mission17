
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../mission17-backend/.env') });

const UserSchema = new mongoose.Schema({
  email: String,
  username: String
});

const User = mongoose.model('User', UserSchema);

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = 'kusa.perez.up@phinmaed.com';
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      console.log('USER_FOUND:', JSON.stringify(user));
    } else {
      console.log('USER_NOT_FOUND');
    }
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkUser();
