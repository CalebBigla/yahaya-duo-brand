/**
 * Phone number helpers for WhatsApp links (pure functions, no side effects).
 *
 * wa.me expects the full international number as digits only, with no "+",
 * no leading zeros and no spaces: https://wa.me/2348031234567
 */

const NIGERIA_CODE = '234';

/**
 * Normalise a phone number to E.164 digits without the "+", as wa.me needs it.
 * Returns null when the number cannot be turned into a valid international number.
 *
 * Nigerian formats:
 *   0803 123 4567      -> 2348031234567
 *   +234 803 123 4567  -> 2348031234567
 *   234-803-123-4567   -> 2348031234567
 *   00234 803 123 4567 -> 2348031234567
 *   +234 (0) 803 ...   -> 2348031234567   (stray trunk 0 after the country code)
 *   803 123 4567       -> 2348031234567   (10-digit mobile without the leading 0)
 * Other countries must be written with "+" or "00" and the country code,
 * e.g. +44 7700 900123 -> 447700900123.
 */
export function normalizePhoneForWhatsApp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Only digits, spaces and common separators are allowed
  if (!/^[+\d\s().\-/]+$/.test(trimmed)) return null;

  const hasPlus = trimmed.startsWith('+');
  let digits = trimmed.replace(/\D/g, '');
  let international = hasPlus;

  if (!hasPlus && digits.startsWith('00')) {
    digits = digits.slice(2);
    international = true;
  }

  if (international || digits.startsWith(NIGERIA_CODE)) {
    if (digits.startsWith(NIGERIA_CODE)) {
      let national = digits.slice(NIGERIA_CODE.length);
      if (national.length === 11 && national.startsWith('0')) national = national.slice(1);
      return isValidNigerianNational(national) ? NIGERIA_CODE + national : null;
    }
    // Other country: E.164 allows up to 15 digits, and the country code never starts with 0
    return digits.length >= 8 && digits.length <= 15 && !digits.startsWith('0') ? digits : null;
  }

  // No country code: treat it as a Nigerian number
  if (digits.length === 11 && digits.startsWith('0')) {
    const national = digits.slice(1);
    return isValidNigerianNational(national) ? NIGERIA_CODE + national : null;
  }
  if (digits.length === 10 && /^[789]/.test(digits)) {
    return NIGERIA_CODE + digits;
  }
  return null;
}

/** Nigerian national significant number: 10 digits, not starting with 0. */
function isValidNigerianNational(national: string): boolean {
  return /^[1-9]\d{9}$/.test(national);
}

/** https://wa.me/<number>?text=<message>, or null when the number is not usable. */
export function buildWhatsAppUrl(rawPhone: string | null | undefined, message: string): string | null {
  const phone = normalizePhoneForWhatsApp(rawPhone);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
