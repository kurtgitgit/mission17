import { VERIFIED_OFFICIAL_ROSTER } from './officialRoster.js';

describe('verified official roster', () => {
  it('contains the confirmed 2023 - 2026 council without duplicate identities', () => {
    expect(VERIFIED_OFFICIAL_ROSTER).toHaveLength(11);

    const identities = VERIFIED_OFFICIAL_ROSTER.map(official => `${official.name}|${official.position}|${official.term}`);
    expect(new Set(identities).size).toBe(identities.length);
    expect(VERIFIED_OFFICIAL_ROSTER.every(official => official.term === '2023 - 2026')).toBe(true);
  });

  it('uses the confirmed secretary number as the barangay contact', () => {
    const secretary = VERIFIED_OFFICIAL_ROSTER.find(official => official.position === 'Barangay Secretary');
    expect(secretary).toMatchObject({
      name: 'Bhea Monique San Miguel',
      contact: '09916982914',
    });
  });

  it('stores the confirmed Juanito Ramos spelling and Kagawad term numbers', () => {
    expect(VERIFIED_OFFICIAL_ROSTER).toContainEqual(expect.objectContaining({
      name: 'Juanito R. Ramos',
      termNumber: '2nd',
    }));

    const kagawads = VERIFIED_OFFICIAL_ROSTER.filter(official => official.position === 'Barangay Kagawad');
    expect(kagawads).toHaveLength(7);
    expect(kagawads.every(official => ['1st', '2nd', 'Last'].includes(official.termNumber))).toBe(true);
  });
});
