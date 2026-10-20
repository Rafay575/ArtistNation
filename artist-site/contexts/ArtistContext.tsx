"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type ArtistSettings = {
  site_name: string;
  primary_color: string;
  logo_url: string | null;
  logo_url_dark: string | null;
  logo_url_light: string | null;
  favicon_url: string | null;
  footer_data?: any;
  nav_links?: Array<{
    label: string;
    href: string;
    type: string;
  }>;
};

type ArtistData = {
  settings: ArtistSettings;
  menu: { name: string; href: string }[];
};

const DEFAULT_SETTINGS: ArtistSettings = {
  site_name: "Artist Site",
  primary_color: "#5D2FDB",
  logo_url: null,
  logo_url_dark: null,
  logo_url_light: null,
  favicon_url: null,
  footer_data: {
    contact: "0665 Broadway NY, New York 10001 United States of America<br><b>855 100 4444</b><br>info@barber.com",
    socials: [
      { platform: "facebook", url: "#" },
      { platform: "instagram", url: "#" },
      { platform: "x", url: "#" },
    ],
    subscribeText: "Subscribe & follow",
    subscribeEnabled: true,
  },
  nav_links: [{ label: "Home", href: "/", type: "page" }],
};

const DEFAULT_ARTIST_DATA: ArtistData = {
  settings: DEFAULT_SETTINGS,
  menu: DEFAULT_SETTINGS.nav_links!.map((link) => ({
    name: link.label,
    href: link.href,
  })),
};

const ArtistContext = createContext<ArtistData | null>(null);

export function ArtistProvider({
  children,
  subdomain,
}: {
  children: ReactNode;
  subdomain: string;
}) {
  const { data, isLoading, error } = useQuery<ArtistData>({
    queryKey: ["artist", subdomain],
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/public/${subdomain}/data`;
      const res = await axios.get(url);
      const apiData = res.data;

      // Transform nav_links to the existing menu format
      const navLinks = apiData.settings?.nav_links || [];
      const menu = navLinks.map((link: any) => ({
        name: link.label,
        href: link.href,
      }));

      return {
        settings: {
          site_name: apiData.settings.site_name || DEFAULT_SETTINGS.site_name,
          primary_color: apiData.settings.primary_color || DEFAULT_SETTINGS.primary_color,
          logo_url: apiData.settings.logo_url || null,
          logo_url_dark: apiData.settings.logo_url_dark || null,
          logo_url_light: apiData.settings.logo_url_light || null,
          favicon_url: apiData.settings.favicon_url || null,
          footer_data: apiData.settings.footer_data || DEFAULT_SETTINGS.footer_data,
          nav_links: apiData.settings.nav_links || [],
        },
        menu: menu.length > 0 ? menu : DEFAULT_ARTIST_DATA.menu,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: !!subdomain,
  });

  if (isLoading) {
    return <div className="h-16" />;
  }

  const value = data || DEFAULT_ARTIST_DATA;

  return (
    <ArtistContext.Provider value={value}>{children}</ArtistContext.Provider>
  );
}

export function useArtist() {
  const ctx = useContext(ArtistContext);
  if (!ctx) return DEFAULT_ARTIST_DATA;
  return ctx;
}