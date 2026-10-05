/**
 * French Bad Words Filter
 * Replaces foul language with asterisks (e.g. "merde" -> "m***e")
 * Only affects French bad words.
 */

export const DEFAULT_FRENCH_BAD_WORDS: string[] = [
  'merde',
  'putain',
  'connard',
  'connasse',
  'salope',
  'salaud',
  'batard',
  'bâtard',
  'encule',
  'enculé',
  'enculée',
  'fdp',
  'nique',
  'niquer',
  'pute',
  'chier',
  'bordel',
  'ta gueule',
  'gueule',
  'bite',
  'couille',
  'couilles',
  'cul'
];

/**
 * Creates an asterisk-masked representation of a word
 * e.g. "merde" -> "m***e", "fdp" -> "f*p", "cul" -> "c*l"
 */
function createMaskedWord(word: string): string {
  if (word.length <= 2) {
    return '*'.repeat(word.length);
  }
  const first = word[0];
  const last = word[word.length - 1];
  const stars = '*'.repeat(word.length - 2);
  return `${first}${stars}${last}`;
}

/**
 * Filters and masks French bad words in text
 */
export function filterFrenchBadWords(text: string, customList?: string[]): string {
  if (!text) return '';
  const badWords = (customList && customList.length > 0) ? customList : DEFAULT_FRENCH_BAD_WORDS;

  let result = text;

  for (const word of badWords) {
    const trimmed = word.trim();
    if (!trimmed) continue;

    // Escape regex special chars
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Match word boundaries (or string start/end, allowing punctuation)
    const regex = new RegExp(`(^|[^a-zA-ZÀ-ÿ0-9])(${escaped})([^a-zA-ZÀ-ÿ0-9]|$)`, 'gi');

    result = result.replace(regex, (match, prefix, capturedWord, suffix) => {
      return prefix + createMaskedWord(capturedWord) + suffix;
    });
  }

  return result;
}
