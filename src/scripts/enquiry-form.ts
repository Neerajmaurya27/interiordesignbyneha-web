/**
 * Enquiry form enhancement (brief §12). Without this script the form still works by plain POST.
 * - Conditional questions: "Elsewhere" city field, INR/AED budget bands and services offered in
 *   the chosen city; the phone field gets the city's country code if it is still empty.
 * - Validation in words before sending, gathered in a focusable error summary and linked to each
 *   field with aria-describedby / aria-invalid.
 * - Sends in place (Accept: application/json); on success goes to the thank-you page; on failure
 *   keeps everything typed and shows the WhatsApp / phone / email fallbacks.
 * No animation on this page.
 */
const form = document.querySelector<HTMLFormElement>('[data-enquiry-form]');

declare global {
  interface Window {
    turnstile?: { reset: (widget?: string) => void };
  }
}

type Errors = Record<string, string>;

const MESSAGES: Record<string, string> = {
  name: 'Enter your full name',
  email: 'Enter an email address in the format name@example.com',
  phone: 'Enter a phone number with the country code, like +91 98765 43210 or +971 50 123 4567',
  projectType: 'Choose the type of project',
  location: 'Choose where the project is',
  locationOther: 'Tell us the city and country',
  timing: 'Choose when you would like to start',
  consent: 'Tick the box to agree, so we can reply to you',
};

const ANCHORS: Record<string, string> = {
  projectType: 'projectType-apartment',
  location: 'location-mumbai',
  timing: 'timing-within-3',
  consent: 'consent',
};

if (form) {
  const summary = form.querySelector<HTMLElement>('[data-error-summary]')!;
  const list = summary.querySelector<HTMLUListElement>('[data-error-list]')!;
  const status = form.querySelector<HTMLElement>('[data-submit-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
  const fallback = document.querySelector<HTMLElement>('[data-enquiry-fallback]');
  const servicesByCity = JSON.parse(form.dataset.services ?? '{}') as Record<string, string[]>;
  let started = false;

  const value = (name: string) => {
    const data = new FormData(form);
    return String(data.get(name) ?? '').trim();
  };

  // ── Conditional questions ─────────────────────────────────────────────
  const applyLocation = () => {
    const location = value('location');
    form.querySelectorAll<HTMLElement>('[data-show-when-location]').forEach((el) => {
      el.hidden = el.dataset.showWhenLocation !== location;
    });

    const currencies =
      location === 'dubai'
        ? ['aed']
        : location === 'both'
          ? ['inr', 'aed']
          : location
            ? ['inr']
            : ['inr', 'aed'];
    form.querySelectorAll<HTMLElement>('[data-budget-currency]').forEach((group) => {
      const show = currencies.includes(group.dataset.budgetCurrency ?? '');
      group.hidden = !show;
      if (!show)
        group.querySelectorAll<HTMLInputElement>('input').forEach((i) => (i.checked = false));
    });

    const { mumbai = [], dubai = [] } = servicesByCity;
    const offered =
      location === 'mumbai'
        ? mumbai
        : location === 'dubai'
          ? dubai
          : location === 'both'
            ? mumbai.filter((s) => dubai.includes(s))
            : [...new Set([...mumbai, ...dubai])];
    form.querySelectorAll<HTMLElement>('[data-service-option]').forEach((option) => {
      const id = option.dataset.serviceOption ?? '';
      const show = id === 'not-sure' || offered.includes(id);
      option.hidden = !show;
      if (!show)
        option.querySelectorAll<HTMLInputElement>('input').forEach((i) => (i.checked = false));
    });

    const phone = form.querySelector<HTMLInputElement>('#phone');
    if (phone && phone.value.trim() === '') {
      if (location === 'mumbai') phone.value = '+91 ';
      if (location === 'dubai') phone.value = '+971 ';
    }
  };

  form.addEventListener('change', (event) => {
    if ((event.target as HTMLInputElement).name === 'location') applyLocation();
  });
  applyLocation();

  form.addEventListener('focusin', () => {
    if (started) return;
    started = true;
    form.dispatchEvent(
      new CustomEvent('analytics', { bubbles: true, detail: { name: 'form_start' } }),
    );
  });

  // ── Errors ────────────────────────────────────────────────────────────
  const clearErrors = () => {
    form.querySelectorAll<HTMLElement>('[data-error-for], [id$="-error"]').forEach((el) => {
      el.hidden = true;
      el.textContent = '';
    });
    form
      .querySelectorAll('[aria-invalid="true"]')
      .forEach((el) => el.removeAttribute('aria-invalid'));
    list.replaceChildren();
    summary.querySelector('[data-form-message]')?.remove();
  };

  const showErrors = (errors: Errors, message?: string) => {
    clearErrors();
    if (message) {
      const p = document.createElement('p');
      p.dataset.formMessage = '';
      p.textContent = message;
      list.before(p);
    }
    for (const [field, text] of Object.entries(errors)) {
      const target = document.getElementById(`${field}-error`);
      if (target) {
        target.textContent = `Error: ${text}`;
        target.hidden = false;
      }
      form.querySelectorAll<HTMLInputElement>(`[name="${field}"]`).forEach((input) => {
        if (input.type !== 'hidden') input.setAttribute('aria-invalid', 'true');
      });
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${ANCHORS[field] ?? field}`;
      a.className = 'text-terracotta underline';
      a.textContent = text;
      li.append(a);
      list.append(li);
    }
    summary.classList.remove('hidden');
    summary.focus();
  };

  const validate = (): Errors => {
    const errors: Errors = {};
    if (value('name').length < 2) errors.name = MESSAGES.name!;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('email'))) errors.email = MESSAGES.email!;
    if (!/^\+[1-9][0-9 ()-]{6,22}$/.test(value('phone'))) errors.phone = MESSAGES.phone!;
    for (const field of ['projectType', 'location', 'timing'] as const) {
      if (!value(field)) errors[field] = MESSAGES[field]!;
    }
    if (value('location') === 'elsewhere' && !value('locationOther')) {
      errors.locationOther = MESSAGES.locationOther!;
    }
    if (value('consent') !== 'yes') errors.consent = MESSAGES.consent!;
    return errors;
  };

  // ── Submit in place ───────────────────────────────────────────────────
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      showErrors(errors);
      return;
    }

    submit.disabled = true;
    status.textContent = 'Sending your enquiry…';
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const result = (await response.json()) as {
        status: string;
        redirect?: string;
        errors?: Errors;
        message?: string;
      };
      if (result.status === 'ok') {
        form.dispatchEvent(
          new CustomEvent('analytics', { bubbles: true, detail: { name: 'form_submit_success' } }),
        );
        window.location.assign(result.redirect ?? '/enquire/thank-you');
        return;
      }
      form.dispatchEvent(
        new CustomEvent('analytics', {
          bubbles: true,
          detail: { name: 'form_submit_error', reason: result.status },
        }),
      );
      if (result.status === 'invalid' && result.errors) showErrors(result.errors);
      else if (result.status === 'retry') {
        showErrors({}, result.message);
        window.turnstile?.reset();
      } else throw new Error(result.status);
    } catch {
      showErrors(
        {},
        'Your enquiry could not be sent just now. Nothing you typed has been lost: please try again in a moment, or contact us directly using the details on this page.',
      );
      if (fallback) fallback.hidden = false;
    } finally {
      submit.disabled = false;
      status.textContent = '';
    }
  });

  // A server-rendered error summary (no-JS round trip or retry) receives focus on load.
  if (!summary.classList.contains('hidden')) summary.focus();
}

export {};
