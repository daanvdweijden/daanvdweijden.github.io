/**
 * Markdown body as plain text, for meta descriptions, JSON-LD and llms.txt.
 * Strips the Markdown these bodies actually use: links, emphasis, inline
 * code; collapses whitespace.
 */
export const plainText = (md: string) =>
  md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Search snippet: clipped at a word boundary to fit the ~160-char limit. */
export const clip = (t: string, n = 160) =>
  t.length <= n ? t : t.slice(0, t.lastIndexOf(' ', n - 1)).replace(/[,.;:]$/, '') + '…';
