/**
 * Sticky caption sequence (brief §7 chapter 03, desktop only). Purpose: orientation — the
 * caption column names whichever close-up is in the middle of the viewport.
 * Each figure keeps its own <figcaption> in DOM order for screen readers; the sticky column is
 * a visual duplicate (aria-hidden). The caption cross-fades over --dur-ui, instantly under
 * reduced motion. No scroll handlers.
 */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

for (const sequence of document.querySelectorAll<HTMLElement>('[data-sticky-caption-sequence]')) {
  const display = sequence.querySelector<HTMLElement>('[data-sticky-caption]');
  const figures = [...sequence.querySelectorAll<HTMLElement>('[data-caption-item]')];
  if (!display || figures.length === 0) continue;

  let active = -1;
  let swapTimer: number | undefined;

  const show = (index: number) => {
    if (index === active) return;
    active = index;
    const text = figures[index]?.dataset.caption ?? '';
    window.clearTimeout(swapTimer);
    if (reducedMotion.matches) {
      display.textContent = text;
      return;
    }
    display.style.opacity = '0';
    swapTimer = window.setTimeout(() => {
      display.textContent = text;
      display.style.opacity = '1';
    }, 120);
  };

  show(0);

  // Figures can sit side by side, so several may cross the middle band at once: the one whose
  // centre is nearest the viewport centre is "current".
  const inBand = new Set<HTMLElement>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) inBand.add(el);
        else inBand.delete(el);
      }
      const middle = window.innerHeight / 2;
      let best: HTMLElement | undefined;
      let bestDistance = Infinity;
      for (const el of inBand) {
        const rect = el.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - middle);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = el;
        }
      }
      if (best) show(figures.indexOf(best));
    },
    // A band across the middle of the viewport decides which figures are candidates.
    { rootMargin: '-40% 0px -40% 0px' },
  );
  figures.forEach((figure) => observer.observe(figure));
}
