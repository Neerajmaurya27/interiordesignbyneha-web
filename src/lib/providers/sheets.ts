/**
 * Append a lead to a Google Sheet with a service account. The JWT is signed with WebCrypto via
 * `jose`, so it runs in Cloudflare Workers without the Node-only Google SDK.
 */
import { importPKCS8, SignJWT } from 'jose';
import type { Lead } from '../enquiry';
import { leadSummary } from './email';

export const SHEET_COLUMNS = [
  'Received',
  'Name',
  'Email',
  'Phone / WhatsApp',
  'Project type',
  'Location',
  'Approximate size',
  'Budget',
  'Services',
  'Timing',
  'Message',
  'Heard about us',
  'From page',
  'Project page',
  'Referrer',
  'UTM',
  'Marketing opt-in',
  'Consent given',
] as const;

/** One row in SHEET_COLUMNS order; empty strings for missing answers. */
export function leadRow(lead: Lead): string[] {
  const summary = new Map(leadSummary(lead));
  return SHEET_COLUMNS.map((column) =>
    column === 'Received' ? lead.receivedAt : (summary.get(column) ?? ''),
  );
}

async function accessToken(email: string, privateKey: string, fetchImpl: typeof fetch) {
  const key = await importPKCS8(privateKey.replace(/\\n/g, '\n'), 'RS256');
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/spreadsheets' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key);
  const response = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`Google token endpoint responded ${response.status}`);
  return ((await response.json()) as { access_token: string }).access_token;
}

export async function appendToSheet(
  opts: { sheetId: string; email: string; privateKey: string; range?: string },
  lead: Lead,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const token = await accessToken(opts.email, opts.privateKey, fetchImpl);
  const range = encodeURIComponent(opts.range ?? 'Leads!A1');
  const response = await fetchImpl(
    `https://sheets.googleapis.com/v4/spreadsheets/${opts.sheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [leadRow(lead)] }),
    },
  );
  if (!response.ok) throw new Error(`Sheets append responded ${response.status}`);
}
