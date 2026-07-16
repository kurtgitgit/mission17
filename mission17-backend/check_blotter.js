import mongoose from 'mongoose';
import BlotterReport from './models/BlotterReport.js';

mongoose.connect('mongodb://localhost:27017/mission17').then(async () => {
  const report = await BlotterReport.findOne({ referenceNumber: 'BLOTTER-2026-43680' });
  console.log('EVIDENCE URL:', report?.evidenceUrl);
  process.exit(0);
});
