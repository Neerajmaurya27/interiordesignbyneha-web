/**
 * Builds the enquiry dependencies from environment variables (see .env.example).
 * Mock mode (ENQUIRY_MOCK=true) is honoured only in development: it skips Turnstile and the
 * providers and logs the lead instead, so the form can be exercised end to end before the
 * accounts exist. A lead whose name contains "Simulate failure" fails both providers, to test the
 * error path.
 */
import { getSecret } from 'astro:env/server';
import { enquiryBands, servicesByCity, site } from '../data/site';
import type { EnquiryDeps, Lead } from './enquiry';
import type { EnquiryConfig } from './enquiry-schema';
import { enquirerConfirmation, sendWithResend, studioNotification } from './providers/email';
import { appendToSheet } from './providers/sheets';
import { postToCrm } from './providers/crm';
import { verifyTurnstile } from './providers/turnstile';

const secret = (name: string) => getSecret(name) as string | undefined;

export function isMockMode(): boolean {
  return import.meta.env.DEV && String(getSecret('ENQUIRY_MOCK')) === 'true';
}

/** True when the services needed to accept enquiries are configured. */
export function isEnquiryConfigured(): boolean {
  if (isMockMode()) return true;
  const turnstile = !!secret('TURNSTILE_SECRET_KEY');
  const email = !!(
    secret('RESEND_API_KEY') &&
    secret('ENQUIRY_TO_EMAIL') &&
    secret('ENQUIRY_FROM_EMAIL')
  );
  const store = (secret('LEAD_STORE') ?? 'none') !== 'none';
  return turnstile && (email || store);
}

/**
 * Services and answer bands for the form and for validation. In development, empty values are
 * filled from the labelled sample so every question can be reviewed; production uses only
 * confirmed values from src/data/site.ts.
 */
export async function getEnquiryConfig(): Promise<{ config: EnquiryConfig; usesSample: boolean }> {
  const config: EnquiryConfig = { servicesByCity, bands: enquiryBands };
  if (!import.meta.env.DEV) return { config, usesSample: false };
  const noServices = Object.values(servicesByCity).every((list) => list.length === 0);
  const noBands = Object.values(enquiryBands).every((bands) => bands === null);
  if (!noServices && !noBands) return { config, usesSample: false };
  const sample = await import('../fixtures/home/sample');
  return {
    usesSample: true,
    config: {
      servicesByCity: noServices
        ? {
            mumbai: [...sample.sampleServicesByCity.mumbai],
            dubai: [...sample.sampleServicesByCity.dubai],
          }
        : servicesByCity,
      bands: noBands ? sample.sampleEnquiryBands : enquiryBands,
    },
  };
}

export function enquiryDeps(config: EnquiryConfig): EnquiryDeps {
  const base = {
    config,
    noticeVersion: secret('PRIVACY_NOTICE_VERSION') ?? 'draft',
    now: () => new Date(),
    log: (message: string, error?: unknown) => console.error(`[enquiry] ${message}`, error ?? ''),
  };

  if (isMockMode()) {
    const failIfAsked = (lead: Lead) => {
      if (lead.name.includes('Simulate failure')) throw new Error('Simulated provider failure');
    };
    return {
      ...base,
      verifyHuman: async () => true,
      notifyStudio: async (lead) => {
        failIfAsked(lead);
        console.info(
          '[enquiry:mock] studio notification',
          studioNotification(lead, 'mock', 'mock'),
        );
      },
      storeLead: async (lead) => {
        failIfAsked(lead);
        console.info('[enquiry:mock] lead stored', lead.receivedAt);
      },
      confirmToEnquirer: async () => {},
    };
  }

  const resendKey = secret('RESEND_API_KEY');
  const to = secret('ENQUIRY_TO_EMAIL');
  const from = secret('ENQUIRY_FROM_EMAIL');
  const store = secret('LEAD_STORE') ?? 'none';

  return {
    ...base,
    verifyHuman: (token, ip) => verifyTurnstile(secret('TURNSTILE_SECRET_KEY') ?? '', token, ip),
    notifyStudio: async (lead) => {
      if (!resendKey || !to || !from) throw new Error('Email is not configured');
      await sendWithResend(resendKey, studioNotification(lead, from, to));
    },
    storeLead: async (lead) => {
      if (store === 'sheets') {
        await appendToSheet(
          {
            sheetId: secret('GOOGLE_SHEETS_ID') ?? '',
            email: secret('GOOGLE_SA_EMAIL') ?? '',
            privateKey: secret('GOOGLE_SA_PRIVATE_KEY') ?? '',
          },
          lead,
        );
      } else if (store === 'crm') {
        await postToCrm(secret('CRM_WEBHOOK_URL') ?? '', lead);
      } else {
        throw new Error('No lead store configured');
      }
    },
    confirmToEnquirer: async (lead) => {
      if (!resendKey || !from) return;
      await sendWithResend(
        resendKey,
        enquirerConfirmation(lead, from, site.name, site.replyPromise),
      );
    },
  };
}
