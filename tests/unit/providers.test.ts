import { describe, expect, it, vi } from 'vitest';
import { exportPKCS8, generateKeyPair } from 'jose';
import { verifyTurnstile } from '../../src/lib/providers/turnstile';
import {
  enquirerConfirmation,
  sendWithResend,
  studioNotification,
} from '../../src/lib/providers/email';
import { appendToSheet, leadRow, SHEET_COLUMNS } from '../../src/lib/providers/sheets';
import type { Lead } from '../../src/lib/enquiry';

const lead: Lead = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  phone: '+91 98765 43210',
  projectType: 'villa',
  location: 'elsewhere',
  locationOther: 'London, UK',
  services: ['not-sure'],
  timing: '6-12',
  message: 'A family home.',
  source: 'referral',
  consent: 'yes',
  marketing: false,
  sourcePage: '/projects/worli',
  receivedAt: '2026-10-14T10:00:10.000Z',
  consentAt: '2026-10-14T10:00:10.000Z',
  noticeVersion: '2026-10',
} as Lead;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('verifyTurnstile', () => {
  it('posts secret, token and IP to siteverify', async () => {
    const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = init?.body as FormData;
      expect(body.get('secret')).toBe('s3cret');
      expect(body.get('response')).toBe('tok');
      expect(body.get('remoteip')).toBe('203.0.113.9');
      return json({ success: true });
    });
    expect(await verifyTurnstile('s3cret', 'tok', '203.0.113.9', fetchImpl as typeof fetch)).toBe(
      true,
    );
  });

  it('fails closed on a missing token, an error status or success: false', async () => {
    const ok = vi.fn(async () => json({ success: false }));
    expect(await verifyTurnstile('s', '', null, ok as typeof fetch)).toBe(false);
    expect(await verifyTurnstile('s', 't', null, ok as typeof fetch)).toBe(false);
    const down = vi.fn(async () => json({}, 500));
    expect(await verifyTurnstile('s', 't', null, down as typeof fetch)).toBe(false);
  });
});

describe('email', () => {
  it('builds a studio notification with every answer and reply-to the enquirer', () => {
    const message = studioNotification(lead, 'studio@site.test', 'neha@site.test');
    expect(message.subject).toBe('New enquiry: Asha Rao · Villa · London, UK');
    expect(message.replyTo).toBe('asha@example.com');
    expect(message.text).toContain('Location: Elsewhere: London, UK');
    expect(message.text).toContain('Services: Not sure yet');
    expect(message.text).toContain(
      'Consent given: 2026-10-14T10:00:10.000Z (privacy notice 2026-10)',
    );
    expect(message.text).not.toContain('Budget');
  });

  it('keeps the confirmation short and only promises what is configured', () => {
    const plain = enquirerConfirmation(lead, 'studio@site.test', 'interiordesignbyneha', null);
    expect(plain.text).toMatch(/^Dear Asha,/);
    expect(plain.text).not.toContain('working day');
    const promised = enquirerConfirmation(lead, 'f', 'studio', 'We reply within one working day.');
    expect(promised.text).toContain('We reply within one working day.');
  });

  it('sends through Resend with the API key', async () => {
    const fetchImpl = vi.fn(async (url: unknown, init?: RequestInit) => {
      expect(url).toBe('https://api.resend.com/emails');
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer re_key');
      expect(JSON.parse(String(init?.body))).toMatchObject({
        to: ['neha@site.test'],
        reply_to: 'asha@example.com',
      });
      return json({ id: '1' });
    });
    await sendWithResend(
      're_key',
      studioNotification(lead, 'f@site.test', 'neha@site.test'),
      fetchImpl as typeof fetch,
    );
    await expect(
      sendWithResend(
        'k',
        studioNotification(lead, 'f', 't'),
        vi.fn(async () => json({}, 422)) as typeof fetch,
      ),
    ).rejects.toThrow('Resend responded 422');
  });
});

describe('Google Sheets', () => {
  it('maps a lead to one row in column order', () => {
    const row = leadRow(lead);
    expect(row).toHaveLength(SHEET_COLUMNS.length);
    expect(row[0]).toBe('2026-10-14T10:00:10.000Z');
    expect(row[SHEET_COLUMNS.indexOf('Location')]).toBe('Elsewhere: London, UK');
    expect(row[SHEET_COLUMNS.indexOf('Budget')]).toBe('');
  });

  it('signs a service-account JWT and appends the row', async () => {
    const { privateKey } = await generateKeyPair('RS256', { extractable: true });
    const pem = await exportPKCS8(privateKey);
    const calls: string[] = [];
    const fetchImpl = vi.fn(async (url: unknown, init?: RequestInit) => {
      calls.push(String(url));
      if (String(url).includes('oauth2')) {
        const params = new URLSearchParams(String(init?.body));
        expect(params.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
        expect(params.get('assertion')?.split('.')).toHaveLength(3);
        return json({ access_token: 'ya29.token' });
      }
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer ya29.token');
      expect(JSON.parse(String(init?.body)).values[0][1]).toBe('Asha Rao');
      return json({});
    });
    await appendToSheet(
      { sheetId: 'sheet123', email: 'sa@project.iam.gserviceaccount.com', privateKey: pem },
      lead,
      fetchImpl as typeof fetch,
    );
    expect(calls[1]).toContain('/spreadsheets/sheet123/values/Leads!A1:append');
  });
});
