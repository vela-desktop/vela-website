// Structured data (schema.org, as JSON-LD) for search engines and other
// readers of the page. Pages pass these objects to <Base jsonLd={…}>.
import { AUTHOR, LINKS, SITE } from '../consts';
import { DEFAULT_LANG } from './i18n';
import { ogImageUrl, postUrl, type Entry } from './posts';

type Thing = Record<string, unknown>;

const absolute = (path: string) => new URL(path, SITE.url).href;

/** The project, which publishes the site and the journal. */
const vela: Thing = {
  '@type': 'Organization',
  name: SITE.name,
  url: absolute('/'),
  logo: absolute('/brand/vela-icon-512.png'),
  sameAs: [LINKS.repo],
};

/** The author of the journal. */
const author: Thing = {
  '@type': 'Person',
  name: AUTHOR.name,
  url: AUTHOR.url,
};

export function websiteSchema(): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: absolute('/'),
    description: SITE.description,
    inLanguage: 'en',
    publisher: vela,
  };
}

/** `version` is the latest alpha package, when the build could read it. */
export function softwareSchema(version?: string): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE.name,
    description: SITE.description,
    url: absolute('/'),
    applicationCategory: 'DesktopEnhancementApplication',
    operatingSystem: 'Linux',
    license: LINKS.license,
    downloadUrl: absolute(LINKS.install),
    softwareVersion: version,
    releaseNotes: absolute(LINKS.changes),
    screenshot: absolute('/og/vela.png'),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    author: vela,
  };
}

/**
 * A journal entry. `translations` are the same entry in the other languages it
 * exists in: the original, on a translation, and the translations, on the
 * original.
 */
export function articleSchema(post: Entry, image?: string, translations: Entry[] = []): Thing {
  const { title, description, pubDate, updatedDate, tags } = post.data;
  const lang = post.lang ?? DEFAULT_LANG;
  const url = absolute(postUrl(post));
  const reference = (other: Entry) => ({
    '@type': 'BlogPosting',
    url: absolute(postUrl(other)),
    inLanguage: other.lang ?? DEFAULT_LANG,
  });
  const original = translations.find((other) => (other.lang ?? DEFAULT_LANG) === DEFAULT_LANG);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    mainEntityOfPage: url,
    image: absolute(image ?? ogImageUrl(post)),
    datePublished: pubDate.toISOString(),
    dateModified: (updatedDate ?? pubDate).toISOString(),
    inLanguage: lang,
    translationOfWork: lang !== DEFAULT_LANG && original ? reference(original) : undefined,
    workTranslation: lang === DEFAULT_LANG && translations.length > 0 ? translations.map(reference) : undefined,
    keywords: tags.length > 0 ? tags.join(', ') : undefined,
    author,
    publisher: vela,
    isPartOf: { '@type': 'Blog', name: 'Vela Journal', url: absolute('/blog/') },
  };
}

/** The trail from the homepage to a page, as [name, path] pairs, the page last. */
export function breadcrumbSchema(trail: [name: string, path: string][]): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: absolute(path),
    })),
  };
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Plain text from a fragment of rendered HTML. */
function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|li|pre)>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, entity: string) => {
      if (entity[0] !== '#') return ENTITIES[entity.toLowerCase()] ?? match;
      const code = entity[1] === 'x' || entity[1] === 'X' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return String.fromCodePoint(code);
    })
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

/**
 * A FAQPage built from a rendered page where every question is an <h3> and
 * its answer is everything up to the next heading. <h2>s only group questions.
 */
export function faqSchema(html: string): Thing {
  const questions: Thing[] = [];
  const pattern = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h[23][\s>]|$)/g;
  for (const [, heading, answer] of html.matchAll(pattern)) {
    const name = htmlToText(heading);
    const text = htmlToText(answer);
    if (name && text) {
      questions.push({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } });
    }
  }
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: questions };
}
