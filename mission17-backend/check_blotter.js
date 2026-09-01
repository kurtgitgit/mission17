import mongoose from 'mongoose';
import 'dotenv/config';
import BlotterReport from './models/BlotterReport.js';

const referenceNumber = process.argv[2];

if (!process.env.MONGO_URI || !referenceNumber) {
  console.error('Usage: MONGO_URI=... node check_blotter.js <reference-number>');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      const report = await BlotterReport.findOne({ referenceNumber });
      console.log('Evidence URL:', report?.evidenceUrl ?? 'No report found');
    } finally {
      await mongoose.disconnect();
    }
  })
  .catch((error) => {
    console.error('Database query failed:', error.message);
    process.exitCode = 1;
  });
