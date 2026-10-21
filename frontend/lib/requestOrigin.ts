function originOf(value: string | null | undefined): string | null {
  try {
    const url = new URL(value || '');
    return ['http:', 'https:'].includes(url.protocol) ? url.origin : null;
  } catch { return null; }
}

export function validBrowserRequest(request: Request, internalOrigin: string): boolean {
  if (request.headers.get('x-artistnation-request') !== '1') return false;
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) return false;
  const origin = originOf(request.headers.get('origin'));
  if (!origin) return false;
  const allowed = new Set([originOf(internalOrigin), originOf(process.env.FRONTEND_URL)]);
  // Nginx supplies Host and X-Forwarded-Proto. Next's internal URL can be HTTP
  // even though the browser is using HTTPS on the public hostname.
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  if (host && !/[\s\/\\@?#]/.test(host) && ['http', 'https'].includes(protocol || '')) {
    allowed.add(originOf(`${protocol}://${host}`));
  }
  return allowed.has(origin);
}
