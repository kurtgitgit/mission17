type Fields = Record<string, any>;
const clean = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
export const meaningfulText = (value: string) => /\p{L}/u.test(value) && !/^(.)\1+$/u.test(value.replace(/\s/gu,'')) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value);
const text = (value: unknown,min: number,max: number) => {const str=clean(value);return str.length>=min&&str.length<=max&&meaningfulText(str);};
const nameLetter = String.raw`(?:\p{L}\p{M}*)`;
const nameWord = `${nameLetter}+(?:[-'’]${nameLetter}+)*`;
const nameInitial = `${nameLetter}\\.`;
const residentNamePattern = new RegExp(`^(?:${nameWord}|${nameInitial})(?: +(?:${nameWord}|${nameInitial}))*(?: +(?:[Jj][Rr]|[Ss][Rr])\\.)?$`, 'u');
const residentName = (value: unknown) => {
  const str = clean(value);
  return str.length >= 3 && str.length <= 120
    && residentNamePattern.test(str)
    && meaningfulText(str);
};
const phone = (value: unknown) => /^09\d{9}$/.test(clean(value).replace(/\s/g,''));
const DOCUMENTS=['Barangay Clearance','Certificate of Indigency','Certificate of Residency','Business Clearance','Certificate of Good Moral Character','Barangay ID','Certificate of Tree Planting','Certificate for First-Time Job Seeker','Oath of Undertaking','Certificate of Low Income','Other'];
export function validateDocumentRequest(v: Fields): Record<string,string> {
  const e: Record<string,string>={};
  if(!DOCUMENTS.includes(v.docType))e.docType='Please choose a valid document type.';
  if(v.docType==='Other'&&!text(v.customDocumentType,3,80))e.customDocumentType='Specify the document using 3–80 meaningful characters.';
  if(!residentName(v.fullName))e.fullName='Enter your full name using letters, spaces, initials, hyphens, or apostrophes (3–120 characters); numbers are not allowed.';
  if(!text(v.address,5,250))e.address='Enter your Purok / street address using 5–250 characters.';
  if(!phone(v.contact))e.contact='Enter a valid 11-digit Philippine mobile number starting with 09.';
  if(!text(v.purpose,5,500))e.purpose='Explain the purpose using 5–500 meaningful characters.';
  return e;
}
export function validateFeedbackRequest(v: Fields): Record<string,string> {
  const e: Record<string,string>={};
  if(!['General','Infrastructure','Public Safety','Cleanliness','Other Concern'].includes(v.category))e.category='Please choose a valid concern category.';
  if(!text(v.title,5,100))e.title='Enter a clear title using 5–100 meaningful characters.';
  if(!text(v.description,10,500))e.description='Describe your concern using 10–500 meaningful characters.';
  return e;
}
export function validateBlotterRequest(v: Fields): Record<string,string> {
  const e: Record<string,string>={};
  if(!residentName(v.fullName))e.fullName='Enter your full name using letters, spaces, initials, hyphens, or apostrophes (3–120 characters); numbers are not allowed.';
  if(!phone(v.contactNumber))e.contactNumber='Enter a valid 11-digit Philippine mobile number starting with 09.';
  if(!['Theft','Vandalism','Disturbance','Accident','Other'].includes(v.incidentType))e.incidentType='Choose a valid incident type.';
  if(v.incidentType==='Other'&&!text(v.customIncidentType,3,80))e.customIncidentType='Describe the incident type using 3–80 meaningful characters.';
  const location=clean(v.location)+(v.incidentPurok?` (${v.incidentPurok})`:'');
  if(!text(v.location,3,250)||location.length>250)e.location='Enter a clear location; location and Purok must fit within 250 characters.';
  if(!v.incidentDateSelected)e.incidentDate='Please select the incident date.';
  if(!v.incidentTimeSelected)e.incidentTime='Please select the incident time.';
  const date=v.incidentDateTime instanceof Date?v.incidentDateTime:new Date(v.incidentDateTime);
  if(!Number.isFinite(date.getTime()))e.incidentDate='Please select a valid incident date.';
  else if(date.getTime()>Date.now()+5*60000)e.incidentTime='Incident date and time cannot be in the future.';
  if(!text(v.description,10,500))e.description='Describe what happened using 10–500 meaningful characters.';
  if(clean(v.reportedRespondentName)&&!text(v.reportedRespondentName,2,120))e.reportedRespondentName='Enter the person’s name (2–120 characters), or leave it blank if unknown.';
  if(v.evidenceBase64&&(!/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/]+=*$/i.test(v.evidenceBase64)||v.evidenceBase64.length>8*1024*1024))e.evidence='Choose a JPEG, PNG, or WebP image smaller than 6 MB.';
  return e;
}
