import type { APIContext } from 'astro';
import { journalFeed } from '../lib/feed';
import { DEFAULT_LANG } from '../lib/i18n';

export function GET(context: APIContext) {
  return journalFeed(DEFAULT_LANG, context.site);
}
