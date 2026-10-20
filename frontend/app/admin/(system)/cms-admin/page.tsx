// app/admin/website/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAdminWebsiteConfig,
  useUpdateSectionVisibility,
} from "@/hooks/useWebsiteAdmin";
import type { AdminWebsiteConfig, HideableSection, SectionKey } from "@/types/website";
import { NavbarEditor } from "@/components/website/NavbarEditor";
import { HeroSlidesEditor } from "@/components/website/HeroSlidesEditor";
import { AboutEditor } from "@/components/website/AboutEditor";
import { FeaturesEditor } from "@/components/website/FeaturesEditor";
import { ServicesEditor } from "@/components/website/ServicesEditor";
import { MerchandiseEditor } from "@/components/website/MerchandiseEditor";
import { EventsEditor } from "@/components/website/EventsEditor";
import { PricingEditor } from "@/components/website/PricingEditor";
import { ContactEditor } from "@/components/website/ContactEditor";
import { FooterEditor } from "@/components/website/FooterEditor";
import { Switch } from "@/components/ui/switch";
const SECTION_ORDER: SectionKey[] = [
  "navbar",
  "heroSlides",
  "about",
  "features",
  "services",
  "merchandise",
  "events",
  "pricing",
  "contact",
  "footer",
];

const SECTION_LABELS: Record<SectionKey, string> = {
  navbar: "Navbar",
  heroSlides: "Hero Slides",
  heroVideo: "Hero Video",
  about: "About",
  features: "Features",
  services: "Services",
  merchandise: "Merchandise",
  events: "Events",
  pricing: "Pricing",
  contact: "Contact",
  footer: "Footer",
};

// Must match HIDEABLE_SECTIONS in controllers/mainWebsiteController.js exactly.
const HIDEABLE_SECTIONS: HideableSection[] = [
  "heroSlides",
  "about",
  "features",
  "services",
  "merchandise",
  "events",
  "pricing",
  "contact",
];

function isHideable(section: SectionKey): section is HideableSection {
  return (HIDEABLE_SECTIONS as SectionKey[]).includes(section);
}

// Animation variants — mirrors the billings dashboard motion language
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
} as const;

const navItem = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
} as const;

function VisibilityToggle({ section, visible }: { section: HideableSection; visible: boolean }) {
  const { mutate, isPending } = useUpdateSectionVisibility();

  return (
    <Switch
      checked={visible}
      disabled={isPending}
      onClick={(e) => e.stopPropagation()}
      onCheckedChange={(checked) => mutate({ section, visible: checked })}
      title={visible ? "Visible on site — click to hide" : "Hidden from site — click to show"}
      className={`data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-gray-300 ${
        isPending ? "opacity-50" : ""
      }`}
    />
  );
}

function EditorForSection({ section, config }: { section: SectionKey; config: AdminWebsiteConfig }) {
  switch (section) {
    case "navbar":
      return <NavbarEditor key="navbar" initialValue={config.navbar} />;
    case "heroSlides":
      return <HeroSlidesEditor key="heroSlides" initialValue={config.heroSlides}  initialVideo={config.heroVideo}
/>;
    case "about":
      return <AboutEditor key="about" initialValue={config.about} />;
    case "features":
      return <FeaturesEditor key="features" initialValue={config.features} />;
    case "services":
      return <ServicesEditor key="services" initialValue={config.services} />;
    case "merchandise":
      return <MerchandiseEditor key="merchandise" initialValue={config.merchandise} />;
    case "events":
      return <EventsEditor key="events" initialValue={config.events} />;
    case "pricing":
      return <PricingEditor key="pricing" initialValue={config.pricing} />;
    case "contact":
      return <ContactEditor key="contact" initialValue={config.contact} />;
    case "footer":
      return <FooterEditor key="footer" initialValue={config.footer} />;
    default:
      return null;
  }
}

export default function WebsiteAdminPage() {
  const { data: config, isLoading, isError, refetch } = useAdminWebsiteConfig();
  const [activeSection, setActiveSection] = useState<SectionKey>("navbar");

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 text-sm text-gray-500"
        >
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
          Loading website configuration…
        </motion.div>
      </div>
    );
  }

  if (isError || !config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm"
        >
          <p className="mb-3 text-sm text-red-600">Couldn't load the website configuration.</p>
          <button
            onClick={() => refetch()}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

return (
  <div className="flex h-screen overflow-hidden bg-gray-50">
    <aside className="w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-1 px-2 text-xl font-semibold text-slate-800"
      >
        Website CMS
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="mb-4 px-2 text-xs text-slate-400"
      >
        Manage your site's content and sections
      </motion.p>

      <motion.nav variants={container} initial="hidden" animate="show" className="space-y-1">
        {SECTION_ORDER.map((section) => (
          <motion.div
            key={section}
            variants={navItem}
            whileHover={{ x: 2, transition: { duration: 0.15 } }}
            onClick={() => setActiveSection(section)}
            className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors duration-150 ${
              activeSection === section
                ? "bg-indigo-50 font-medium text-indigo-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span>{SECTION_LABELS[section]}</span>
            {isHideable(section) && (
              <VisibilityToggle
                section={section}
                visible={config.visibility?.[section] !== false}
              />
            )}
          </motion.div>
        ))}
      </motion.nav>

      <p className="mt-4 px-2 text-xs text-gray-400">
        Navbar and footer are always visible and can't be hidden.
      </p>
    </aside>

    <main className="flex-1 overflow-y-auto p-4">
      <div className="mx-auto  pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="rounded-xl border border-gray-200 bg-white p-6"
          >
            <EditorForSection section={activeSection} config={config} />
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  </div>
);
}