/**
 * One-time content cleanup for the AWS backend migration.
 *
 * - uploads locally stored mission images to Cloudinary;
 * - replaces legacy /uploads URLs in MongoDB with durable Cloudinary URLs;
 * - soft-hides known Barangay Pantal sample records rather than deleting them.
 *
 * Run from mission17-backend after confirming .env contains the production
 * MongoDB and Cloudinary credentials:
 *   node scripts/migrate-legacy-content.js
 */
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import Mission from '../models/Mission.js';
import Announcement from '../models/Announcement.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDirectory = path.join(__dirname, '..', 'uploads');
const staleContentPattern = /\b(barangay\s+pantal|pantal\s+(elementary|covered|multi-purpose|river)|dagupan|dcwd)\b/i;

for (const name of ['MONGO_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
  if (!process.env[name]) throw new Error(`Missing required environment variable: ${name}`);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isLegacyUploadPath = (image) => typeof image === 'string' && /^\/uploads\/[A-Za-z0-9._-]+$/.test(image);

try {
  await mongoose.connect(process.env.MONGO_URI);

  const legacyMissions = await Mission.find({ image: { $regex: '^/uploads/' } });
  let migratedImages = 0;

  for (const mission of legacyMissions) {
    if (!isLegacyUploadPath(mission.image)) continue;
    const filename = path.basename(mission.image);
    const sourcePath = path.join(uploadsDirectory, filename);

    try {
      await fs.access(sourcePath);
      const uploaded = await cloudinary.uploader.upload(sourcePath, {
        folder: 'mission17-missions',
        resource_type: 'image',
        public_id: filename.replace(/\.[^.]+$/, ''),
        overwrite: false,
      });
      mission.image = uploaded.secure_url;
      await mission.save();
      migratedImages += 1;
      console.log(`Migrated mission image: ${mission.title}`);
    } catch (error) {
      // Leave the original reference unchanged for manual recovery if a local
      // file is absent or Cloudinary rejects it.
      console.error(`Could not migrate image for "${mission.title}": ${error.message}`);
    }
  }

  const announcementResult = await Announcement.updateMany(
    { $or: [{ title: staleContentPattern }, { body: staleContentPattern }, { postedBy: staleContentPattern }] },
    { $set: { isActive: false } },
  );

  // Use the native collection so legacy fields such as `location` are included
  // even when older documents predate the current Mongoose schema.
  const missionResult = await Mission.collection.updateMany(
    { $or: [{ title: staleContentPattern }, { description: staleContentPattern }, { location: staleContentPattern }] },
    { $set: { isActive: false } },
  );

  console.log(`Migrated ${migratedImages} legacy mission image(s).`);
  console.log(`Soft-hidden ${announcementResult.modifiedCount} outdated announcement(s).`);
  console.log(`Soft-hidden ${missionResult.modifiedCount} outdated mission(s).`);
} finally {
  await mongoose.disconnect();
}
