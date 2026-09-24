import 'dotenv/config';
import mongoose from 'mongoose';
import { writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Official from '../models/Official.js';
import { VERIFIED_OFFICIAL_ROSTER } from '../config/officialRoster.js';

const applyChanges = process.argv.includes('--apply');
const normalize = (value = '') => value.trim().replace(/\s+/g, ' ').toLowerCase();
const identityKeyFor = official => `${normalize(official.name)}|${normalize(official.position)}|${normalize(official.term || '')}`;

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is required. The roster was not changed.');
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingOfficials = await Official.find({}).lean();
    const verifiedNames = new Set(VERIFIED_OFFICIAL_ROSTER.map(official => `${normalize(official.name)}|${normalize(official.position)}`));
    const mockRecords = existingOfficials.filter(official => !verifiedNames.has(`${normalize(official.name)}|${normalize(official.position)}`));

    console.log(`Verified roster records: ${VERIFIED_OFFICIAL_ROSTER.length}`);
    console.log(`Current records: ${existingOfficials.length}`);
    console.log(`Records to remove as replaced mock data: ${mockRecords.length}`);
    for (const official of mockRecords) console.log(`- ${official.name} (${official.position})${official.isArchived ? ' [archived]' : ''}`);

    if (!applyChanges) {
      console.log('Dry run only. Re-run with --apply after reviewing this list.');
    } else {
      const backupPath = path.join(os.tmpdir(), `brgylink-officials-backup-${Date.now()}.json`);
      await writeFile(backupPath, JSON.stringify(existingOfficials, null, 2), { flag: 'wx' });
      console.log(`Existing roster backup written to: ${backupPath}`);

      const verifiedRecordIds = [];
      for (const official of VERIFIED_OFFICIAL_ROSTER) {
        const identityKey = identityKeyFor(official);
        const existing = await Official.findOne({ identityKey })
          || await Official.findOne({ name: official.name, position: official.position });
        const data = {
          ...official,
          email: official.email || null,
          photo: null,
          identityKey,
          isArchived: false,
          archivedAt: null,
          archiveReason: null,
        };

        const saved = existing
          ? await Official.findByIdAndUpdate(existing._id, { $set: data }, { new: true, runValidators: true })
          : await Official.create(data);
        verifiedRecordIds.push(saved._id);
      }

      await Official.deleteMany({ _id: { $nin: verifiedRecordIds } });

      const activeCount = await Official.countDocuments({ isArchived: { $ne: true } });
      console.log(`Roster replacement complete. Active verified officials: ${activeCount}`);
    }
  } catch (error) {
    console.error('Official roster replacement failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
