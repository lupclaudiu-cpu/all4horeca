/**
 * Curăță un număr de telefon introdus de administrator pentru linkul tel:.
 * Acceptă 07xx xxx xxx, 0040 7xx..., +40 7xx...; returnează null dacă nu pare număr valid.
 */
export function toTelHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.trim().replace(/[\s().-]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (!/^\+?[0-9]{6,15}$/.test(digits)) return null;
  return `tel:${digits}`;
}
