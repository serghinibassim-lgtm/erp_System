
export const DEFAULT_COUNTRY_CODE = "212";

export function normalizePhoneForWhatsApp(
  raw: string | null | undefined,
  defaultCountryCode = DEFAULT_COUNTRY_CODE
): string | null {
  if (!raw) return null;

  let digits = String(raw).replace(/[^0-9]/g, "");
  if (!digits) return null;


  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith(defaultCountryCode)) {
    const rest = digits.slice(defaultCountryCode.length);
    if (/^[5-7]\d{8}$/.test(rest)) return digits;

    if (digits.length >= 11 && digits.length <= 15) return digits;
    return null;
  }


  if (/^0[5-7]\d{8}$/.test(digits)) {
    return defaultCountryCode + digits.slice(1);
  }


  if (/^[5-7]\d{8}$/.test(digits)) {
    return defaultCountryCode + digits;
  }


  if (/^[1-9]\d{9,14}$/.test(digits)) {
    return digits;
  }

  return null;
}


export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message?: string
): string | null {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return null;
  const base = `https://wa.me/${normalized}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const WHATSAPP_INVALID_MESSAGE =
  "Numéro WhatsApp invalide : il manque l'indicatif du pays ou le numéro est erroné. Exemples valides : 0612345678 ou 212612345678.";
