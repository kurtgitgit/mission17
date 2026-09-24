// Confirmed Barangay Bagong Pag-asa purok directory.
export const FIXED_BARANGAY_ADDRESS = 'Barangay Bagong Pag-asa, San Jacinto, Pangasinan';

export const PUROK_OPTIONS = [
  'Purok 1',
  'Purok 2',
  'Purok 3',
  'Purok 4',
  'Purok 5',
  'Purok 6',
  'Purok 7',
] as const;

export const isDirectoryPurok = (value?: string) =>
  PUROK_OPTIONS.includes(value as typeof PUROK_OPTIONS[number]);
