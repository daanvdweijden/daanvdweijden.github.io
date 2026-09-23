// /llms.txt — a plain Markdown overview of who I am and what I've published,
// for LLM-based tools (https://llmstxt.org). Generated at build time from
// site.config.ts and the publications collection, so it never goes stale.
import type { APIRoute } from 'astro';
import { site } from '../site.config';
import { getPublications, yearOf, plainAbstract } from '../lib/pubs';

export const GET: APIRoute = async ({ site: siteUrl }) => {
  const abs = (path: string) => new URL(path, siteUrl).href;
  const pubs = await getPublications();

  // One line per paper: plain-language summary if written, else the abstract's
  // first sentence.
  const oneLiner = (p: (typeof pubs)[number]) =>
    p.data.summary ?? plainAbstract(p).match(/^.*?[.!?](?=\s|$)/)?.[0] ?? '';

  const profiles = site.socials
    .filter((s) => s.name !== 'Email')
    .map((s) => `- [${s.name}](${s.url})`);

  const body = [
    `# ${site.name}`,
    '',
    `> ${site.bio}`,
    '',
    `${site.role}, ${site.affiliation.name}, ${site.university} (${site.location}). Contact: ${site.email}`,
    '',
    '## Research themes',
    '',
    ...site.themes.map((t) => `- ${t}`),
    '',
    '## Publications',
    '',
    ...pubs.map(
      (p) =>
        `- [${p.data.title}](${abs(`pubs/${p.id}/`)}) (${p.data.venueShort ?? p.data.venue}, ${yearOf(p)}): ${oneLiner(p)}`,
    ),
    '',
    '## Profiles',
    '',
    `- [CV](${abs('cv/')})`,
    ...profiles,
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
