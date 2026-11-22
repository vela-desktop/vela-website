// The journal's feed in another language: /it/rss.xml, the translated entries.
import type { APIContext } from 'astro';
import { journalFeed } from '../../lib/feed';
import { getTranslations } from '../../lib/posts';
import type { Lang } from '../../lib/i18n';

export async function getStaticPaths() {
  const langs = [...new Set((await getTranslations()).map((post) => post.lang))];
  return langs.map((lang) => ({ params: { lang } }));
}

export function GET(context: APIContext) {
  return journalFeed(context.params.lang as Lang, context.site);
}
