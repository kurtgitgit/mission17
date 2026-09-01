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
      const users = await mongoose.connection.collection('users').find({}).toArray();
      console.log(`Users in the configured database: ${users.length}`);
      users.forEach((user) => console.log(`- Username: ${user.username}, Role: ${user.role}`));
    } finally {
      await mongoose.disconnect();
    }
  })
  .catch((error) => {
    console.error('Database query failed:', error.message);
    process.exitCode = 1;
  });
