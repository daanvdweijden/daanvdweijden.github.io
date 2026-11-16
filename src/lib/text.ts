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

/**
 * Reading time in minutes for an MDX note body: the prose plus the figure
 * titles and captions (props, so they would be lost with the tags), at
 * ~220 words a minute. At least 1.
 */
export const readMinutes = (mdx: string) => {
  const props = [...mdx.matchAll(/\b(?:title|subtitle|caption)="([^"]*)"/g)].map((m) => m[1]).join(' ');
  const prose = plainText(mdx.replace(/^import .*$/gm, '').replace(/<[^>]+>/g, ' '));
  const words = `${prose} ${props}`.split(/\s+/).filter((w) => /\w/.test(w)).length;
  return Math.max(1, Math.round(words / 220));
};
