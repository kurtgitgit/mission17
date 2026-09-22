import { normalizeResidentProfile, validateResidentProfile } from './residentProfileValidation.js';

describe('resident profile validation', () => {
  const validProfile = {
    firstName: '  Juan ', lastName: ' Dela   Cruz ', birthDate: '2000-01-15', age: '99',
    gender: 'Male', civilStatus: 'Single', nationality: 'Filipino',
    purok: 'Purok 7', completeAddress: 'Near Barangay Hall', mobileNumber: '0917 123 4567', voterStatus: 'Registered'
  };

  it('normalizes core fields and derives age from birthdate', () => {
    const clean = normalizeResidentProfile(validProfile);
    expect(clean.firstName).toBe('Juan');
    expect(clean.lastName).toBe('Dela Cruz');
    expect(clean.mobileNumber).toBe('09171234567');
    expect(Number(clean.age)).toBeGreaterThanOrEqual(25);
    expect(validateResidentProfile(clean, { requireCore: true })).toBeNull();
  });

  it('rejects invalid dropdown, phone, and future birthdate values', () => {
    expect(validateResidentProfile(normalizeResidentProfile({ ...validProfile, gender: 'Invalid' }), { requireCore: true })).toMatch(/gender/i);
    expect(validateResidentProfile(normalizeResidentProfile({ ...validProfile, mobileNumber: '123' }), { requireCore: true })).toMatch(/mobile/i);
    expect(validateResidentProfile(normalizeResidentProfile({ ...validProfile, birthDate: '2999-01-01' }), { requireCore: true })).toMatch(/birthdate/i);
  });

  it('requires a provisional purok selection for new or resubmitted registrations', () => {
    expect(validateResidentProfile(normalizeResidentProfile({ ...validProfile, purok: '' }), { requireCore: true })).toMatch(/purok/i);
    expect(validateResidentProfile(normalizeResidentProfile({ ...validProfile, purok: 'Purok 2' }), { requireCore: true })).toMatch(/purok/i);
    expect(validateResidentProfile(normalizeResidentProfile({ ...validProfile, purok: 'Other / Not listed' }), { requireCore: true })).toBeNull();
  });
});
