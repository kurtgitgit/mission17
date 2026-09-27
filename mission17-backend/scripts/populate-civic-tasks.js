import 'dotenv/config';
import mongoose from 'mongoose';
import Mission from '../models/Mission.js';
import AuditLog from '../models/AuditLog.js';
import { CIVIC_TASK_CATALOG } from '../config/civicTaskCatalog.js';
import { cloudinary } from '../utils/cloudinary.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const applyChanges = process.argv.includes('--apply');
const identityQuery = task => ({ title: task.title, sdgNumber: task.sdgNumber });
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const imageDirectory = path.resolve(scriptDirectory, '..', 'public', 'civic-task-images');
const publicIdFor = imageFile => `brgylink/civic-tasks/${path.parse(imageFile).name}`;

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is required. Civic tasks were not changed.');
  process.exitCode = 1;
} else {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const results = [];
    for (const task of CIVIC_TASK_CATALOG) {
      const existing = await Mission.findOne(identityQuery(task)).lean();
      results.push({ task, existing });
    }

    const missing = results.filter(result => !result.existing);
    const existing = results.filter(result => result.existing);

    console.log(`Catalog tasks: ${CIVIC_TASK_CATALOG.length}`);
    console.log(`Matching existing tasks: ${existing.length}`);
    for (const result of existing) {
      console.log(`- SKIP ${result.task.title} (SDG ${result.task.sdgNumber})${result.existing.isActive === false ? ' [archived]' : ''}`);
    }
    console.log(`Tasks to create: ${missing.length}`);
    for (const result of missing) console.log(`- ADD ${result.task.title} (SDG ${result.task.sdgNumber})`);

    if (!applyChanges) {
      console.log('Dry run only. Re-run with --apply after reviewing this list.');
    } else if (missing.length === 0) {
      console.log('No changes needed. The civic task catalog is already present.');
    } else {
      const created = [];
      for (const { task } of missing) {
        const { imageFile, ...missionData } = task;
        console.log(`Uploading cover: ${imageFile}`);
        const upload = await cloudinary.uploader.upload(path.join(imageDirectory, imageFile), {
          public_id: publicIdFor(imageFile),
          overwrite: true,
          invalidate: true,
          resource_type: 'image',
        });
        const mission = await Mission.create({ ...missionData, image: upload.secure_url });
        created.push(mission);
        console.log(`Created: ${mission.title}`);
      }
      await AuditLog.create({
        username: 'system-maintenance',
        action: 'CIVIC_TASK_CATALOG_POPULATED',
        details: `Created ${created.length} catalog civic tasks. Existing and archived matching tasks were preserved.`,
      });
      console.log(`Population complete. Created ${created.length} civic tasks.`);
      console.log('Existing tasks, archived tasks, submissions, and events were not changed.');
    }
  } catch (error) {
    console.error('Civic task population failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
