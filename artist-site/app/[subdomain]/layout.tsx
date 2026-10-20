import { ArtistProvider } from "@/contexts/ArtistContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/contexts/CartContext";

export default async function ArtistLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>; // 👈 params is now a Promise
}) {
  const { subdomain } = await params; // 👈 must await it

  return (
    <ArtistProvider subdomain={subdomain}>
      <CartProvider>
        {children}
        <Footer />
      </CartProvider>
    </ArtistProvider>
  );
}
