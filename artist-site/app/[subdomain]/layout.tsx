import { ArtistProvider } from "@/contexts/ArtistContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/contexts/CartContext";
import { redirect } from 'next/navigation';

export default async function ArtistLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>; // 👈 params is now a Promise
}) {
  const { subdomain } = await params; // 👈 must await it
  const base = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');
  const response = await fetch(`${base}/api/site-status/${encodeURIComponent(subdomain)}`, { cache: 'no-store' });
  if (!response.ok && response.status !== 404) throw new Error('Site availability could not be verified');
  const status = await response.json();
  if (status.state !== 'active') {
    const query = new URLSearchParams({ subdomain, state: status.state });
    if (status.graceEnd) query.set('deadline', status.graceEnd);
    redirect(`/unavailable?${query}`);
  }

  return (
    <ArtistProvider subdomain={subdomain}>
      <CartProvider>
        {children}
        <Footer />
      </CartProvider>
    </ArtistProvider>
  );
}
