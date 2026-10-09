// Progressive enhancements. The site is complete without this file: it only
// adds the header's scrolled state, reveal-on-scroll, the light/dark
// comparison handle and copy buttons on code blocks.

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
if (navigator.clipboard) {
  document.querySelectorAll<HTMLPreElement>('.prose pre').forEach((pre) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-button';
    button.textContent = 'Copy';
    button.setAttribute('aria-label', 'Copy code to clipboard');
    button.addEventListener('click', async () => {
      const code = pre.querySelector('code')?.innerText ?? pre.innerText;
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = 'Copied';
      } catch {
        button.textContent = 'Failed';
      }
      window.setTimeout(() => (button.textContent = 'Copy'), 1600);
    });
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    pre.replaceWith(wrapper);
    wrapper.append(pre, button);
  });
}
