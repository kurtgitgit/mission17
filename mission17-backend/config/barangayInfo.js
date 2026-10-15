export const BARANGAY_INFO = Object.freeze({
  name: 'Barangay Bagong Pag-asa',
  municipality: 'San Jacinto, Pangasinan',
  address: 'Barangay Bagong Pag-asa, San Jacinto, Pangasinan',
  mobileNumber: '09916982914',
  mobileDisplay: '0991-698-2914',
  contactPerson: 'Bhea Monique San Miguel, Barangay Secretary',
  email: 'b.pag.asasj@gmail.com',
  officeDays: 'Monday-Saturday',
  officeHours: '8:00 AM-5:00 PM',
});

// Keep the chatbot's emergency guidance aligned with the verified hotline
// directory displayed on the resident Home screen.
export const LOCAL_EMERGENCY_HOTLINES = Object.freeze([
  { category: 'medical', label: 'RHU Ambulance', numbers: Object.freeze(['0991-642-1048', '653-3164']) },
  { category: 'fire', label: 'BFP San Jacinto', numbers: Object.freeze(['0917-189-4611']) },
  { category: 'police', label: 'PNP San Jacinto', numbers: Object.freeze(['0906-525-9725', '0998-598-5126', '653-1762']) },
  { category: 'disaster', label: 'MDRRMO San Jacinto', numbers: Object.freeze(['0976-402-4120', '540-0851']) },
  { category: 'barangay', label: 'Barangay Hall', numbers: Object.freeze(['0991-698-2914']) },
  { category: 'barangay', label: 'Chief Tanod', numbers: Object.freeze(['0933-682-8737']) },
]);
