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

/** Numărul de test (0770 111 111) singurul care poate comanda de la un restaurant în perioada de testare. */
export const TEST_ACCOUNT_PHONE_DIGITS = "40770111111";

export function isTestAccountPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits === TEST_ACCOUNT_PHONE_DIGITS || digits === "0770111111";
}

export const TRIAL_ORDER_MESSAGE =
  "Restaurantul este în perioadă de testare. Comenzile se pot trimite doar cu contul de test: ieși din cont și intră cu telefonul 0770 111 111, codul 123456.";
