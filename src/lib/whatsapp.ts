/**
 * WhatsApp click-to-chat links: https://wa.me/<number>?text=<urlencoded>
 * The number must be in full international format without "+", spaces, dashes or a leading
 * zero (re-check WhatsApp's help page before launch).
 */

const VALID_NUMBER = /^[1-9]\d{7,14}$/;

export function isValidWhatsAppNumber(number: string): boolean {
  return VALID_NUMBER.test(number);
}

export function whatsappUrl(number: string, text?: string): string {
  if (!isValidWhatsAppNumber(number)) {
    throw new Error(
      `Invalid WhatsApp number "${number}": use digits only, country code first, no "+" or leading zero.`,
    );
  }
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${number}${query}`;
}
