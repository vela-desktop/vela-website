// When pages last changed, for <lastmod> in the sitemap (astro.config.mjs).
// The config can't use astro:content, so this reads the front matter of the
// journal entries and the Markdown pages directly: pubDate and updatedDate of
// each entry, which also date the journal, its topic pages and the homepage
// (it lists the latest entries), and `updated` of the pages in src/pages/.
// Pages without a date get no <lastmod>, rather than a guessed one.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { slug } from 'github-slugger';

const BLOG = 'src/content/blog';
const PAGES = 'src/pages';

/** The front matter fields of a Markdown file, as strings or lists of strings. */
function frontmatter(file) {
  const block = readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  const unquote = (value) => value.trim().replace(/^(["'])(.*)\1$/, '$2');
  const fields = {};
  let list;
  for (const line of block.split(/\r?\n/)) {
    const item = line.match(/^\s+-\s+(.+)$/);
    if (item && list) {
      list.push(unquote(item[1]));
      continue;
    }
    const field = line.match(/^(\w+):\s*(.*)$/);
    if (!field) continue;
    const [, name, value] = field;
    if (value === '') fields[name] = list = [];
    else if (value.startsWith('[')) fields[name] = value.slice(1, value.lastIndexOf(']')).split(',').map(unquote).filter(Boolean);
    else fields[name] = unquote(value);
  }
  return fields;
}

/** Last-modified dates by path, e.g. "/blog/frame-clock/" → Date. */
export function lastModified() {
  const dates = new Map();
  const set = (path, date) => {
    if (!dates.has(path) || date > dates.get(path)) dates.set(path, date);
  };

  const entries = readdirSync(BLOG, { recursive: true })
    .filter((file) => /\.mdx?$/.test(file) && !/(^|\/)_/.test(file))
    .map((file) => ({ id: file.replace(/(\/index)?\.mdx?$/, ''), data: frontmatter(join(BLOG, file)) }))
    .filter(({ data }) => data.draft !== 'true' && data.pubDate);

  for (const { id, data } of entries) {
    const date = new Date(data.updatedDate ?? data.pubDate);
    set(`/blog/${id.split('/').map((part) => slug(part)).join('/')}/`, date);
    set('/blog/', date);
    set('/', date);
    for (const tag of Array.isArray(data.tags) ? data.tags : []) set(`/blog/topics/${slug(tag)}/`, date);
  }

  for (const file of readdirSync(PAGES).filter((file) => /\.mdx?$/.test(file))) {
    const { updated } = frontmatter(join(PAGES, file));
    if (updated) set(`/${file.replace(/\.mdx?$/, '')}/`, new Date(updated));
  }

  for (const [path, date] of dates) if (Number.isNaN(date.valueOf())) dates.delete(path);
  return dates;
}
