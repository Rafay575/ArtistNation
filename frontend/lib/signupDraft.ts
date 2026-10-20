export const SIGNUP_DRAFT_KEY = 'artistnation-signup-draft-v1';
export const PENDING_VERIFICATION_KEY = 'artistnation-pending-verification-v1';
const fields = ['fullName', 'email', 'phone', 'businessName', 'subdomain', 'plan', 'billingCycle', 'billingAddress'] as const;

export function readSignupDraft(storage: Pick<Storage, 'getItem'>): Record<string, string> {
  try {
    const value = JSON.parse(storage.getItem(SIGNUP_DRAFT_KEY) || 'null');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(fields.filter(key => typeof value[key] === 'string').map(key => [key, value[key]]));
  } catch { return {}; }
}

export function saveSignupDraft(storage: Pick<Storage, 'setItem'>, data: Record<string, unknown>) {
  storage.setItem(SIGNUP_DRAFT_KEY, JSON.stringify(Object.fromEntries(fields.map(key => [key, typeof data[key] === 'string' ? data[key] : '']))));
}

export function readPendingVerification(storage: Pick<Storage, 'getItem'>): { userId: number; email: string } | null {
  try {
    const value = JSON.parse(storage.getItem(PENDING_VERIFICATION_KEY) || 'null');
    return Number.isInteger(value?.userId) && value.userId > 0 && typeof value.email === 'string' ? value : null;
  } catch { return null; }
}
