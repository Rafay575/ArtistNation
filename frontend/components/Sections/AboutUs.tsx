"use client";
import Image from "next/image";
import { Music } from "lucide-react";
import { useWebsiteConfig } from "@/hooks/useWebsiteConfig";
import type { ArtistCard as ArtistCardType } from "@/types/website";

function ArtistCard({ item }: { item: ArtistCardType }) {
  return (
    <div className="relative h-160 w-full flex-shrink-0 overflow-hidden bg-gray-900">
      <Image
        src={item.src}
        alt={item.name}
        fill
        className="object-cover"
        unoptimized
      />
    </div>
  );
}

function AboutSkeleton() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="aspect-[4/3] w-full animate-pulse rounded-md bg-gray-100 lg:aspect-[5/4]" />
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="h-24 w-full animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    </section>
  );
}

export default function AboutUs() {
  const { data: config, isLoading } = useWebsiteConfig();

  if (isLoading) return <AboutSkeleton />;

  const about = config?.about;

  // Hidden via the admin visibility toggle, or the config failed to load —
  // either way, render nothing rather than crashing on null fields.
  if (!about) return null;

  const { title, heading, description1, founderTitle, founderBio, image, ctaText, artistCards } = about;

  return (
    <>
      <section id="about" className="w-full bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:px-8">
          {/* Image */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md lg:aspect-[5/4]">
            <Image
              src={image}
              alt={heading}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>

          {/* Copy */}
          <div>
            <p className="text-2xl italic text-teal-500">{title}</p>
            <h2 className="mt-2 text-4xl text-slate-900 sm:text-5xl">{heading}</h2>
            <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-slate-500">
              <p>{description1}</p>
              <p>
                <span className="text-teal-600 font-medium">{founderTitle}</span>
                <br />
                {founderBio}
              </p>
            </div>
            <div className="mt-8">
              <ul className="space-y-3 mb-3">
                <li className="flex items-center gap-3 text-sm font-medium">
                  <Music className="h-4 w-4 text-purple-300" />
                  <span>Your Stage</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-medium">
                  <Music className="h-4 w-4 text-purple-300" />
                  <span>Your Brand</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-medium">
                  <Music className="h-4 w-4 text-purple-300" />
                  <span>Your Future</span>
                </li>
              </ul>
              <button className="mt-4 rounded-md bg-orange-400 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-500">
                {ctaText}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-20 border-t border-gray-100 pt-16">
        {/* Mobile slider */}
        <div className="mt-10 -mx-4 flex snap-x snap-mandatory overflow-x-auto px-4 pb-4 sm:hidden">
          {artistCards.map((item, idx) => (
            <div key={idx} className="w-[100%] flex-shrink-0 snap-center">
              <ArtistCard item={item} />
            </div>
          ))}
        </div>

        {/* Desktop grid */}
        <div className="mt-10 hidden grid-cols-4 gap-0 sm:grid">
          {artistCards.map((item, idx) => (
            <ArtistCard key={idx} item={item} />
          ))}
        </div>
      </div>
    </>
  );
}