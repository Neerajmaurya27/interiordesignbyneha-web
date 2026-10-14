import { describe, expect, it } from 'vitest';
import { isValidWhatsAppNumber, whatsappUrl } from '../../src/lib/whatsapp';
import { whatsappMessage } from '../../src/data/site';

describe('whatsappUrl', () => {
  it('builds a wa.me link with a URL-encoded prefill', () => {
    expect(whatsappUrl('919876543210', whatsappMessage('Home'))).toBe(
      "https://wa.me/919876543210?text=Hello%2C%20I'm%20interested%20in%20discussing%20a%20project.%20(From%3A%20Home)",
    );
  });

  it('omits the query when there is no text', () => {
    expect(whatsappUrl('971501234567')).toBe('https://wa.me/971501234567');
  });

  it.each(['+919876543210', '91 98765 43210', '0501234567', '91-9876543210', '123', ''])(
    'rejects %j',
    (n) => {
      expect(isValidWhatsAppNumber(n)).toBe(false);
      expect(() => whatsappUrl(n)).toThrow(/Invalid WhatsApp number/);
    },
  );
});
