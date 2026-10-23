"use client";
import { useSearchParams } from 'next/navigation';
export default function UnavailableContent() {
 const params=useSearchParams();
 const grace=params.get('state')==='grace';
 const deadline=params.get('deadline');
 const end=deadline?new Date(deadline):null;
 const admin=(process.env.NEXT_PUBLIC_ADMIN_URL||'https://test.artistnation.studio').replace(/\/$/,'');
 return <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
  <section className="max-w-lg w-full rounded-2xl bg-white p-10 text-center shadow-xl">
   <h1 className="text-2xl font-semibold text-slate-900">{grace?'Website temporarily paused':'Website unavailable'}</h1>
   <p className="mt-4 text-slate-600">{grace?'This website is paused because its subscription has expired. The owner can renew to bring it back online.':'This website is not currently available.'}</p>
   {grace&&<div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
    Account owners have 30 days from expiry to renew. After that, website data is removed and the email and subdomain are released.
    {end&&!Number.isNaN(end.getTime())&&<p className="mt-2 font-medium">Renew before {end.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'})} (UTC).</p>}
   </div>}
   <a href={admin+'/admin/billings'} className="mt-6 block rounded-lg bg-purple-700 px-5 py-3 text-white">Owner sign in and renew</a>
  </section>
 </main>;
}
