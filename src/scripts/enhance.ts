// Progressive enhancements. The site is complete without this file: it only
// adds the header's scrolled state, reveal-on-scroll, the light/dark
// comparison handle, copy buttons on code blocks and the one for an entry's link.

import { COPY, DEFAULT_LANG, isLang } from '../lib/i18n';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ── Header: solid once the page has scrolled ────────────────────────────────
const header = document.querySelector<HTMLElement>('[data-header]');
if (header) {
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  update();
  window.addEventListener('scroll', update, { passive: true });
}

// ── Reveal on scroll ────────────────────────────────────────────────────────
const revealables = document.querySelectorAll<HTMLElement>('[data-reveal]');
if (reducedMotion.matches || !('IntersectionObserver' in window)) {
  revealables.forEach((el) => el.classList.add('is-revealed'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  revealables.forEach((el) => observer.observe(el));
}

// The inline script in Head.astro shows hidden content again unless this
// file got this far: content waiting to be revealed now will be.
document.documentElement.classList.add('enhanced');

// ── Light / dark comparison ─────────────────────────────────────────────────
// The range input works on its own (keyboard, touch, screen readers); this
// only mirrors its value into a CSS variable that positions the split.
document.querySelectorAll<HTMLElement>('[data-compare]').forEach((compare) => {
  const input = compare.querySelector<HTMLInputElement>('input[type="range"]');
  if (!input) return;
  const sync = () => compare.style.setProperty('--split', `${input.value}%`);
  input.addEventListener('input', sync);
  sync();
  compare.classList.add('is-interactive');
});

// ── Copy buttons on code blocks ─────────────────────────────────────────────
// In the page's language. The result is announced through a live region,
// since a button's changing text isn't read out on its own.
if (navigator.clipboard) {
  const lang = document.documentElement.lang;
  const words = COPY[isLang(lang) ? lang : DEFAULT_LANG];
  const status = document.createElement('p');
  status.className = 'visually-hidden';
  status.setAttribute('role', 'status');
  document.body.append(status);

  document.querySelectorAll<HTMLPreElement>('.prose pre').forEach((pre) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-button';
    button.textContent = words.copy;
    button.setAttribute('aria-label', words.label);
    button.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.innerText ?? pre.innerText;
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = words.copied;
      } catch {
        button.textContent = words.failed;
      }
      status.textContent = button.textContent;
      window.setTimeout(() => {
        button.textContent = words.copy;
        status.textContent = '';
      }, 1600);
    });
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    pre.replaceWith(wrapper);
    wrapper.append(pre, button);
  });
}

// ── Copy an entry's link ────────────────────────────────────────────────────
// The canonical address, without the section the reader is at. The button's
// words come from the page (Article.astro); the result is announced, as above.
const copyLink = document.querySelector<HTMLButtonElement>('[data-copy-link]');
if (copyLink && navigator.clipboard) {
  const label = copyLink.textContent?.trim() ?? '';
  const status = document.createElement('span');
  status.className = 'visually-hidden';
  status.setAttribute('role', 'status');
  copyLink.after(status);
  copyLink.addEventListener('click', async () => {
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
    try {
      await navigator.clipboard.writeText(canonical ?? `${location.origin}${location.pathname}`);
      copyLink.textContent = copyLink.dataset.copied ?? label;
    } catch {
      copyLink.textContent = copyLink.dataset.failed ?? label;
    }
    status.textContent = copyLink.textContent;
    window.setTimeout(() => {
      copyLink.textContent = label;
      status.textContent = '';
    }, 1600);
  });
  copyLink.hidden = false;
}
