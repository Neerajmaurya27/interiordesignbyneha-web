/** Case-study lightbox behaviour. See src/components/projects/Lightbox.astro. */
import { trapFocus } from './focus-trap';

const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox]');
const triggers = [...document.querySelectorAll<HTMLAnchorElement>('[data-lightbox-trigger]')];

if (dialog && triggers.length > 0) {
  const image = dialog.querySelector<HTMLImageElement>('[data-lightbox-image]')!;
  const caption = dialog.querySelector<HTMLElement>('[data-lightbox-caption]')!;
  const count = dialog.querySelector<HTMLElement>('[data-lightbox-count]')!;
  const prev = dialog.querySelector<HTMLButtonElement>('[data-lightbox-prev]')!;
  const next = dialog.querySelector<HTMLButtonElement>('[data-lightbox-next]')!;
  let index = 0;
  let opener: HTMLElement | null = null;
  let pushedState = false;
  trapFocus(dialog);

  const show = (i: number) => {
    index = (i + triggers.length) % triggers.length;
    const t = triggers[index]!;
    image.src = t.dataset.full ?? t.href;
    image.alt = t.dataset.alt ?? '';
    if (t.dataset.width) image.width = Number(t.dataset.width);
    if (t.dataset.height) image.height = Number(t.dataset.height);
    caption.textContent = t.dataset.caption ?? '';
    count.textContent = `${index + 1} of ${triggers.length}`;
    // Warm the next image so stepping forward feels immediate.
    const upcoming = triggers[(index + 1) % triggers.length];
    if (upcoming?.dataset.full) new Image().src = upcoming.dataset.full;
  };

  const open = (i: number, from: HTMLElement) => {
    opener = from;
    show(i);
    dialog.showModal();
    history.pushState({ lightbox: true }, '');
    pushedState = true;
  };

  // Closing from the UI also removes the history entry we added.
  const requestClose = () => {
    if (pushedState) history.back();
    else dialog.close();
  };

  triggers.forEach((trigger, i) =>
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      open(i, trigger);
    }),
  );

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  dialog.querySelector('[data-lightbox-close]')!.addEventListener('click', requestClose);

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(index - 1);
    else if (event.key === 'ArrowRight') show(index + 1);
  });

  // Escape fires "cancel": route it through history so Back stays consistent.
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    requestClose();
  });

  // The browser Back button (or gesture) closes the viewer.
  window.addEventListener('popstate', () => {
    if (!dialog.open) return;
    pushedState = false;
    dialog.close();
  });

  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    opener?.focus();
  });

  // Swipe left/right on touch; the visible buttons remain the primary control.
  let startX: number | null = null;
  image.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch') startX = event.clientX;
  });
  image.addEventListener('pointerup', (event) => {
    if (startX === null) return;
    const delta = event.clientX - startX;
    startX = null;
    if (Math.abs(delta) > 50) show(delta < 0 ? index + 1 : index - 1);
  });
}
