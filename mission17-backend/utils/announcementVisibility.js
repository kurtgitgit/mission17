export const buildVisibleAnnouncementFilter = (now = new Date()) => ({
  isActive: true, isArchived: { $ne: true },
  $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
});
