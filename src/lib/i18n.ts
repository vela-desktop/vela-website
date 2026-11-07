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
    // "Follow along by RSS, or watch the repository on GitHub."
    follow: ['Follow along by ', 'RSS', ', or watch the ', 'repository on GitHub', '.'],
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
    follow: ['Segui il progetto via ', 'RSS', ' o sul ', 'repository GitHub', '.'],
    moreEntries: 'Altri articoli',
    previous: 'Articolo precedente',
    next: 'Articolo successivo',
    allEntries: 'Tutti gli articoli del Journal',
    readIn: 'Leggi in italiano',
    translatedFrom: { en: 'Tradotto dall’inglese.', it: '' } as Record<Lang, string>,
    contents: 'In questo articolo',
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
