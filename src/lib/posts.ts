import { getCollection, type CollectionEntry } from 'astro:content';
import { slug } from 'github-slugger';
import { DEFAULT_LANG, LOCALES, isLang, type Lang } from './i18n';

export type Post = CollectionEntry<'blog'>;

/**
 * A journal entry in another language: the translation's text and front
 * matter over its original's, which gives it its tags and cover. `id` is the
 * original's.
 */
export interface TranslatedPost {
  id: string;
  lang: Lang;
  body?: string;
  data: Post['data'];
  original: Post;
  /** The translation itself, for render(). */
  entry: CollectionEntry<'translations'>;
}

/** An entry in any language, for what reads only its id, text and front matter. */
export type Entry = Pick<Post, 'id' | 'body' | 'data'> & { lang?: Lang };

/**
 * Journal entries, newest first.
 *
 * Drafts are only included by the dev server, so they can be previewed
 * locally; production builds never generate pages, feeds or sitemap entries
 * for them.
 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * Translated journal entries, newest first, in production only those whose
 * original is published too. A published translation of an entry that doesn't
 * exist, or one in a language src/lib/i18n.ts doesn't list, fails the build; a
 * draft can wait for its original.
 */
export async function getTranslations(lang?: Lang): Promise<TranslatedPost[]> {
  const show = (draft: boolean) => import.meta.env.DEV || !draft;
  const originals = new Map((await getCollection('blog')).map((post) => [post.id, post]));
  const translations: TranslatedPost[] = [];
  for (const entry of await getCollection('translations')) {
    const [entryLang, ...rest] = entry.id.split('/');
    const id = rest.join('/');
    const original = originals.get(id);
    if (!isLang(entryLang) || entryLang === DEFAULT_LANG) {
      throw new Error(`${entry.filePath}: "${entryLang}" is not a translation language (src/lib/i18n.ts).`);
    }
    if (!original) {
      // A draft can be written before its original; a published one can't.
      if (entry.data.draft) continue;
      throw new Error(`${entry.filePath}: there is no journal entry "${id}" in src/content/blog/.`);
    }
    if (!show(entry.data.draft) || !show(original.data.draft) || (lang && entryLang !== lang)) continue;
    translations.push({
      id,
      lang: entryLang,
      body: entry.body,
      data: {
        ...original.data,
        ...entry.data,
        draft: entry.data.draft || original.data.draft,
        coverAlt: entry.data.coverAlt ?? original.data.coverAlt,
      },
      original,
      entry,
    });
  }
  return translations.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** /blog/<id>/ for originals, /<lang>/blog/<id>/ for translations. */
export function postUrl(post: { id: string; lang?: Lang }): string {
  const lang = post.lang ?? DEFAULT_LANG;
  return lang === DEFAULT_LANG ? `/blog/${post.id}/` : `/${lang}/blog/${post.id}/`;
}

/** The page listing every entry with a tag: "Renderer" → /blog/topics/renderer/. */
export function topicUrl(tag: string): string {
  return `/blog/topics/${slug(tag)}/`;
}

/** The generated social preview image of an entry (src/pages/og/blog/). */
export function ogImageUrl(post: { id: string; lang?: Lang }): string {
  const lang = post.lang ?? DEFAULT_LANG;
  return lang === DEFAULT_LANG ? `/og/blog/${post.id}.png` : `/og/blog/${lang}/${post.id}.png`;
}

const dateFormats = new Map(
  Object.entries(LOCALES).map(([lang, { dateLocale }]) => [
    lang,
    new Intl.DateTimeFormat(dateLocale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
  ]),
);

const shortDateFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(date: Date, lang: Lang = DEFAULT_LANG): string {
  return dateFormats.get(lang)!.format(date);
}

export function formatShortDate(date: Date): string {
  return shortDateFormat.format(date);
}

/** Minutes to read, from the raw Markdown body (~230 words per minute). */
export function readingTime(post: { body?: string }): number {
  const text = (post.body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`\[\]()!-]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

/**
 * A stable small number derived from a string. Used to vary the generated
 * covers of entries without images, so each one is composed differently but
 * never changes between builds.
 */
export function seed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
