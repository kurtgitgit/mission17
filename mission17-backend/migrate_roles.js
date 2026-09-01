import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('MONGO_URI must be set before running this migration.');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(async () => {
    try {
      const result = await mongoose.connection.collection('users').updateMany(
        { role: 'teacher' },
        { $set: { role: 'resident' } }
      );
      console.log(`Migrated ${result.modifiedCount} users from teacher to resident.`);
    } finally {
      await mongoose.disconnect();
    }
  })
  .catch((error) => {
    console.error('Role migration failed:', error.message);
    process.exitCode = 1;
  });
