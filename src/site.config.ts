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

  // Third-person bio for machines: the homepage Person JSON-LD and /llms.txt.
  // Keep the name format identical to the one on your papers.
  bio:
    'Daan van der Weijden is a PhD candidate at the Dynamic and Distributed Information Systems Group (DDIS), University of Zurich, researching computational methods for deliberative democracy.',

  // Research themes, most current first. Feed the Person JSON-LD
  // (`knowsAbout`) and the themes list in /llms.txt.
  themes: [
    'Referendum leaflet summarisation',
    'Diversity-aware discussion summarisation',
    'Predicting moderation interventions in online deliberation',
    'Voting advice applications and conversational agents for political information',
    'LLM interpretability and reproducibility',
  ],

  socials: [
    { name: 'GitHub', url: 'https://github.com/daanvdweijden/' },
    { name: 'Google Scholar', url: 'https://scholar.google.com/citations?hl=nl&user=vHEl144AAAAJ' },
    { name: 'ORCID', url: 'https://orcid.org/0000-0002-8024-7219' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/d-j-van-der-weijden/' },
    { name: 'Group Card', url: 'https://www.ifi.uzh.ch/en/ddis/people/weijden.html' },
    { name: 'Email', url: 'mailto:weijden@ifi.uzh.ch' },
  ],
} as const;

export type Site = typeof site;
