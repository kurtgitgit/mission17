import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = "mongodb+srv://perezkurt63_db_user:d99saqAQzmd5Rm26@cluster0.uodwiq5.mongodb.net/?appName=Cluster0&tls=true";

mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.useDb('test'); // Or whatever the DB name is
    const result = await db.collection('users').updateMany(
      { role: 'teacher' },
      { $set: { role: 'resident' } }
    );
    console.log(`Migrated ${result.modifiedCount} users from 'teacher' to 'resident'`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
