export const OFFICIAL_POSITIONS = [
  'Punong Barangay', 'Barangay Kagawad', 'SK Chairperson', 'Barangay Secretary',
  'Barangay Treasurer', 'Chief Tanod', 'BHW President',
];

export const PUBLIC_OFFICIAL_FIELDS = '_id name position photo contact email term termNumber committee order';
const rank = position => {
  const index = OFFICIAL_POSITIONS.indexOf(position);
  return index < 0 ? OFFICIAL_POSITIONS.length : index;
};
export const compareOfficials = (a, b) => rank(a.position) - rank(b.position)
  || String(a.position).localeCompare(String(b.position))
  || (a.order ?? 99) - (b.order ?? 99)
  || String(a._id).localeCompare(String(b._id));

export const publicOfficial = row => Object.fromEntries(
  PUBLIC_OFFICIAL_FIELDS.split(' ').filter(key => row[key] !== undefined).map(key => [key, row[key]]),
);

export const canReorderOfficials = async db => {
  try {
    const hello = await db.admin().command({ hello: 1 }, { maxTimeMS: 5000 });
    return Boolean(hello.setName || hello.msg === 'isdbgrid');
  } catch { return false; }
};
