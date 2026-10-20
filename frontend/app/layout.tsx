// app/layout.tsx
import type { Metadata } from "next";
import { Unbounded, Inter } from "next/font/google";
import "./globals.css";
import "@/styles/preloader.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Providers } from "./providers";
import { Toaster } from 'react-hot-toast';
import AppShell from "@/components/AppShell";
const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ArtistNation",
  description: "Your art platform",
  icons: {
    icon: "/vector.svg",
    shortcut: "/vector.svg",
    apple: "/vector.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${unbounded.variable} ${inter.variable} antialiased`}>
        <Providers>
          <AppShell>

          {children}
          </AppShell>
           <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}