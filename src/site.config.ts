// ---------------------------------------------------------------------------
// Single source of truth for your identity. Edit this file to update your
// name, role, or links anywhere on the site. (Pulled from your old Hugo site.)
// ---------------------------------------------------------------------------

export const site = {
  name: 'Daan van der Weijden',
  role: 'PhD Candidate',
  affiliation: {
    name: 'DDIS',
    url: 'https://ifi.uzh.ch/ddis',
  },
  university: 'University of Zurich',
  email: 'weijden@ifi.uzh.ch',
  location: 'Zurich, Switzerland',
  // Lives in /public; prefix with import.meta.env.BASE_URL wherever it's used.
  avatar: 'profile_pic.jpeg',

  // One short line that introduces you. Markdown-free, plain text for now.
  tagline: 'PhD Candidate at DDIS, University of Zurich.',

  socials: [
    { name: 'GitHub', url: 'https://github.com/daanvdweijden/' },
    { name: 'Google Scholar', url: 'https://scholar.google.com/citations?hl=nl&user=vHEl144AAAAJ' },
    { name: 'ORCID', url: 'https://orcid.org/0000-0002-8024-7219' },
    { name: 'Group Card', url: 'https://www.ifi.uzh.ch/en/ddis/people/weijden.html' },
    { name: 'Email', url: 'mailto:weijden@ifi.uzh.ch' },
  ],
} as const;

export type Site = typeof site;
