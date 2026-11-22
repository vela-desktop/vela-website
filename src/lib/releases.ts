// Release notes, from the Markdown written on GitHub to the HTML of the
// release pages (src/pages/releases/). The notes are Vela's own, but they
// come from outside the site's source, so they're treated as text: raw HTML
// is dropped, never passed through.
import { hastToHtml, markdownToHast } from 'satteri';
import { LINKS } from '../consts';

type Node = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: Node[] };

export interface Notes {
  /** The first paragraph, as plain text: the release in a sentence or two. */
  summary: string;
  /** Everything after it, as HTML. */
  html: string;
}

/**
 * Notes put a section's title on a line of its own ("Desktop and settings")
 * as often as they use a Markdown heading. A short paragraph of one line,
 * without closing punctuation and followed by more text, is read as a title.
 */
function promoteTitles(blocks: string[]): string[] {
  return blocks.map((block, i) => {
    const line = block.trim();
    const isTitle =
      i < blocks.length - 1 &&
      !line.includes('\n') &&
      line.length <= 60 &&
      // An indented block is code, whatever it says.
      !/^([#>*+-]|\d+[.)]|\s|https?:)/.test(block.replace(/^\n+/, '')) &&
      !/[.:;!?,)]$/.test(line);
    return isTitle ? `## ${line}` : block;
  });
}

/** "#123" in running text, as a link to the issue or pull request. */
function linkReferences(node: Node, inLink = false): void {
  if (!node.children) return;
  const skip = inLink || node.tagName === 'a' || node.tagName === 'code' || node.tagName === 'pre';
  node.children = node.children.flatMap((child): Node[] => {
    if (child.type !== 'text' || skip) {
      linkReferences(child, skip);
      return [child];
    }
    const parts = (child.value ?? '').split(/(?<![\w&/])#(\d+)\b/);
    if (parts.length === 1) return [child];
    return parts.flatMap((part, i): Node[] => {
      if (i % 2 === 0) return part ? [{ type: 'text', value: part }] : [];
      return [
        {
          type: 'element',
          tagName: 'a',
          properties: { href: `${LINKS.repo}/issues/${part}` },
          children: [{ type: 'text', value: `#${part}` }],
        },
      ];
    });
  });
}

/** Drops raw HTML, makes links absolute and headings start at h2. */
function clean(node: Node, tag: string): void {
  if (!node.children) return;
  node.children = node.children.filter((child) => child.type !== 'raw');
  for (const child of node.children) {
    if (child.type !== 'element') continue;
    if (child.tagName === 'h1') child.tagName = 'h2';
    if (child.tagName === 'img') child.properties = { ...child.properties, loading: 'lazy' };
    if (child.tagName === 'a') {
      const href = String(child.properties?.href ?? '');
      // Paths in the notes are relative to the repository at the release's tag.
      const absolute =
        /^(https?:|mailto:|#)/.test(href) || !href ? href : `${LINKS.repo}/blob/${tag}/${href.replace(/^\.?\//, '')}`;
      child.properties = { ...child.properties, href: absolute, rel: 'noopener' };
    }
    clean(child, tag);
  }
}

/** The notes of a release, split into a summary and the rest as HTML. */
export function renderNotes(markdown: string, tag: string): Notes {
  const blocks = markdown
    .replace(/\r\n?/g, '\n')
    .trim()
    .split(/\n{2,}/);
  // The opening paragraph says what the release is; the page shows it as its
  // introduction, so it's taken out of the body.
  const opening = blocks[0] && !/^([#>*+-]|\d+[.)]|\s)/.test(blocks[0]) ? blocks.shift()! : '';
  const summary = opening.replace(/\s+/g, ' ').replace(/[*_`]/g, '').trim();

  const tree = markdownToHast(promoteTitles(blocks).join('\n\n')) as unknown as Node;
  clean(tree, tag);
  linkReferences(tree);
  return { summary, html: hastToHtml(tree as never) };
}
