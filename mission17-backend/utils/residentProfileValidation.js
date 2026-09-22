const GENDERS = new Set(['Male', 'Female', 'Other', 'Prefer not to say']);
const CIVIL_STATUSES = new Set(['Single', 'Married', 'Widowed', 'Separated']);
const VOTER_STATUSES = new Set(['Registered', 'Not Registered']);
const EMPLOYMENT_STATUSES = new Set(['Employed', 'Self-Employed', 'Unemployed', 'Student', 'Retired']);
const PROVISIONAL_PUROKS = new Set(['Purok 7', 'Other / Not listed']);
const PERSON_NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;

const PROFILE_TEXT_LIMITS = {
  firstName: 80,
  middleName: 80,
  lastName: 80,
  suffix: 20,
  birthDate: 40,
  placeOfBirth: 160,
  gender: 30,
  civilStatus: 30,
  nationality: 80,
  religion: 80,
  completeAddress: 250,
  purok: 80,
  yearsOfResidency: 3,
  mobileNumber: 11,
  voterStatus: 30,
  employmentStatus: 30,
  occupation: 120,
  householdHead: 120,
  emergencyContactPerson: 160,
  numberOfFamilyMembers: 3,
  educationalAttainment: 120,
  bloodType: 10,
  disability: 160,
  bio: 500
};

export const RESIDENT_PROFILE_FIELDS = Object.freeze([
  ...Object.keys(PROFILE_TEXT_LIMITS),
  'age'
]);

const normalizeText = value => value.trim().replace(/\s+/g, ' ');

const calculateAge = birthDate => {
  const parsed = new Date(birthDate);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - parsed.getFullYear();
  const monthDifference = now.getMonth() - parsed.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && now.getDate() < parsed.getDate())) age -= 1;
  return age;
};

export const normalizeResidentProfile = (input = {}) => {
  const clean = {};

  for (const field of Object.keys(PROFILE_TEXT_LIMITS)) {
    if (input[field] !== undefined) {
      clean[field] = typeof input[field] === 'string' ? normalizeText(input[field]) : input[field];
    }
  }

  if (clean.mobileNumber !== undefined && typeof clean.mobileNumber === 'string') {
    clean.mobileNumber = clean.mobileNumber.replace(/\D/g, '');
  }

  if (input.age !== undefined) clean.age = String(input.age).trim();
  if (typeof clean.birthDate === 'string' && clean.birthDate) {
    const calculatedAge = calculateAge(clean.birthDate);
    if (calculatedAge !== null) clean.age = String(calculatedAge);
  }

  return clean;
};

export const validateResidentProfile = (profile, { requireCore = false, minimumAge = null } = {}) => {
  const requiredFields = [
    ['firstName', 'First name'],
    ['lastName', 'Last name'],
    ['birthDate', 'Birthdate'],
    ['gender', 'Gender'],
    ['civilStatus', 'Civil status'],
    ['nationality', 'Nationality'],
    ['purok', 'Purok / Sitio'],
    ['completeAddress', 'Complete address'],
    ['mobileNumber', 'Mobile number'],
    ['voterStatus', 'Voter status']
  ];

  if (requireCore) {
    const missing = requiredFields.find(([field]) => typeof profile[field] !== 'string' || !profile[field]);
    if (missing) return `${missing[1]} is required.`;
  }

  for (const [field, maxLength] of Object.entries(PROFILE_TEXT_LIMITS)) {
    if (profile[field] !== undefined && typeof profile[field] !== 'string') {
      return `${field} must be text.`;
    }
    if (typeof profile[field] === 'string' && profile[field].length > maxLength) {
      return `${field} cannot exceed ${maxLength} characters.`;
    }
  }

  if (profile.firstName !== undefined && !profile.firstName) return 'First name cannot be empty.';
  if (profile.lastName !== undefined && !profile.lastName) return 'Last name cannot be empty.';
  if (profile.firstName !== undefined && !PERSON_NAME_PATTERN.test(profile.firstName)) {
    return 'First name may contain letters, spaces, hyphens, apostrophes, and periods only.';
  }
  if (profile.middleName !== undefined && profile.middleName && !PERSON_NAME_PATTERN.test(profile.middleName)) {
    return 'Middle name may contain letters, spaces, hyphens, apostrophes, and periods only.';
  }
  if (profile.lastName !== undefined && !PERSON_NAME_PATTERN.test(profile.lastName)) {
    return 'Last name may contain letters, spaces, hyphens, apostrophes, and periods only.';
  }
  if (profile.mobileNumber !== undefined && !/^09\d{9}$/.test(profile.mobileNumber)) {
    return 'Mobile number must be an 11-digit Philippine number beginning with 09.';
  }
  if (profile.birthDate !== undefined) {
    if (!profile.birthDate) return 'Birthdate cannot be empty.';
    const age = calculateAge(profile.birthDate);
    if (age === null || age < 0 || age > 120) return 'Please provide a valid birthdate that is not in the future.';
    if (minimumAge !== null && age < minimumAge) return `Residents must be at least ${minimumAge} years old to register.`;
  }
  if (profile.age !== undefined && (!/^\d{1,3}$/.test(profile.age) || Number(profile.age) > 120)) {
    return 'Age must be a whole number from 0 to 120.';
  }
  if (profile.gender !== undefined && !GENDERS.has(profile.gender)) return 'Please select a valid gender.';
  if (profile.civilStatus !== undefined && !CIVIL_STATUSES.has(profile.civilStatus)) return 'Please select a valid civil status.';
  if (profile.nationality !== undefined && (profile.nationality.length < 2 || profile.nationality.length > 80)) {
    return 'Nationality must be between 2 and 80 characters.';
  }
  if (profile.completeAddress !== undefined && profile.completeAddress.length < 5) {
    return 'Complete address must contain at least 5 characters.';
  }
  if (requireCore && !PROVISIONAL_PUROKS.has(profile.purok)) {
    return 'Please select a valid Purok / Sitio.';
  }
  if (profile.voterStatus !== undefined && !VOTER_STATUSES.has(profile.voterStatus)) return 'Please select a valid voter status.';
  if (profile.employmentStatus !== undefined && profile.employmentStatus && !EMPLOYMENT_STATUSES.has(profile.employmentStatus)) {
    return 'Please select a valid employment status.';
  }

  return null;
};
