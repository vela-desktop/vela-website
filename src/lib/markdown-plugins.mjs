// Sätteri hast plugins for journal entries (Markdown and MDX).
//
// headingAnchors: gives h2–h4 a stable id and appends a self-link.
//
// User plugins run before Astro's own heading-id pass, so this assigns the id
// itself (same slugger as Astro) and Astro keeps it. The link has no text
// content — the "#" is drawn by CSS — so heading text and slugs stay clean.
import GithubSlugger from 'github-slugger';

/** @type {import('satteri').HastPluginEntry} */
export const headingAnchors = () => {
  const slugger = new GithubSlugger();
  return {
    name: 'vela-heading-anchors',
    element: {
      filter: ['h2', 'h3', 'h4'],
      visit(node, ctx) {
        // Headings only screen readers see (e.g. the footnotes label) get no link.
        const classes = node.properties?.className;
        if (Array.isArray(classes) && classes.includes('sr-only')) return;
        const text = ctx.textContent(node).trim();
        const existing = node.properties?.id;
        const id = typeof existing === 'string' ? existing : slugger.slug(text);
        if (typeof existing !== 'string') ctx.setProperty(node, 'id', id);
        ctx.appendChild(node, {
          type: 'element',
          tagName: 'a',
          properties: {
            href: `#${id}`,
            className: ['heading-anchor'],
            ariaLabel: `Link to section: ${text}`,
          },
          children: [],
        });
      },
    },
  };
};

// Wraps tables in a focusable scroll container, so wide tables scroll on
// small screens without losing table semantics.
/** @type {import('satteri').HastPluginEntry} */
export const tableWrap = {
  name: 'vela-table-wrap',
  element: {
    filter: ['table'],
    visit(node, ctx) {
      ctx.wrapNode(node, {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-wrap'], tabIndex: 0 },
        children: [],
      });
    },
  },
};
