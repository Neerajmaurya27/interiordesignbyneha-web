/**
 * Once-only settling fade for [data-reveal] elements (brief §6). Purpose: orientation.
 * - The hidden state exists only under html.js-reveal, which this script adds, so content stays
 *   visible if JavaScript fails.
 * - Elements already on screen when the script runs are marked revealed first, so nothing
 *   visible disappears and fades back in.
 * - IntersectionObserver at threshold 0.15, rootMargin "0px 0px -10% 0px"; each element is
 *   unobserved after its first reveal and never replays on scroll-up. No scroll handlers.
 * - Under prefers-reduced-motion, motion.css limits this to a ≤200ms opacity change.
 */
const items = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];

if (items.length > 0 && 'IntersectionObserver' in window) {
  const viewportBottom = window.innerHeight;
  for (const el of items) {
    const rect = el.getBoundingClientRect();
    if (rect.top < viewportBottom && rect.bottom > 0) el.setAttribute('data-revealed', '');
  }

  document.documentElement.classList.add('js-reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.setAttribute('data-revealed', '');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
  );

  for (const el of items) {
    if (!el.hasAttribute('data-revealed')) observer.observe(el);
  }
}
