import mongoose from 'mongoose';
import asyncHandler from './asyncHandler.js';
import { logAudit } from './authMiddleware.js';

export const archiveRecord = (Model, terminalStatuses) => asyncHandler(async (req, res) => {
  const { archived } = req.body;
  if (typeof archived !== 'boolean' || !mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: 'Provide a valid record ID and an archived boolean.' });
  const record = await Model.findById(req.params.id);
  if (!record) return res.status(404).json({ message: 'Record not found.' });
  if (archived && !terminalStatuses.includes(record.status)) return res.status(409).json({ message: 'Complete or close this record before archiving it.' });
  if (Boolean(record.isArchived) === archived) return res.json({ message: archived ? 'Record already archived.' : 'Record already restored.', isArchived: archived, archivedAt: record.archivedAt || null });
  const updated = await Model.findOneAndUpdate({ _id: record._id, ...(archived ? { status: { $in: terminalStatuses } } : {}) }, { $set: {
    isArchived: archived, archivedAt: archived ? new Date() : null, archivedBy: archived ? req.user._id : null,
  } }, { new: true });
  if (!updated) return res.status(409).json({ message: 'The record changed. Refresh before trying again.' });
  logAudit(req.user._id, req.user.username, archived ? 'RECORD_ARCHIVE' : 'RECORD_RESTORE', `${Model.modelName}: ${record._id}`, req);
  res.json({ message: archived ? 'Record archived.' : 'Record restored.', isArchived: updated.isArchived, archivedAt: updated.archivedAt });
});
