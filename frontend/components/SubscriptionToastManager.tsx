"use client";
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock3, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
export default function SubscriptionBanner() {
 const user=useAppSelector(state=>state.auth.user);
 const {data,isError}=useQuery({queryKey:['billingStatus',user?.id],enabled:!!user&&!user.isAdmin,queryFn:async()=> (await api.get('/api/billing/status')).data,refetchInterval:60000,refetchOnWindowFocus:true});
 if(!user||user.isAdmin||(!data&&!isError)) return null;
 const format=(date?:string)=>date?new Date(date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'your billing date';
 const expired=data&&data.state!=='active';
 const canceled=!!data?.cancel_at_period_end||data?.status==='pending_cancel';
 const paymentIssue=['past_due','unpaid'].includes(data?.stripe_status);
 const trial=data?.status==='trialing';
 const warning=expired||canceled||paymentIssue||isError;
 const title=isError?'Billing status needs checking':expired?'Your website is paused':canceled?'Automatic renewal is canceled':paymentIssue?'Your payment needs attention':trial?'Your ArtistNation trial is active':'Your subscription is active';
 const message=isError?'Open billing to refresh your subscription status.':expired?`Renew before ${format(data.graceEnd)} to keep your website data and subdomain.`:canceled?`Access continues through ${format(data.paidThrough)}. Restore renewal in billing to keep your site online.`:paymentIssue?`Update your payment details. Your confirmed access continues through ${format(data.paidThrough)}.`:trial?`Your trial ends ${format(data.paidThrough)}. Your selected plan will then renew automatically.`:`Paid through ${format(data.paidThrough)}.`;
 const Icon=warning?AlertTriangle:trial?Clock3:CheckCircle2;
 return <div role="status" className={`sticky top-0 z-30 w-full border-b px-4 py-3 sm:px-6 ${warning?'border-amber-200 bg-amber-50 text-amber-950':'border-emerald-200 bg-emerald-50 text-emerald-950'}`}>
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
   <div className="flex min-w-0 items-start gap-3"><Icon className="mt-0.5 h-5 w-5 shrink-0"/><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs leading-relaxed sm:text-sm">{message}</p></div></div>
   <Link href="/admin/billings" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-current/20 bg-white/70 px-3 py-2 text-xs font-semibold hover:bg-white">Manage billing <ArrowRight className="h-3.5 w-3.5"/></Link>
  </div>
 </div>;
}
