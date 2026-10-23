import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export async function proxy(request: NextRequest) {
 const host=(request.headers.get('host')||'').split(':')[0];
 const subdomain=host.split('.')[0];
 const path=request.nextUrl.pathname;
 if(path.startsWith('/unavailable')||path.startsWith('/api/')||path.startsWith('/_next/')||path.startsWith('/uploads/')) return NextResponse.next();
 if(host==='localhost'||host==='127.0.0.1'||['artistnation.studio','test.artistnation.studio','www.artistnation.studio'].includes(host)) return NextResponse.next();
 if(['www','admin','api','test'].includes(subdomain)) return NextResponse.next();
 const backend=(process.env.BACKEND_API_URL||process.env.NEXT_PUBLIC_API_URL||'http://localhost:5000').replace(/\/$/,'');
 try {
  const response=await fetch(`${backend}/api/site-status/${encodeURIComponent(subdomain)}`,{cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!response.ok&&response.status!==404) return new NextResponse('Site temporarily unavailable. Please retry.',{status:503,headers:{'Cache-Control':'no-store'}});
  const status=await response.json();
  const url=request.nextUrl.clone();
  if(status.state!=='active') {
   url.pathname='/unavailable'; url.search='';
   url.searchParams.set('subdomain',subdomain);url.searchParams.set('state',status.state);
   if(status.graceEnd) url.searchParams.set('deadline',status.graceEnd);
  } else url.pathname=`/${subdomain}${path==='/'?'':path}`;
  const result=NextResponse.rewrite(url);result.headers.set('Cache-Control','no-store');return result;
 } catch {return new NextResponse('Site temporarily unavailable. Please retry.',{status:503,headers:{'Cache-Control':'no-store'}});}
}
export const config={matcher:['/((?!api|_next/static|_next/image|uploads|favicon.ico).*)']};
