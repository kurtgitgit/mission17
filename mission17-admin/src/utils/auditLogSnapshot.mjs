const VISIBLE_AUDIT_FIELDS = [
  '_id',
  'timestamp',
  'username',
  'action',
  'details',
  'ipAddress',
];

export const sameAuditLogSnapshot = (previous, next) => (
  Array.isArray(previous)
  && Array.isArray(next)
  && previous.length === next.length
  && previous.every((current, index) => {
    const incoming = next[index];
    return VISIBLE_AUDIT_FIELDS.every((field) => current?.[field] === incoming?.[field]);
  })
);
