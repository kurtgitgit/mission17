// Provisional directory only. Expand this list only after the Barangay or
// Municipal LGU provides an approved purok/street directory.
export const FIXED_BARANGAY_ADDRESS = 'Barangay Bagong Pag-asa, San Jacinto, Pangasinan';

export const PUROK_OPTIONS = [
  'Purok 7',
  'Other / Not listed',
] as const;

export const isDirectoryPurok = (value?: string) =>
  PUROK_OPTIONS.includes(value as typeof PUROK_OPTIONS[number]);
