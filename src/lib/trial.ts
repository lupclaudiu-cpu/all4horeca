export function isTrialExpired(
  trialActive?: boolean | null,
  trialExpiresAt?: string | null,
) {
  if (!trialActive || !trialExpiresAt) return false;
  return new Date(trialExpiresAt).getTime() < Date.now();
}
