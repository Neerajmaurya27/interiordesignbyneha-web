import { describe, expect, it, vi } from 'vitest';
import {
  budgetBandsFor,
  enquirySchema,
  servicesFor,
  type EnquiryConfig,
} from '../../src/lib/enquiry-schema';
import { handleEnquiry, type EnquiryDeps } from '../../src/lib/enquiry';

const empty: EnquiryConfig = {
  servicesByCity: { mumbai: [], dubai: [] },
  bands: { sizeSqft: null, budgetINR: null, budgetAED: null },
};

const configured: EnquiryConfig = {
  servicesByCity: { mumbai: ['design-execution', 'design-only'], dubai: ['design-only'] },
  bands: { sizeSqft: ['3,000–5,000'], budgetINR: ['₹2–4 crore'], budgetAED: ['AED 1–2m'] },
};

const valid = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  phone: '+91 98765 43210',
  projectType: 'apartment',
  location: 'mumbai',
  timing: '3-6',
  consent: 'yes',
};

describe('servicesFor', () => {
  it('offers only "Not sure yet" until services are confirmed', () => {
    expect(servicesFor('mumbai', empty)).toEqual(['not-sure']);
  });
  it('offers only what each city genuinely provides', () => {
    expect(servicesFor('dubai', configured)).toEqual(['design-only', 'not-sure']);
    expect(servicesFor('both', configured)).toEqual(['design-only', 'not-sure']);
    expect(servicesFor('mumbai', configured)).toEqual([
      'design-execution',
      'design-only',
      'not-sure',
    ]);
  });
});

describe('budgetBandsFor', () => {
  it('uses INR for Mumbai, AED for Dubai and both for "Both"', () => {
    expect(budgetBandsFor('mumbai', configured)).toEqual(['₹2–4 crore']);
    expect(budgetBandsFor('dubai', configured)).toEqual(['AED 1–2m']);
    expect(budgetBandsFor('both', configured)).toEqual(['₹2–4 crore', 'AED 1–2m']);
  });
});

describe('enquirySchema', () => {
  const parse = (data: Record<string, unknown>, config = empty) =>
    enquirySchema(config).safeParse(data);
  const errorsOf = (data: Record<string, unknown>, config = empty) => {
    const result = parse(data, config);
    return result.success
      ? {}
      : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
  };

  it('accepts a minimal valid enquiry and defaults services to "not sure"', () => {
    const result = parse(valid);
    expect(result.success).toBe(true);
    expect(result.success && result.data.services).toEqual(['not-sure']);
    expect(result.success && result.data.marketing).toBe(false);
  });

  it('accepts Indian and UAE numbers with country codes', () => {
    expect(parse({ ...valid, phone: '+971 50 123 4567' }).success).toBe(true);
    expect(parse({ ...valid, phone: '+91-98765-43210' }).success).toBe(true);
  });

  it('explains every required field in words', () => {
    expect(errorsOf({})).toMatchObject({
      name: expect.stringContaining('full name'),
      email: expect.stringContaining('email address'),
      phone: expect.stringContaining('country code'),
      projectType: 'Choose the type of project',
      location: 'Choose where the project is',
      timing: 'Choose when you would like to start',
      consent: expect.stringContaining('Tick the box'),
    });
  });

  it('requires the country code on phone numbers', () => {
    expect(errorsOf({ ...valid, phone: '98765 43210' }).phone).toMatch(/country code/);
  });

  it('asks for the city when the location is elsewhere', () => {
    expect(errorsOf({ ...valid, location: 'elsewhere' }).locationOther).toBe(
      'Tell us the city and country',
    );
    expect(parse({ ...valid, location: 'elsewhere', locationOther: 'London, UK' }).success).toBe(
      true,
    );
  });

  it('rejects services not offered in the chosen city', () => {
    expect(
      errorsOf({ ...valid, location: 'dubai', services: ['design-execution'] }, configured)
        .services,
    ).toBeDefined();
    expect(
      parse({ ...valid, location: 'dubai', services: ['design-only'] }, configured).success,
    ).toBe(true);
  });

  it('only accepts configured size and budget bands', () => {
    expect(errorsOf({ ...valid, size: '3,000–5,000' }).size).toBeDefined();
    expect(parse({ ...valid, size: '3,000–5,000', budget: '₹2–4 crore' }, configured).success).toBe(
      true,
    );
    expect(errorsOf({ ...valid, budget: 'AED 1–2m' }, configured).budget).toBeDefined();
  });
});

function form(data: Record<string, string | string[]>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(data)) for (const item of [v].flat()) f.append(k, item);
  return f;
}

function deps(overrides: Partial<EnquiryDeps> = {}): EnquiryDeps {
  return {
    config: empty,
    verifyHuman: vi.fn(async () => true),
    notifyStudio: vi.fn(async () => {}),
    storeLead: vi.fn(async () => {}),
    confirmToEnquirer: vi.fn(async () => {}),
    noticeVersion: '2026-10',
    now: () => new Date('2026-10-14T10:00:10Z'),
    log: vi.fn(),
    ...overrides,
  };
}

const rendered = String(new Date('2026-10-14T10:00:00Z').getTime());
const good = { ...valid, renderedAt: rendered, 'cf-turnstile-response': 'token' };

describe('handleEnquiry', () => {
  it('sends, stores and confirms a valid enquiry with consent metadata', async () => {
    const d = deps();
    expect(await handleEnquiry(form(good), d)).toEqual({ status: 'ok' });
    expect(d.notifyStudio).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Asha Rao',
        consentAt: '2026-10-14T10:00:10.000Z',
        noticeVersion: '2026-10',
      }),
    );
    expect(d.storeLead).toHaveBeenCalled();
    expect(d.confirmToEnquirer).toHaveBeenCalled();
  });

  it('silently drops honeypot submissions', async () => {
    const d = deps();
    expect(await handleEnquiry(form({ ...good, website: 'spam.example' }), d)).toEqual({
      status: 'ok',
    });
    expect(d.notifyStudio).not.toHaveBeenCalled();
    expect(d.storeLead).not.toHaveBeenCalled();
  });

  it('asks to retry when submitted too fast, keeping the values', async () => {
    const d = deps({ now: () => new Date('2026-10-14T10:00:01Z') });
    const result = await handleEnquiry(form(good), d);
    expect(result).toMatchObject({ status: 'retry', values: { name: 'Asha Rao' } });
    expect(d.verifyHuman).not.toHaveBeenCalled();
  });

  it('asks to retry when Turnstile fails', async () => {
    const d = deps({ verifyHuman: vi.fn(async () => false) });
    expect(await handleEnquiry(form(good), d)).toMatchObject({ status: 'retry' });
    expect(d.notifyStudio).not.toHaveBeenCalled();
  });

  it('returns field errors and the typed values (without technical fields)', async () => {
    const result = await handleEnquiry(form({ ...good, email: 'not-an-email' }), deps());
    expect(result.status).toBe('invalid');
    if (result.status !== 'invalid') return;
    expect(result.errors.email).toMatch(/email address/);
    expect(result.values).toMatchObject({ name: 'Asha Rao', email: 'not-an-email' });
    expect(result.values).not.toHaveProperty('cf-turnstile-response');
    expect(result.values).not.toHaveProperty('renderedAt');
  });

  it('still succeeds when only one of email or lead store works', async () => {
    const d = deps({ notifyStudio: vi.fn(async () => Promise.reject(new Error('email down'))) });
    expect(await handleEnquiry(form(good), d)).toEqual({ status: 'ok' });
    expect(d.log).toHaveBeenCalledWith('Studio email failed', expect.any(Error));
  });

  it('fails, keeping the values, when both email and lead store fail', async () => {
    const down = vi.fn(async () => Promise.reject(new Error('down')));
    const result = await handleEnquiry(form(good), deps({ notifyStudio: down, storeLead: down }));
    expect(result).toMatchObject({ status: 'failed', values: { email: 'asha@example.com' } });
  });

  it('does not fail when only the confirmation email fails', async () => {
    const d = deps({ confirmToEnquirer: vi.fn(async () => Promise.reject(new Error('bounce'))) });
    expect(await handleEnquiry(form(good), d)).toEqual({ status: 'ok' });
  });
});

describe('handleEnquiry ordering', () => {
  it('shows field errors even when submitted quickly', async () => {
    const d = deps({ now: () => new Date('2026-10-14T10:00:01Z') });
    const result = await handleEnquiry(form({ ...good, email: 'nope' }), d);
    expect(result.status).toBe('invalid');
    expect(d.verifyHuman).not.toHaveBeenCalled();
  });
});

describe('handleEnquiry resilience', () => {
  it('asks to retry when the human check cannot be reached', async () => {
    const d = deps({ verifyHuman: vi.fn(async () => Promise.reject(new Error('network'))) });
    const result = await handleEnquiry(form(good), d);
    expect(result).toMatchObject({ status: 'retry', values: { name: 'Asha Rao' } });
    expect(d.log).toHaveBeenCalledWith('Turnstile verification failed', expect.any(Error));
    expect(d.notifyStudio).not.toHaveBeenCalled();
  });
});
