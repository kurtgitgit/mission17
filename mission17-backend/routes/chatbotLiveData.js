const OFFICIALS_PATTERN = /\b(kapitan|captain|punong\s*barangay|kagawad|opisyal|officials?|council(?:lor|man|woman|member)?s?|tanod|sk\s*chairman)\b/i;
const ANNOUNCEMENTS_PATTERN = /\b(announcements?|anunsyo|balita|latest\s+(?:news|update)|barangay\s+updates?)\b/i;
const TAGALOG_PATTERN = /\b(ano|anong|paano|saan|sino|mga|ang|ng|sa|po|opo|may|wala|kailangan|pwede|puwede|aktibidad|anunsyo)\b/i;
const LIVE_DATA_EXCLUSION_PATTERN = /\b(911|emergency|sunog|fire|ambulance|aksidente|hirap\s*huminga|cannot\s*breathe|abuse|violence|threat|banta|sakit|fever|lagnat|medical|legal|abogado|lawyer|password|otp|verification\s*code|account\s*(?:status|problem)|personal\s*(?:record|data))\b/i;

const cleanText = (value, maxLength = 160) => (
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, maxLength) : ''
);
const isTagalog = (message) => TAGALOG_PATTERN.test(message);
const compactList = (items) => items.filter(Boolean).slice(0, 3).join('; ');

const officialsReply = (officials, tagalog) => {
  const roster = compactList(officials.map(({ name, position }) => {
    const cleanName = cleanText(name, 120);
    const cleanPosition = cleanText(position, 120);
    return cleanName && cleanPosition ? `${cleanName} — ${cleanPosition}` : '';
  }));
  if (!roster) return tagalog
    ? 'Wala pang kasalukuyang roster ng mga opisyal na naka-publish sa BrgyLink. Tingnan ang Announcements o makipag-ugnayan sa opisina ng barangay para sa kumpirmadong listahan.'
    : 'There is no current officials roster published in BrgyLink yet. Check Announcements or contact the barangay office for the confirmed list.';
  return tagalog
    ? `Narito ang kasalukuyang listahan ng mga opisyal na naka-publish sa BrgyLink: ${roster}. Para sa anumang pagbabago, tingnan ang Announcements o kumpirmahin sa opisina ng barangay.`
    : `Here is the current officials roster published in BrgyLink: ${roster}. For any changes, check Announcements or confirm with the barangay office.`;
};

const announcementsReply = (announcements, tagalog) => {
  const listed = compactList(announcements.map(({ title, category, isUrgent }) => {
    const cleanTitle = cleanText(title, 150);
    const cleanCategory = cleanText(category, 50);
    if (!cleanTitle) return '';
    const labels = [isUrgent ? 'URGENT' : '', cleanCategory].filter(Boolean);
    return labels.length ? `${cleanTitle} (${labels.join(', ')})` : cleanTitle;
  }));
  if (!listed) return tagalog
    ? 'Wala pang aktibong anunsyo na naka-publish sa BrgyLink. Maaari mong tingnan muli ang Announcements mamaya o makipag-ugnayan sa opisina ng barangay.'
    : 'There are no active announcements published in BrgyLink yet. Please check Announcements again later or contact the barangay office.';
  return tagalog
    ? `Narito ang pinakabagong aktibong anunsyo sa BrgyLink: ${listed}. Buksan ang Announcements para sa buong detalye.`
    : `Here are the latest active announcements in BrgyLink: ${listed}. Open Announcements for the full details.`;
};

export const getLiveChatReply = async (message, { findOfficials, findAnnouncements }) => {
  if (typeof message !== 'string' || LIVE_DATA_EXCLUSION_PATTERN.test(message)) return null;
  const tagalog = isTagalog(message);
  if (OFFICIALS_PATTERN.test(message)) return officialsReply(await findOfficials(), tagalog);
  if (ANNOUNCEMENTS_PATTERN.test(message)) return announcementsReply(await findAnnouncements(), tagalog);
  return null;
};
