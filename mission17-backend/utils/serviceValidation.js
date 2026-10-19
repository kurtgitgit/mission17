export const hasMeaningfulText = (value) => typeof value === 'string' && /\p{L}/u.test(value) && !/^(.)\1+$/u.test(value.replace(/\s/gu, '')) && !Array.from(value).some(char => {
  const code = char.charCodeAt(0);
  return code === 127 || (code < 32 && ![9, 10, 13].includes(code));
});
export const philippineDate = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
export function parsePickupDate(value, now = new Date()) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value || value < philippineDate(now)) return null;
  return date;
}
