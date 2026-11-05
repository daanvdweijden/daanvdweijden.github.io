// ---------------------------------------------------------------------------
// Helpers for the `notes` content collection (src/content/notes/<slug>/).
// ---------------------------------------------------------------------------
import { getCollection, type CollectionEntry } from 'astro:content';

export type Note = CollectionEntry<'notes'>;

/**
 * Notes, newest first. Drafts are included while running `npm run dev` so you
 * can see them on the real page as you write, and left out of every build.
 */
export async function getNotes(): Promise<Note[]> {
  const items = await getCollection('notes', ({ data }) => import.meta.env.DEV || !data.draft);
  return items.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** True once at least one note is published (used to show "Notes" in the nav). */
export async function hasPublishedNotes(): Promise<boolean> {
  return (await getCollection('notes', ({ data }) => !data.draft)).length > 0;
}

export const noteHref = (n: Note) => `${import.meta.env.BASE_URL}notes/${n.id}/`;
