const REPLY_LANGUAGE = /\b(?:please\s+)?(?:answer|reply|respond|explain|speak|sagot|sumagot|pakisagot)\s+(?:(?:to\s+me|please)\s+)?(?:(?:in|sa|using)\s+)?(english|tagalog|filipino)(?:\s+(?:please|po))?/gi;
const TRAILING_LANGUAGE = /\b(?:(?:in|sa)\s+)?(english|tagalog|filipino)\s+(?:please|po)[.!?\s]*$/gi;

export const stripLanguageDirective = (message) => message
  .replace(REPLY_LANGUAGE, '')
  .replace(TRAILING_LANGUAGE, '')
  .trim();

export const detectLanguage = (message) => {
  // Explicit reply-language requests override the language of the question.
  const requested = [...message.matchAll(REPLY_LANGUAGE), ...message.matchAll(TRAILING_LANGUAGE)]
    .sort((a, b) => a.index - b.index).at(-1)?.[1];
  if (requested) return requested.toLowerCase() === 'english' ? 'english' : 'tagalog';
  if (/^\s*english\s*(?:please|po)?[.!?\s]*$/i.test(message)) return 'english';
  if (/\b(pangasinan|antoy|saray|diad|makatalos|nangan|onla|tua)\b/i.test(message)) return 'pangasinan';
  if (/\b(ilocano|ilokano|ania|dagiti|iti|wen|mabalin|agkiddaw|kasano|agyaman)\b/i.test(message)) return 'ilocano';
  if (/\b(tagalog|filipino|kumusta|kamusta|paano|pano|saan|nasaan|bakit|ano|anong|sino|salamat|ako|ko|siya|hindi|di|sunog|hirap|makahinga|ang|mga|may|wala|kailangan|po|opo|pwede|puwede|magkano|kailan|ilang|gaano|gusto|mag-file|maghain|ipalit|ibigay|ipakita)\b/i.test(message)) return 'tagalog';
  return 'english';
};
