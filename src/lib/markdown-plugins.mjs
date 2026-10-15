// Sätteri hast plugins for journal entries (Markdown and MDX).
//
// math: renders $…$ and $$…$$ to MathML with KaTeX.
//
// headingAnchors: gives h2–h4 a stable id and appends a self-link.
//
// User plugins run before Astro's own heading-id pass, so this assigns the id
// itself (same slugger as Astro) and Astro keeps it. The link has no text
// content — the "#" is drawn by CSS — so heading text and slugs stay clean.
import GithubSlugger from 'github-slugger';
import katex from 'katex';
import { htmlToHast } from 'satteri';

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

// Renders TeX math ($…$ inline, $$…$$ on its own lines) to MathML at build
// time with KaTeX. Browsers lay MathML out natively, so pages need no KaTeX
// stylesheet, fonts or script. Invalid TeX fails the build.
/** @type {import('satteri').HastPluginEntry} */
export const math = {
  name: 'vela-math',
  element: {
    filter: ['code', 'pre'],
    visit(node, ctx) {
      const classes = node.properties?.className;
      if (!Array.isArray(classes)) {
        const code = node.tagName === 'pre' && node.children.length === 1 ? node.children[0] : undefined;
        if (code?.type !== 'element' || !code.properties?.className?.includes('math-display')) return;
        ctx.replaceNode(node, render(ctx.textContent(code), true));
      } else if (node.tagName === 'code' && classes.includes('math-inline')) {
        ctx.replaceNode(node, render(ctx.textContent(node), false));
      }
    },
  },
};

function render(tex, displayMode) {
  const html = katex.renderToString(tex, { displayMode, output: 'mathml', throwOnError: true });
  // KaTeX wraps <math> in a <span class="katex"> that only its stylesheet
  // uses. The parser keys the namespace as `:xmlns`, which would reach the
  // page; HTML puts <math> in the MathML namespace by itself. The TeX source
  // in <semantics><annotation> would end up in heading ids, anchor labels and
  // the text of the page, so only the rendered row is kept.
  const [wrapper] = htmlToHast(html, { fragment: true }).children;
  const element = wrapper.children[0];
  const [semantics] = element.children;
  delete element.properties[':xmlns'];
  element.children = [semantics.children[0]];
  return element;
}
