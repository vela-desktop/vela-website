// Languages of the journal. The site is written in English; journal entries
// can also have translations (src/content/translations/<lang>/<entry>.mdx),
// published at /<lang>/blog/<entry>/ next to the original. The site's
// navigation, footer and other pages stay in English on those pages.

export const LANGS = ['en', 'it'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

export const LOCALES: Record<Lang, { name: string; ogLocale: string; dateLocale: string }> = {
  en: { name: 'English', ogLocale: 'en_US', dateLocale: 'en-GB' },
  it: { name: 'Italiano', ogLocale: 'it_IT', dateLocale: 'it-IT' },
};

/** The site path without its language prefix: "/it/blog/x/" → "/blog/x/". */
export function unprefixed(path: string): string {
  const [, first, ...rest] = path.split('/');
  return isLang(first) && first !== DEFAULT_LANG ? `/${rest.join('/')}` : path;
}

/**
 * The copy button on code blocks (src/scripts/enhance.ts). Kept apart from UI
 * so the page's script carries only these words.
 */
export const COPY: Record<Lang, { label: string; copy: string; copied: string; failed: string }> = {
  en: { label: 'Copy code to clipboard', copy: 'Copy', copied: 'Copied', failed: 'Couldn’t copy' },
  it: { label: 'Copia il codice negli appunti', copy: 'Copia', copied: 'Copiato', failed: 'Copia non riuscita' },
};

/** The journal's RSS feed in each language (src/lib/feed.ts). */
export const FEEDS: Record<Lang, { title: string; description: string }> = {
  en: {
    title: 'Vela Journal',
    description: 'Long-form notes from the development of Vela, a modern Linux desktop environment.',
  },
  it: {
    title: 'Vela Journal (italiano)',
    description: 'Note lunghe dallo sviluppo di Vela, un desktop environment Linux moderno, in italiano.',
  },
};

/**
 * Journal tags in other languages, where the English name doesn't work as is.
 * The URL of a topic is the English name's slug in every language.
 */
const TAGS: Partial<Record<Lang, Record<string, string>>> = {
  it: { 'Daily use': 'Uso quotidiano', Engineering: 'Sviluppo', Reference: 'Riferimento' },
};

export function tagName(tag: string, lang: Lang = DEFAULT_LANG): string {
  return TAGS[lang]?.[tag] ?? tag;
}

/** The words around a journal entry. */
export const UI = {
  en: {
    skipLink: 'Skip to content',
    journal: 'The Journal',
    topics: 'Topics',
    by: 'By',
    draft: 'Draft',
    minRead: (minutes: number) => `${minutes} min read`,
    updated: 'Updated',
    published: (date: string) => `Published ${date} in the Vela Journal.`,
    lastUpdated: (date: string) => `Last updated ${date}.`,
    // "Follow along by RSS. If you liked this entry, a star on GitHub helps others find Vela."
    follow: [
      'Follow along by ',
      'RSS',
      '. If you liked this entry, a ',
      'star on GitHub',
      ' helps others find Vela.',
    ],
    moreEntries: 'More entries',
    previous: 'Previous entry',
    next: 'Next entry',
    allEntries: 'All journal entries',
    /** Offers this entry in another language, in that language. */
    readIn: 'Read in English',
    /** On a translation, the language the entry was written in. */
    translatedFrom: { en: '', it: 'Translated from Italian.' } as Record<Lang, string>,
    /** The heading of the list of sections beside a long entry. */
    contents: 'In this entry',
    /** The self-link after each heading, for screen readers. */
    sectionLink: (heading: string) => `Link to section: ${heading}`,
    /** "Entry 05": the kicker on covers and the feature. */
    entry: 'Entry',
    latest: 'Latest',
    readEntry: 'Read the entry',
    entriesFrom: (year: string) => `Entries from ${year}`,
    entries: (count: number) => `${count} ${count === 1 ? 'entry' : 'entries'}`,
    /** The end of an entry: where to talk about it, and its link. */
    discuss: ['Questions, ideas or disagreements? ', 'Talk about it on Matrix', '.'],
    copyLink: 'Copy link',
    linkCopied: 'Link copied',
    copyFailed: 'Couldn’t copy',
    related: 'On the same topic',
    /** The journal index. */
    index: {
      title: 'Journal',
      rule: 'Development journal',
      heading: ['The ', 'Journal'],
      description:
        'The Vela development journal: long-form notes on building a Linux desktop — the compositor, the renderer, the shell, and the reasoning behind them.',
      intro:
        'Notes on building a desktop: the compositor and renderer, the shell, and the decisions behind them — written up at length, with the details left in.',
      noEntries: 'No entries yet',
      rss: 'Subscribe by RSS',
      source: 'Source on GitHub',
      lastEntry: 'Last entry',
      /** On a translated index, the entries that only exist in English. */
      untranslated: (_count: number) => '',
      untranslatedLink: '',
    },
    /** A topic page. */
    topic: {
      title: (tag: string) => `${tag} — Journal`,
      description: (count: string, tag: string) =>
        `${count} from the Vela development journal tagged “${tag}”: long-form notes on building a modern Linux desktop, newest first.`,
      rule: 'Topic',
      tagged: (count: string, tag: string) => `${count} tagged “${tag}”, newest first.`,
      all: 'All entries',
    },
    /** The journal's search, in the masthead of the index. */
    search: {
      label: 'Search the journal',
      placeholder: 'Search the journal',
      // Filled in by the page's script: {count} and {query}.
      one: '1 entry for “{query}”',
      many: '{count} entries for “{query}”',
      none: 'Nothing in the journal for “{query}”.',
      failed: 'Search isn’t available right now.',
    },
    /** The controls of a journal video's player, for screen readers. */
    player: {
      play: 'Play',
      pause: 'Pause',
      seek: 'Seek',
      quality: 'Quality',
      fullscreen: 'Full screen',
      exitFullscreen: 'Exit full screen',
    },
  },
  it: {
    skipLink: 'Vai al contenuto',
    journal: 'Il Journal',
    topics: 'Argomenti',
    by: 'Di',
    draft: 'Bozza',
    minRead: (minutes: number) => `${minutes} min di lettura`,
    updated: 'Aggiornato il',
    published: (date: string) => `Pubblicato il ${date} nel Vela Journal.`,
    lastUpdated: (date: string) => `Ultimo aggiornamento: ${date}.`,
    follow: [
      'Segui il progetto via ',
      'RSS',
      '. Se l’articolo ti è piaciuto, una ',
      'stella su GitHub',
      ' aiuta altre persone a trovare Vela.',
    ],
    moreEntries: 'Altri articoli',
    previous: 'Articolo precedente',
    next: 'Articolo successivo',
    allEntries: 'Tutti gli articoli del Journal',
    readIn: 'Leggi in italiano',
    translatedFrom: { en: 'Tradotto dall’inglese.', it: '' } as Record<Lang, string>,
    contents: 'In questo articolo',
    sectionLink: (heading: string) => `Link alla sezione: ${heading}`,
    entry: 'Articolo',
    latest: 'Ultimo',
    readEntry: 'Leggi l’articolo',
    entriesFrom: (year: string) => `Articoli del ${year}`,
    entries: (count: number) => `${count} ${count === 1 ? 'articolo' : 'articoli'}`,
    discuss: ['Domande, idee o obiezioni? ', 'Parliamone su Matrix', '.'],
    copyLink: 'Copia link',
    linkCopied: 'Link copiato',
    copyFailed: 'Copia non riuscita',
    related: 'Sullo stesso argomento',
    index: {
      title: 'Journal',
      rule: 'Diario di sviluppo',
      heading: ['Il ', 'Journal'],
      description:
        'Il diario di sviluppo di Vela in italiano: note lunghe sulla costruzione di un desktop Linux, dal compositor al renderer alla shell, e le ragioni dietro le scelte.',
      intro:
        'Note sulla costruzione di un desktop: il compositor e il renderer, la shell e le decisioni dietro di loro, raccontate per esteso e senza tagliare i dettagli.',
      noEntries: 'Ancora nessun articolo',
      rss: 'Iscriviti via RSS',
      source: 'Codice su GitHub',
      lastEntry: 'Ultimo articolo',
      untranslated: (count: number) =>
        count === 1 ? 'Un altro articolo è disponibile solo in inglese.' : `Altri ${count} articoli sono disponibili solo in inglese.`,
      untranslatedLink: 'Il Journal in inglese',
    },
    topic: {
      title: (tag: string) => `${tag} — Journal`,
      description: (count: string, tag: string) =>
        `${count} del diario di sviluppo di Vela sull’argomento “${tag}”: note lunghe sulla costruzione di un desktop Linux moderno, dal più recente.`,
      rule: 'Argomento',
      tagged: (count: string, tag: string) => `${count} sull’argomento “${tag}”, dal più recente.`,
      all: 'Tutti gli articoli',
    },
    search: {
      label: 'Cerca nel Journal',
      placeholder: 'Cerca nel Journal',
      one: '1 articolo per “{query}”',
      many: '{count} articoli per “{query}”',
      none: 'Nessun articolo per “{query}”.',
      failed: 'La ricerca non è disponibile in questo momento.',
    },
    player: {
      play: 'Riproduci',
      pause: 'Pausa',
      seek: 'Posizione',
      quality: 'Qualità',
      fullscreen: 'Schermo intero',
      exitFullscreen: 'Esci da schermo intero',
    },
  },
} satisfies Record<Lang, Record<string, unknown>>;
