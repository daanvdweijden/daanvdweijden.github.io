// ---------------------------------------------------------------------------
// Structured-data helpers shared by the homepage (Person) and paper pages
// (ScholarlyArticle author). One Person node, one `@id`, so search engines and
// LLMs tie every page and profile to the same entity.
// ---------------------------------------------------------------------------
import { site } from '../site.config';

// Profiles that identify the same person. Email is left out on purpose.
const PROFILE_LINKS = ['GitHub', 'Google Scholar', 'ORCID', 'LinkedIn', 'Group Card'];

export function personLd(siteUrl: URL) {
  const home = new URL(import.meta.env.BASE_URL, siteUrl).href;
  return {
    '@type': 'Person',
    '@id': `${home}#person`,
    name: site.name,
    url: home,
    image: new URL(site.avatar, home).href,
    jobTitle: site.role,
    description: site.bio,
    affiliation: {
      '@type': 'CollegeOrUniversity',
      name: site.university,
      department: { '@type': 'Organization', name: site.affiliation.name, url: site.affiliation.url },
    },
    knowsAbout: [...site.themes],
    sameAs: site.socials.filter((s) => PROFILE_LINKS.includes(s.name)).map((s) => s.url),
  };
}

/** JSON for a <script type="application/ld+json">, safe to inline in HTML. */
export const jsonLd = (data: object) => JSON.stringify(data).replace(/</g, '\\u003c');
