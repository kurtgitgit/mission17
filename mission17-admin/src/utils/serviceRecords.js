export const newestFirst = (a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) || String(b._id).localeCompare(String(a._id));
export const philippineToday = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year:'numeric',month:'2-digit',day:'2-digit' }).format(now);
export const manilaDateTimeInput = (date) => new Date(new Date(date).getTime() + 8 * 3600000).toISOString().slice(0,16);
