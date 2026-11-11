export function isTrialExpired(
  trialActive?: boolean | null,
  trialExpiresAt?: string | null,
) {
  if (!trialActive || !trialExpiresAt) return false;
  return new Date(trialExpiresAt).getTime() < Date.now();
}

/** Zile întregi rămase din testare (minimum 0). */
export function trialDaysLeft(trialExpiresAt: string | null | undefined, now = Date.now()) {
  if (!trialExpiresAt) return 0;
  const expires = new Date(trialExpiresAt).getTime();
  if (!Number.isFinite(expires)) return 0;
  return Math.max(0, Math.ceil((expires - now) / 86400000));
}
