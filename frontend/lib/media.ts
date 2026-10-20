// utils/media.ts
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export function resolveMediaUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
  if (!API_ORIGIN) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}