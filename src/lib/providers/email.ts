/**
 * Transactional email through Resend's REST API (plain fetch, no SDK), and the two messages:
 * the studio notification (every answer) and a short plain confirmation to the enquirer.
 */
import type { Lead } from '../enquiry';
import { LOCATIONS, PROJECT_TYPES, SERVICE_CHOICES, SOURCES, TIMINGS } from '../enquiry-schema';

export interface EmailMessage {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
}

export async function sendWithResend(
  apiKey: string,
  message: EmailMessage,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: message.from,
      to: [message.to],
      reply_to: message.replyTo,
      subject: message.subject,
      text: message.text,
    }),
  });
  if (!response.ok) throw new Error(`Resend responded ${response.status}`);
}

/** Readable labels for a lead, shared by the email and the lead store. */
export function leadSummary(lead: Lead): [string, string][] {
  const location =
    lead.location === 'elsewhere' && lead.locationOther
      ? `Elsewhere: ${lead.locationOther}`
      : LOCATIONS[lead.location];
  const rows: [string, string | undefined][] = [
    ['Name', lead.name],
    ['Email', lead.email],
    ['Phone / WhatsApp', lead.phone],
    ['Project type', PROJECT_TYPES[lead.projectType]],
    ['Location', location],
    ['Approximate size', lead.size],
    ['Budget', lead.budget],
    ['Services', lead.services.map((s) => SERVICE_CHOICES[s]).join(', ')],
    ['Timing', TIMINGS[lead.timing]],
    ['Message', lead.message],
    ['Heard about us', lead.source && SOURCES[lead.source]],
    ['From page', lead.sourcePage],
    ['Project page', lead.project],
    ['Referrer', lead.referrer],
    [
      'UTM',
      [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(' / ') || undefined,
    ],
    ['Marketing opt-in', lead.marketing ? 'Yes' : 'No'],
    ['Consent given', `${lead.consentAt} (privacy notice ${lead.noticeVersion})`],
  ];
  return rows.filter((row): row is [string, string] => !!row[1]);
}

export function studioNotification(lead: Lead, from: string, to: string): EmailMessage {
  const where =
    lead.location === 'elsewhere' ? (lead.locationOther ?? 'Elsewhere') : LOCATIONS[lead.location];
  return {
    from,
    to,
    replyTo: lead.email,
    subject: `New enquiry: ${lead.name} · ${PROJECT_TYPES[lead.projectType]} · ${where}`,
    text: leadSummary(lead)
      .map(([label, value]) => `${label}: ${value}`)
      .join('\n'),
  };
}

export function enquirerConfirmation(
  lead: Lead,
  from: string,
  studioName: string,
  replyPromise: string | null,
): EmailMessage {
  const first = lead.name.split(/\s+/)[0];
  return {
    from,
    to: lead.email,
    subject: `We have received your enquiry · ${studioName}`,
    text: [
      `Dear ${first},`,
      '',
      `Thank you for getting in touch with ${studioName}. Your enquiry has reached the studio.`,
      ...(replyPromise ? ['', replyPromise] : []),
      '',
      'If anything changes in the meantime, simply reply to this email.',
      '',
      studioName,
    ].join('\n'),
  };
}
