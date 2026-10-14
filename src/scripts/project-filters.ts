/**
 * Projects index filtering (brief §8). Reads ?type= and ?city=, shows matching cards, re-applies
 * the editorial grid rhythm to the visible cards, marks the current chips and announces the
 * count. Filter clicks update the URL with replaceState, so returning from a case study with Back
 * restores the same view. Purpose: orientation (no animation).
 */
import { shapeFor } from '../lib/project-rules';

const nav = document.querySelector<HTMLElement>('[data-project-filters]');
const cards = [...document.querySelectorAll<HTMLElement>('[data-project-card]')];
const status = document.querySelector<HTMLElement>('[data-filter-status]');
const empty = document.querySelector<HTMLElement>('[data-filter-empty]');

type Key = 'type' | 'city';
const attr: Record<Key, string> = { type: 'typeGroup', city: 'city' };

function allowed(key: Key): Set<string> {
  return new Set(
    [...(nav?.querySelectorAll<HTMLElement>(`[data-filter="${key}"]`) ?? [])]
      .map((a) => a.dataset.value ?? '')
      .filter(Boolean),
  );
}

function current(): Record<Key, string> {
  const params = new URLSearchParams(window.location.search);
  const read = (key: Key) => {
    const value = params.get(key) ?? '';
    return allowed(key).has(value) ? value : '';
  };
  return { type: read('type'), city: read('city') };
}

function apply() {
  const filters = current();
  let visible = 0;
  for (const card of cards) {
    const match = (Object.keys(filters) as Key[]).every(
      (key) => !filters[key] || card.dataset[attr[key]] === filters[key],
    );
    card.hidden = !match;
    if (match) card.dataset.shape = shapeFor(visible++);
  }
  nav?.querySelectorAll<HTMLAnchorElement>('[data-filter]').forEach((a) => {
    const key = a.dataset.filter as Key;
    a.setAttribute('aria-current', String((a.dataset.value ?? '') === filters[key]));
    a.href = hrefWith(key, a.dataset.value ?? '', filters);
  });
  const filtered = filters.type || filters.city;
  if (status) {
    status.textContent = filtered
      ? `Showing ${visible} of ${cards.length} projects`
      : `${cards.length} projects`;
  }
  if (empty) empty.hidden = visible > 0;
}

function hrefWith(key: Key, value: string, filters: Record<Key, string>): string {
  const next = { ...filters, [key]: value };
  const params = new URLSearchParams();
  if (next.type) params.set('type', next.type);
  if (next.city) params.set('city', next.city);
  const query = params.toString();
  return `/projects${query ? `?${query}` : ''}`;
}

if (nav && cards.length > 0) {
  nav.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-filter]');
    if (!link) return;
    event.preventDefault();
    history.replaceState(history.state, '', link.href);
    apply();
    const { type, city } = current();
    nav.dispatchEvent(
      new CustomEvent('analytics', {
        bubbles: true,
        detail: { name: 'filter_change', type, city },
      }),
    );
  });
  window.addEventListener('popstate', apply);
  window.addEventListener('pageshow', apply); // restores state when returning via bfcache
  apply();
}
