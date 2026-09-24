import 'dotenv/config';
import mongoose from 'mongoose';
import { writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Mission from '../models/Mission.js';
import Event from '../models/Event.js';
import Submission from '../models/Submission.js';
import AuditLog from '../models/AuditLog.js';

const APPLY_FLAG = '--apply';
const CONFIRMATION_FLAG = '--confirm=PURGE_CIVIC_CONTENT';
const applyChanges = process.argv.includes(APPLY_FLAG);
const confirmed = process.argv.includes(CONFIRMATION_FLAG);

const listTitles = (records) => records.map((record) => `- ${record.title} (${record._id})`).join('\n') || '- None';

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is required. Civic content was not changed.');
  process.exitCode = 1;
} else if (applyChanges && !confirmed) {
  console.error(`Refusing to purge. Re-run with ${APPLY_FLAG} ${CONFIRMATION_FLAG}.`);
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const [missions, events, missionSubmissionCount, eventSubmissionCount] = await Promise.all([
      Mission.find({}).sort({ createdAt: 1 }).lean(),
      Event.find({}).sort({ date: 1, time: 1 }).lean(),
      Submission.countDocuments({ type: 'Mission' }),
      Submission.countDocuments({ type: 'Event' }),
    ]);

    console.log(`Missions to permanently delete: ${missions.length}`);
    console.log(listTitles(missions));
    console.log(`Events to permanently delete: ${events.length}`);
    console.log(listTitles(events));
    console.log(`Historical mission submissions to preserve: ${missionSubmissionCount}`);
    console.log(`Historical event submissions to preserve: ${eventSubmissionCount}`);

    if (!applyChanges) {
      console.log(`Dry run only. No data was changed. Re-run with ${APPLY_FLAG} ${CONFIRMATION_FLAG} after reviewing this list.`);
    } else {
      const backup = { createdAt: new Date().toISOString(), missions, events };
      const backupPath = path.join(os.tmpdir(), `brgylink-civic-content-backup-${Date.now()}.json`);
      await writeFile(backupPath, JSON.stringify(backup, null, 2), { flag: 'wx' });

      const [missionResult, eventResult] = await Promise.all([
        Mission.deleteMany({}),
        Event.deleteMany({}),
      ]);

      await AuditLog.create({
        username: 'system-maintenance',
        action: 'CIVIC_CONTENT_PURGED',
        details: `Permanently deleted ${missionResult.deletedCount} missions and ${eventResult.deletedCount} events. Historical submissions were preserved. Backup: ${backupPath}`,
      });

      console.log(`Backup written to: ${backupPath}`);
      console.log(`Purge complete. Deleted ${missionResult.deletedCount} missions and ${eventResult.deletedCount} events.`);
      console.log('Resident submissions were not deleted.');
    }
  } catch (error) {
    console.error('Civic content purge failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
