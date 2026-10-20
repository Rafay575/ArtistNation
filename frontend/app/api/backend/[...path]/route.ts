import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, backendOrigin } from '@/lib/serverSession';

export const runtime = 'nodejs';

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (path[0] !== 'api' || path.some(segment => segment === '.' || segment === '..' || /[\/\\?#\x00-\x1f]/.test(segment))) {
    return NextResponse.json({ error: 'Invalid API path' }, { status: 400 });
  }
  if (!['GET', 'HEAD'].includes(request.method)) {
    // Cross-site forms cannot send this header; no cross-origin preflight is allowed.
    if (request.headers.get('x-artistnation-request') !== '1') return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
    const origin = request.headers.get('origin');
    const configured = process.env.FRONTEND_URL ? new URL(process.env.FRONTEND_URL).origin : request.nextUrl.origin;
    if (origin && origin !== request.nextUrl.origin && origin !== configured) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }
  const endpoint = '/' + path.join('/');
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (endpoint === '/api/session' && !token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  try {
    const upstream = await fetch(`${backendOrigin()}/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`, {
      method: request.method, headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(150000),
    });
    const type = upstream.headers.get('content-type') || '';
    let accessToken: string | undefined;
    let response: NextResponse;
    if (type.includes('application/json')) {
      const data = await upstream.json();
      if (upstream.ok && ['/api/login', '/api/verify-otp'].includes(endpoint) && typeof data.token === 'string') {
        accessToken = data.token;
        data.token = 'session'; // The browser receives a status marker, never the credential.
      }
      response = NextResponse.json(data, { status: upstream.status });
    } else {
      response = new NextResponse(await upstream.arrayBuffer(), { status: upstream.status, headers: { 'Content-Type': type || 'text/plain' } });
    }
    response.headers.set('Cache-Control', 'no-store');
    const retryAfter = upstream.headers.get('retry-after');
    if (retryAfter) response.headers.set('Retry-After', retryAfter);
    if (accessToken) response.cookies.set(SESSION_COOKIE, accessToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60,
    });
    if (upstream.status === 401 || (endpoint === '/api/logout' && upstream.ok)) response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete('authToken');
    return response;
  } catch {
    return NextResponse.json({ error: 'The service is temporarily unavailable. Please try again.' }, { status: 503 });
  }
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
