// The journal's search index, written by Pagefind into dist/pagefind/ once the
// site is built. Only journal entries are indexed (Article.astro marks them
// with data-pagefind-body), and Pagefind keeps one index per language, from
// each page's <html lang>; JournalSearch.astro loads the one for its page.
import { fileURLToPath } from 'node:url';

/** @returns {import('astro').AstroIntegration} */
export function pagefind() {
  return {
    name: 'vela:pagefind',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const { createIndex, close } = await import('pagefind');
        try {
          const { index, errors } = await createIndex({});
          if (!index) throw new Error(errors.join('\n'));
          const added = await index.addDirectory({ path: fileURLToPath(dir) });
          if (added.errors.length > 0) throw new Error(added.errors.join('\n'));
          const written = await index.writeFiles({ outputPath: fileURLToPath(new URL('pagefind/', dir)) });
          if (written.errors.length > 0) throw new Error(written.errors.join('\n'));
          logger.info(`Indexed ${added.page_count} journal pages.`);
        } finally {
          await close();
        }
      },
    },
  };
}
