import { detectLanguage, stripLanguageDirective } from './chatbotLanguage.js';
import { getOfficialsReply, isOfficialsQuestion } from './chatbotOfficials.js';

const ANNOUNCEMENTS_PATTERN = /\b(announcements?|anunsyo|balita|latest\s+(?:news|update)|barangay\s+updates?)\b/i;
const ANNOUNCEMENT_LOCATION_PATTERN = /\bwhere\s+(?:(?:can|do)\s+i\s+)?(?:find|see)\b|\bwhere\s+are\s+(?:the\s+)?(?:barangay\s+)?announcements\b|\b(?:saan|nasaan)\b/i;
const LIVE_DATA_EXCLUSION_PATTERN = /\b(911|emergency|sunog|fire|ambulance|aksidente|hirap\s*huminga|cannot\s*breathe|abuse|violence|threat|banta|sakit|fever|lagnat|medical|legal|abogado|lawyer|password|otp|verification\s*code|account\s*(?:status|problem)|personal\s*(?:record|data))\b/i;
const ANNOUNCEMENT_CATEGORY_LABELS = {
  general: 'General',
  health: 'Health & Wellness',
  safety: 'Public Safety',
  environment: 'Environment',
  services: 'Public Services',
  urgent: 'Emergency Alert',
};

const cleanText = (value, maxLength = 160) => (
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : ''
);
const isTagalog = (message) => detectLanguage(message) === 'tagalog';
const compactList = (items) => items.filter(Boolean).slice(0, 3).join('; ');
const announcementTitle = (value) => {
  const title = cleanText(value, 5_000);
  if (title.length <= 78) return title;
  const excerpt = title.slice(0, 78);
  const lastSpace = excerpt.lastIndexOf(' ');
  return `${excerpt.slice(0, lastSpace > 48 ? lastSpace : 78).trimEnd()}…`;
};
const announcementCategory = (value) => {
  const category = cleanText(value, 50);
  if (!category) return 'General';
  return ANNOUNCEMENT_CATEGORY_LABELS[category.toLowerCase()]
    || `${category.charAt(0).toUpperCase()}${category.slice(1)}`;
};

const announcementsReply = (announcements, tagalog) => {
  const listed = compactList(announcements.map(({ title, category, isUrgent }) => {
    const cleanTitle = announcementTitle(title);
    if (!cleanTitle) return '';
    const categoryLabel = announcementCategory(category);
    return isUrgent
      ? `${cleanTitle} (${categoryLabel}; priority alert)`
      : `${cleanTitle} (${categoryLabel})`;
  }));
  if (!listed) return tagalog
    ? 'Wala pang aktibong anunsyo na naka-publish sa BrgyLink. Tingnan muli ang News mamaya o makipag-ugnayan sa opisina ng barangay.'
    : 'There are no active announcements published in BrgyLink yet. Please check the News tab again later or contact the barangay office.';
  return tagalog
    ? `Narito ang pinakabagong aktibong anunsyo sa BrgyLink: ${listed}. Piliin ang News tab, o sa Home piliin ang Barangay Bulletins > See all, para mabasa ang buong detalye.`
    : `Here are the latest active announcements in BrgyLink: ${listed}. Open the News tab, or on Home choose Barangay Bulletins > See all, to read the full details.`;
};

const announcementLocationReply = (tagalog) => (tagalog
  ? 'Makikita ang mga anunsyo sa News tab. Maaari ring pumunta sa Home at piliin ang Barangay Bulletins > See all.'
  : 'You can find barangay announcements in the News tab. You can also go to Home and choose Barangay Bulletins > See all.');

export const getLiveChatReply = async (message, { findOfficials, findAnnouncements }) => {
  if (typeof message !== 'string') return null;
  const tagalog = isTagalog(message);
  const question = stripLanguageDirective(message);
  if (isOfficialsQuestion(question)) {
    // A committee name is a directory fact, not medical/legal advice.
    if (LIVE_DATA_EXCLUSION_PATTERN.test(question.replace(/\b(?:medical|legal|abogado|lawyer)\b/gi, ''))) return null;
    return getOfficialsReply(message, await findOfficials());
  }
  if (LIVE_DATA_EXCLUSION_PATTERN.test(message)) return null;
  if (ANNOUNCEMENTS_PATTERN.test(question)) {
    if (ANNOUNCEMENT_LOCATION_PATTERN.test(question)) return announcementLocationReply(tagalog);
    return announcementsReply(await findAnnouncements(), tagalog);
  }
  return null;
};
