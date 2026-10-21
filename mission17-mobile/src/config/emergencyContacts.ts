import { BARANGAY_CONTACTS } from './barangayInfo';

export type EmergencyContactCategory = 'emergency-services' | 'barangay-contacts' | 'government-office';

export type EmergencyContact = {
  id: string;
  label: string;
  contactPerson?: string;
  category: EmergencyContactCategory;
  numbers: { label: string; value: string }[];
};

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: 'mdrrmo', label: 'MDRRMO San Jacinto', category: 'emergency-services',
    numbers: [{ label: 'Mobile', value: '0976-402-4120' }, { label: 'Landline', value: '540-0851' }],
  },
  {
    id: 'rhu', label: 'RHU Ambulance', category: 'emergency-services',
    numbers: [{ label: 'Mobile', value: '0991-642-1048' }, { label: 'Landline', value: '653-3164' }],
  },
  {
    id: 'bfp', label: 'BFP San Jacinto', category: 'emergency-services',
    numbers: [{ label: 'Mobile', value: '0917-189-4611' }],
  },
  {
    id: 'pnp', label: 'PNP San Jacinto', category: 'emergency-services',
    numbers: [{ label: 'Mobile 1', value: '0906-525-9725' }, { label: 'Mobile 2', value: '0998-598-5126' }, { label: 'Landline', value: '653-1762' }],
  },
  ...BARANGAY_CONTACTS.map(contact => ({
    id: contact.id,
    label: contact.label,
    contactPerson: contact.contactPerson,
    category: 'barangay-contacts' as const,
    numbers: [{ label: 'Mobile', value: contact.displayNumber }],
  })),
  {
    id: 'dilg', label: 'DILG', category: 'government-office',
    numbers: [{ label: 'Mobile', value: '0917-140-1895' }],
  },
];
