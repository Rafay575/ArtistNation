export const SIGNUP_DRAFT_KEY = 'artistnation-signup-draft-v2';
const legacyKeys = ['artistnation-signup-draft-v1', 'artistnation-pending-verification-v1'];
const fields = ['fullName', 'email', 'phone', 'businessName', 'subdomain', 'plan', 'billingCycle', 'billingAddress'] as const;

export function clearLegacySignupData(storage: Pick<Storage, 'removeItem'>) {
  try { for (const key of legacyKeys) storage.removeItem(key); } catch { /* Storage is optional. */ }
}

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

export function clearSignupDraft(storage: Pick<Storage, 'removeItem'>) {
  try { storage.removeItem(SIGNUP_DRAFT_KEY); clearLegacySignupData(storage); } catch { /* Storage is optional. */ }
}

export function clearSignupAfterLogin() {
  try { clearSignupDraft(localStorage); } catch { /* Storage is optional. */ }
  try {
    const channel = new BroadcastChannel('artistnation-account');
    channel.postMessage('signed-in');
    channel.close();
  } catch { /* Server verification binding also prevents cross-tab account mix-ups. */ }
}
