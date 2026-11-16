// Colour words in notes. Each word names one of the two chart colours,
// --accent or --accent-2. The palette swaps in the dark theme (orange ink
// on grey-blue becomes grey-blue on orange), so the colours have no single
// name: a colour word is written once in the text and shown as the name of
// the colour it has in the current theme ("orange" or "blue").
//
// The words in the source are only keys. Write them by role: "hue" is the
// main colour (--accent, the story), "hue2" the second (--accent-2, the
// contrast), so text keeps working whatever the palette becomes. "orange" and
// "blue" (the light theme's names) and "terracotta"/"teal", "sage"/"rust"
// (older palettes) still work.
export type Hue = 'accent' | 'accent-2';

export const HUE_WORDS: Record<string, Hue> = {
  hue: 'accent',
  hue2: 'accent-2',
  orange: 'accent',
  terracotta: 'accent',
  teal: 'accent',
  blue: 'accent-2',
  sage: 'accent-2',
  rust: 'accent-2',
};

/** What each colour is called in each theme. */
export const HUE_NAMES: Record<Hue, { light: string; dark: string }> = {
  accent: { light: 'orange', dark: 'blue' },
  'accent-2': { light: 'blue', dark: 'orange' },
};

/** CSS class for a colour word (or text starting with one); accent by default. */
export function hueClass(text: string): Hue {
  const first = text.trim().toLowerCase().split(/\W/)[0];
  return HUE_WORDS[first] ?? 'accent';
}

const cap = (s: string, like: string) => (/^[A-Z]/.test(like) ? s[0].toUpperCase() + s.slice(1) : s);

/** A colour word as HTML: in its colour, named for the current theme
 *  (both names are rendered; CSS in Layout.astro shows one). Keeps the
 *  capital of the word it replaces. */
export function hueHtml(word: string, c: Hue = hueClass(word)): string {
  const n = HUE_NAMES[c];
  return `<span class="hue ${c}"><span class="hue-l">${cap(n.light, word)}</span><span class="hue-d">${cap(n.dark, word)}</span></span>`;
}

/** Matches any colour word, for wrapping them in captions. */
export const HUE_RE = new RegExp(`\\b(${Object.keys(HUE_WORDS).join('|')})\\b`, 'gi');
