// Colour words in notes. Each word names one of the two chart colours:
// --accent (terracotta) or --accent-2 (sage). "teal" and "rust" are the
// names from the old palette, kept so older text still colours correctly.
export const HUE_WORDS: Record<string, 'accent' | 'accent-2'> = {
  terracotta: 'accent',
  teal: 'accent',
  sage: 'accent-2',
  rust: 'accent-2',
};

/** CSS class for a colour word (or text starting with one); accent by default. */
export function hueClass(text: string): 'accent' | 'accent-2' {
  const first = text.trim().toLowerCase().split(/\W/)[0];
  return HUE_WORDS[first] ?? 'accent';
}

/** Matches any colour word, for wrapping them in captions. */
export const HUE_RE = new RegExp(`\\b(${Object.keys(HUE_WORDS).join('|')})\\b`, 'gi');
