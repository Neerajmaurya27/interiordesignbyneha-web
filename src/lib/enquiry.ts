/**
 * Enquiry handling (brief §12), independent of Astro and of any provider so it can be unit-tested.
 * Order: honeypot → schema (so people always see their field errors) → minimum time → Turnstile
 * → studio email + lead store → confirmation.
 * A submission succeeds when the studio email or the lead store succeeds, so no lead is lost
 * to a single provider outage. Values are always returned on failure so nothing typed is lost.
 */
import { enquirySchema, formToObject, type Enquiry, type EnquiryConfig } from './enquiry-schema';

export const MIN_SECONDS_TO_SUBMIT = 3;

export interface Lead extends Enquiry {
  receivedAt: string;
  consentAt: string;
  noticeVersion: string;
}

export interface EnquiryDeps {
  config: EnquiryConfig;
  verifyHuman(token: string, ip: string | null): Promise<boolean>;
  notifyStudio(lead: Lead): Promise<void>;
  storeLead(lead: Lead): Promise<void>;
  confirmToEnquirer(lead: Lead): Promise<void>;
  noticeVersion: string;
  now(): Date;
  log(message: string, error?: unknown): void;
}

export type FieldErrors = Record<string, string>;

export type EnquiryResult =
  | { status: 'ok' }
  | { status: 'invalid'; errors: FieldErrors; values: Record<string, unknown> }
  | { status: 'retry'; message: string; values: Record<string, unknown> }
  | { status: 'failed'; values: Record<string, unknown> };

/** Strip hidden technical fields before echoing values back into the form. */
function echo(raw: Record<string, unknown>) {
  const values = { ...raw };
  for (const key of ['website', 'renderedAt', 'cf-turnstile-response']) delete values[key];
  return values;
}

export async function handleEnquiry(
  form: FormData,
  deps: EnquiryDeps,
  ip: string | null = null,
): Promise<EnquiryResult> {
  const raw = formToObject(form);
  const values = echo(raw);

  // Honeypot: a hidden field people never see. Pretend success so bots learn nothing.
  if (typeof raw.website === 'string' && raw.website.trim() !== '') {
    deps.log('Enquiry dropped: honeypot');
    return { status: 'ok' };
  }

  const parsed = enquirySchema(deps.config).safeParse(raw);
  if (!parsed.success) {
    const errors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? 'form');
      errors[field] ??= issue.message;
    }
    return { status: 'invalid', errors, values };
  }

  const renderedAt = Number(raw.renderedAt);
  const elapsed = (deps.now().getTime() - renderedAt) / 1000;
  if (!Number.isFinite(renderedAt) || elapsed < MIN_SECONDS_TO_SUBMIT) {
    return {
      status: 'retry',
      message: 'Please check your details and send the form again.',
      values,
    };
  }

  const token =
    typeof raw['cf-turnstile-response'] === 'string' ? raw['cf-turnstile-response'] : '';
  let human = false;
  try {
    human = await deps.verifyHuman(token, ip);
  } catch (error) {
    // Treat an unreachable verifier as "not confirmed": the visitor can retry or use WhatsApp.
    deps.log('Turnstile verification failed', error);
  }
  if (!human) {
    return {
      status: 'retry',
      message:
        'We could not confirm the form was sent by a person. Please try again, or contact us by WhatsApp or email.',
      values,
    };
  }

  const receivedAt = deps.now().toISOString();
  const lead: Lead = {
    ...parsed.data,
    receivedAt,
    consentAt: receivedAt,
    noticeVersion: deps.noticeVersion,
  };

  const [notified, stored] = await Promise.allSettled([
    deps.notifyStudio(lead),
    deps.storeLead(lead),
  ]);
  if (notified.status === 'rejected') deps.log('Studio email failed', notified.reason);
  if (stored.status === 'rejected') deps.log('Lead store failed', stored.reason);
  if (notified.status === 'rejected' && stored.status === 'rejected') {
    return { status: 'failed', values };
  }

  try {
    await deps.confirmToEnquirer(lead);
  } catch (error) {
    deps.log('Confirmation email failed', error);
  }
  return { status: 'ok' };
}
