// RSS feed for the notes: /notes/rss.xml. Title + dek per item, linking to
// the note itself (the charts and scrollies only work on the page, so the
// feed doesn't try to carry the full text). Drafts and unlisted notes are
// always left out, also in `npm run dev`.
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../../site.config';

export async function GET(context: APIContext) {
  const notes = (await getCollection('notes', ({ data }) => !data.draft && !data.unlisted))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const base = import.meta.env.BASE_URL;
  return rss({
    title: `Notes · ${site.name}`,
    description: 'Small hyperfixations, written up with data and charts.',
    site: new URL(base, context.site!).href,
    items: notes.map((n) => ({
      title: n.data.title,
      description: n.data.dek,
      pubDate: n.data.date,
      link: `${base}notes/${n.id}/`,
      categories: n.data.tags,
    })),
    customData: '<language>en</language>',
    // Makes the feed readable when opened in a browser (public/rss.xsl).
    stylesheet: `${base}rss.xsl`,
  });
}
