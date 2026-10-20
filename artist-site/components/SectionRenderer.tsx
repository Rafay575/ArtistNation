"use client";

import HeroSection from "@/components/Hero";
import AboutSection from "@/components/AboutUs";
import MusicSection from "./MusicPlayer";
import EventsSection from "./UpcomingEvents";
import GallerySection from "./Gallery";
import NewsSection from "./LatestNews";
import StoreSection from "./Store";
import ContactSection from "./ContactSection";

// Safely parse section.content whether it arrives as a JSON string
// (double-encoded from the backend) or already as an object.
function parseContent(content: any) {
  if (typeof content !== "string") {
    return content;
  }
  try {
    return JSON.parse(content);
  } catch (err) {
    console.error("Failed to parse section content:", err, content);
    return null;
  }
}

export function SectionRenderer({ sections }: { sections: any[] }) {
  // Filter out unpublished sections
  const publishedSections = sections.filter(
    (section) => section.is_published !== 0 && section.is_published !== false
  );

  if (!publishedSections || publishedSections.length === 0) {
    return <div className="text-center py-20">No content yet.</div>;
  }

  return (
    <>
      {publishedSections.map((section) => {
        const anchorId = section.type;
        const parsedContent = parseContent(section.content);

        const Wrapper = ({ children }: { children: React.ReactNode }) => (
          <div id={anchorId} className="scroll-mt-20">
            {children}
          </div>
        );

        switch (section.type) {
          case "hero":
            return (
              <Wrapper key={section.id}>
                <HeroSection content={parsedContent} />
              </Wrapper>
            );
          case "about":
            return (
              <Wrapper key={section.id}>
                <AboutSection content={parsedContent} />
              </Wrapper>
            );
          case "music":
            return (
              <Wrapper key={section.id}>
                <MusicSection content={parsedContent} />
              </Wrapper>
            );
          case "events":
            return (
              <Wrapper key={section.id}>
                <EventsSection content={parsedContent} />
              </Wrapper>
            );
          case "gallery":
            return (
              <Wrapper key={section.id}>
                <GallerySection content={parsedContent} />
              </Wrapper>
            );
          case "news":
            return (
              <Wrapper key={section.id}>
                <NewsSection content={parsedContent} />
              </Wrapper>
            );
          case "store":
            return (
              <Wrapper key={section.id}>
                <StoreSection content={parsedContent} />
              </Wrapper>
            );
          case "contact":
            return (
              <Wrapper key={section.id}>
                <ContactSection content={parsedContent} />
              </Wrapper>
            );
          default:
            return null;
        }
      })}
    </>
  );
}