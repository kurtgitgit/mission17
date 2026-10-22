export function toggleAllNotificationIds(selectedIds: string[], notificationIds: string[]): string[] {
  const allIds = Array.from(new Set(notificationIds.filter(Boolean)));
  if (allIds.length === 0) return selectedIds;

  const allSelected = allIds.every(id => selectedIds.includes(id));
  if (allSelected) {
    const idsToRemove = new Set(allIds);
    return selectedIds.filter(id => !idsToRemove.has(id));
  }

  return Array.from(new Set([...selectedIds, ...allIds]));
}
