import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createPool } from 'mysql2/promise';
export const runtime = 'nodejs';
// ============================================================
// Database Connection
// ============================================================

const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'artistnation_db',
  waitForConnections: true,
  connectionLimit: 10,
});

// ============================================================
// Helper Functions
// ============================================================

function getHostname(host: string): string {
  return host.split(':')[0]; // Strip port number if present
}

function isRootOrSystemDomain(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === 'artistnation.studio' ||
    hostname === 'test.artistnation.studio'
  );
}

function isReservedSubdomain(subdomain: string): boolean {
  const reserved = ['www', 'admin', 'api', 'test', 'unavailable'];
  return reserved.includes(subdomain);
}

// ============================================================
// Check if subdomain is active
// ============================================================

async function isSubdomainActive(subdomain: string): Promise<boolean> {
  try {
    const [rows] = await pool.query(
      `SELECT is_active FROM businesses WHERE subdomain = ?`,
      [subdomain]
    );

    const business = rows as any[];

    if (business.length === 0) {
      return false; // No business found = inactive
    }

    return business[0].is_active === 1;
  } catch (error) {
    console.error('Subscription check error:', error);
    return false; // On error, treat as inactive
  }
}

// ============================================================
// Middleware
// ============================================================

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const hostname = getHostname(host);
  const subdomain = hostname.split('.')[0];
  const { pathname } = request.nextUrl;

  // ============================================================
  // 1. Local development port redirect
  // ============================================================

  if (host === 'localhost:3001' || host === 'localhost:3001/') {
    return NextResponse.redirect('http://localhost:3000/');
  }

  // ============================================================
  // 2. Skip system paths
  // ============================================================

  const skipPaths = [
    '/api/',
    '/_next/',
    '/favicon.ico',
    '/assets/',
    '/auth/',
    '/unavailable',
  ];

  if (skipPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // ============================================================
  // 3. Check if it's a root or reserved domain
  // ============================================================

  const isRootDomain = isRootOrSystemDomain(hostname);
  const isReserved = isReservedSubdomain(subdomain);

  // Skip subscription check for root domains and reserved subdomains
  if (isRootDomain || isReserved) {
    return NextResponse.next();
  }

  // ============================================================
  // 4. Check subscription status for subdomain
  // ============================================================

  if (hostname.includes('.') && !isRootDomain && !isReserved) {
    // Check if subdomain is active in database
    const isActive = await isSubdomainActive(subdomain);

    // If inactive → show unavailable page
    if (!isActive) {
      const url = request.nextUrl.clone();
      url.pathname = '/unavailable';
      url.searchParams.set('subdomain', subdomain);

      return NextResponse.rewrite(url);
    }

    // ============================================================
    // 5. Multi-tenant Subdomain Rewriting (for active sites)
    // ============================================================

    const url = request.nextUrl.clone();
    // Rewrites ali.artistnation.studio/about to /[subdomain]/about
    url.pathname = `/${subdomain}${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// ============================================================
// Config
// ============================================================

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|uploads|favicon.ico).*)',
  ],
};