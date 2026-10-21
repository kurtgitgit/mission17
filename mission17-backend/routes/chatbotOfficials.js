import { detectLanguage, stripLanguageDirective } from './chatbotLanguage.js';
import { compareOfficials } from '../utils/officialOrdering.js';

const normalize = text => String(text ?? '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const roles = [
  ['Punong Barangay', /\b(?:punong barangay|barangay captain|captain|kapitan)\b/],
  ['Barangay Kagawad', /\b(?:kagawads?|council(?:lor|or|man|woman|members?)?s?)\b/],
  ['SK Chairperson', /\b(?:sk|sangguniang kabataan)\b/],
  ['Barangay Secretary', /\b(?:secretary|sekretarya|sekretaryo|kalihim)\b/],
  ['Barangay Treasurer', /\b(?:treasurer|tesorero|tesorera|ingat yaman)\b/],
  ['Chief Tanod', /\b(?:chief tanod|tanod)\b/],
  ['BHW President', /\b(?:bhw|barangay health worker)\b/],
];
const stopWords = new Set(('who what which where how is are was the a an of our your their his her its in on at and or to for from me please po opo ang mga si sina ni nina kay ng nang sa sino ano anong alin aling nasa kasalukuyan barangay brgy bagong pag asa san jacinto pangasinan officials official opisyal opisyales council councilor councillor councilmembers members member punong captain kapitan kagawad kagawads sk sangguniang kabataan chair chairman chairperson secretary sekretarya sekretaryo kalihim treasurer tesorero tesorera ingat yaman chief tanod bhw president health worker committee komite namumuno namamahala handles handle heads head leads lead contact phone mobile telephone number numbers numero email address details detail information impormasyon pangalan name names list roster all current active currently new latest published tell about give show get find need can could may i we do does mga buong hon honorable mr ms mrs sir maam term tungkulin role position contactable').split(' '));
const conversationalWords = new Set('you us they them know serving as with yung natin namin ninyo nyo sila siya iyon ito iyong ba kanyang elected paki pwedeng'.split(' '));
const personWords = (question, committee = false) => normalize(question).split(' ').filter(word => word.length > 1
  && (!stopWords.has(word) || committee && ['health', 'worker'].includes(word)) && !conversationalWords.has(word));
const ambiguousBarangay = question => /^(?:who is (?:the )?barangay|sino (?:po )?(?:ang )?barangay)(?: po)?$/.test(normalize(question));

export const isOfficialsQuestion = message => {
  const question = stripLanguageDirective(message);
  const normalized = normalize(question);
  return roles.some(([, pattern]) => pattern.test(normalized))
    || /\b(?:officials?|opisyal|opisyales|committee|komite)\b/.test(normalized)
    || ambiguousBarangay(question)
    || /\b(?:phone|contact|number|numero|email)\b.{0,35}\b(?:of|ni|kay|ng)\s+\p{L}/iu.test(question)
    || /\bwho is (?:hon\.? )?\p{Lu}[\p{L}.]+\s+\p{Lu}[\p{L}.]+|\bsino (?:po )?si\s+\p{L}/iu.test(question);
};

export const officialsUnavailableReply = message => detectLanguage(message) === 'tagalog'
  ? "Pasensya na po, hindi ko makuha ang kasalukuyang directory ng mga opisyal ngayon. Subukan muli o tingnan ang 'Officials' directory at makipag-ugnayan sa barangay office."
  : "Sorry, I cannot retrieve the current officials directory right now. Please try again or check the 'Officials' directory and contact the barangay office.";

export const getOfficialsReply = (message, officials, language = detectLanguage(message)) => {
  const tagalog = language === 'tagalog';
  const question = stripLanguageDirective(message);
  const clarify = tagalog
    ? 'Pakilinaw po kung aling opisyal o posisyon ang tinutukoy mo. Maaari mong ibigay ang buong pangalan o posisyon sa barangay.'
    : 'Which official or position do you mean? Please give the full name or barangay position so I can identify the right person.';
  if (ambiguousBarangay(question)) return clarify;
  const roster = officials.filter(row => row.isArchived !== true && row.name && row.position).sort(compareOfficials);
  if (!roster.length) return tagalog
    ? "Wala pang kasalukuyang roster ng mga opisyal na naka-publish sa BrgyLink. Tingnan ang 'Officials' directory o makipag-ugnayan sa opisina ng barangay para sa kumpirmadong listahan."
    : "There is no current active officials roster published in BrgyLink yet. Please check the 'Officials' directory or contact the barangay office for the confirmed list.";
  const requestedRoles = roles.filter(([, pattern]) => pattern.test(normalize(question))).map(([position]) => position);
  const committeeQuestion = /\b(?:committee|komite)\b/i.test(question);
  const words = personWords(question, committeeQuestion);
  let selected = requestedRoles.length ? roster.filter(row => requestedRoles.includes(row.position)) : roster;
  if (words.length) selected = selected.filter(row => {
    const name = normalize(row.name).split(' ');
    const committee = normalize(row.committee).split(' ');
    return (!committeeQuestion && words.every(word => name.includes(word))) || words.every(word => committee.includes(word));
  });
  if (!selected.length) return tagalog
    ? "Pasensya na po, wala akong makitang tugmang opisyal sa kasalukuyang directory. Pakikumpirma ang pangalan o posisyon sa 'Officials' directory o sa barangay office."
    : "Sorry, I could not find a matching official in the current directory. Please confirm the name or position in the 'Officials' directory or with the barangay office.";
  if (words.length && selected.length > 1 && !/\b(?:committee|komite)\b/i.test(question)) return clarify;
  const wantsContact = /\b(?:contacts?|phone|mobile|telephone|numbers?|numero|email|details|detalye|impormasyon)\b/i.test(question);
  const details = selected.map(row => {
    let text = `${row.name} — ${row.position}`;
    if (selected.length === 1 || /\b(?:committee|komite|details|detalye)\b/i.test(question)) {
      if (row.committee) text += `\n${tagalog ? 'Komite' : 'Committee'}: ${row.committee}`;
      if (row.term) text += `\n${tagalog ? 'Panunungkulan' : 'Term'}: ${row.term}`;
      if (row.termNumber) text += `\n${tagalog ? 'Bilang ng termino' : 'Term number'}: ${row.termNumber}`;
    }
    if (selected.length === 1 || wantsContact) {
      const phone = typeof row.contact === 'string' && /^09\d{9}$/.test(row.contact) ? row.contact : null;
      if (phone) text += `\n${tagalog ? 'Numero' : 'Contact'}: ${phone}`;
      else if (wantsContact) text += tagalog ? '\nWalang naka-publish na contact number para sa opisyal na ito.' : '\nContact number is not available for this official.';
      if (row.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) text += `\nEmail: ${row.email}`;
    }
    return text;
  }).join('\n\n');
  return `${tagalog ? 'Narito ang naka-publish na impormasyon ng mga kasalukuyang opisyal:' : 'Here is the published information for the current officials:'}\n\n${details}`;
};
