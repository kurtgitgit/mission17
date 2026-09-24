export const MINIMUM_SIGNUP_AGE = 18;
export const MAXIMUM_RESIDENT_AGE = 120;

const PERSON_NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;

export const sanitizePersonName = (value: string) => value
  .replace(/[^\p{L}\p{M} .'-]/gu, '')
  .replace(/\s{2,}/g, ' ')
  .slice(0, 80);

export const isValidPersonName = (value: string) => PERSON_NAME_PATTERN.test(value.trim());

export const parseBirthDate = (value: string | Date) => {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12);
  }

  const normalized = value.trim();
  const usDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(normalized);
  const isoDate = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/.exec(normalized);

  const year = usDate ? Number(usDate[3]) : isoDate ? Number(isoDate[1]) : NaN;
  const month = usDate ? Number(usDate[1]) : isoDate ? Number(isoDate[2]) : NaN;
  const day = usDate ? Number(usDate[2]) : isoDate ? Number(isoDate[3]) : NaN;

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;

  const parsed = new Date(year, month - 1, day, 12);
  if (
    parsed.getFullYear() !== year
    || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day
  ) return null;

  return parsed;
};

export const calculateAge = (value: string | Date) => {
  const birthDate = parseBirthDate(value);
  if (!birthDate) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) age -= 1;
  return age;
};

export const getLatestEligibleBirthDate = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - MINIMUM_SIGNUP_AGE);
  date.setHours(23, 59, 59, 999);
  return date;
};

export const formatBirthDate = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
};

export const getPasswordRequirements = (password: string) => ({
  minimumLength: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
  specialCharacter: /[^A-Za-z0-9]/.test(password),
});

export const isStrongSignupPassword = (password: string) =>
  Object.values(getPasswordRequirements(password)).every(Boolean);
