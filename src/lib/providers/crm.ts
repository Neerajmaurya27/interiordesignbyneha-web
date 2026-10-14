/** Post a lead as JSON to a CRM webhook (e.g. a free CRM's inbound form endpoint). */
import type { Lead } from '../enquiry';

export async function postToCrm(url: string, lead: Lead, fetchImpl: typeof fetch = fetch) {
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  if (!response.ok) throw new Error(`CRM webhook responded ${response.status}`);
}
