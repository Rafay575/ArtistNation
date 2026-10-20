import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, readServerSession, pageRedirect } from '@/lib/serverSession';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === '/admin' || !pathname.startsWith('/admin/')) return NextResponse.next();
  try {
    const user = await readServerSession(request.cookies.get(SESSION_COOKIE)?.value);
    if (!user) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(url);
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }
    const destination = pageRedirect(pathname, user);
    if (destination) return NextResponse.redirect(new URL(destination, request.url));
    const headers = new Headers(request.headers);
    headers.set('x-artistnation-path', pathname);
    const response = NextResponse.next({ request: { headers } });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch {
    return new NextResponse('Sign-in service temporarily unavailable. Please try again.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
export const config = { matcher: ['/admin/:path*'] };
