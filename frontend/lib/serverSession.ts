export const SESSION_COOKIE = 'artist_session';
export const backendOrigin = () => (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export interface ServerUser {
  id: number; email: string; fullName: string; isAdmin: boolean;
  isVerified: boolean; isOnboarded: boolean; canManage: boolean;
}

export async function readServerSession(token?: string): Promise<ServerUser | null> {
  if (!token) return null;
  const response = await fetch(`${backendOrigin()}/api/session`, {
    headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', redirect: 'error',
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Session service unavailable');
  const data = await response.json();
  if (!Number.isInteger(data.user?.id) || typeof data.user.isAdmin !== 'boolean') return null;
  return data.user;
}

export const adminOnlyPages = ['/admin/users', '/admin/cms-admin', '/admin/contact', '/admin/admin-subscribers', '/admin/payments'];
export function pageRedirect(pathname: string, user: ServerUser): string | null {
  if (adminOnlyPages.some(path => pathname === path || pathname.startsWith(path + '/')) && !user.isAdmin) return '/admin/dashboard';
  if (!user.isAdmin && !user.isOnboarded) return '/onboarding';
  const recovery = ['/admin/billings', '/admin/profile'];
  if (!user.isAdmin && !user.canManage && !recovery.includes(pathname)) return '/admin/billings';
  return null;
}
