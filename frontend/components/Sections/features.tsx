"use client";
import React from "react";
import { useWebsiteConfig } from "@/hooks/useWebsiteConfig";

function FeaturesSkeleton() {
  return (
    <section className="relative bg-white z-0">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
        <div className="mx-auto mb-16 max-w-2xl text-center space-y-4">
          <div className="mx-auto h-6 w-32 animate-pulse rounded-full bg-gray-100" />
          <div className="mx-auto h-10 w-3/4 animate-pulse rounded bg-gray-100" />
          <div className="mx-auto h-4 w-1/2 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="min-h-[380px] animate-pulse rounded-3xl bg-gray-100" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function FeaturesSection() {
  const { data: config, isLoading } = useWebsiteConfig();

  if (isLoading) return <FeaturesSkeleton />;

  const features = config?.features;

  // Hidden via the admin visibility toggle, or the config failed to load.
  if (!features) return null;

  const { tag, heading, subtext, items } = features;

  return (
    <section
      id="features"
      className="relative bg-white z-0"   // ensures it stays below the fixed navbar (z-[99])
    >
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-16">
        {/* Heading */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="mb-5 inline-block rounded-full border border-purple-900/20 bg-purple-900/5 px-4 py-2 text-xs font-extrabold uppercase tracking-[2px] text-[#4b007d]">
            {tag}
          </span>
          <h2 className="mb-5 text-4xl font-black leading-tight tracking-tight text-gray-900 sm:text-5xl">
            {heading}
          </h2>
          <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
            {subtext}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ title, description, icon }) => (
            <div
              key={title}
              className="group relative min-h-[380px] overflow-hidden rounded-3xl border border-white/20 bg-[#4b007d] p-10 shadow-lg shadow-purple-900/30 transition-all duration-500 ease-out hover:-translate-y-3 hover:border-purple-900/15 hover:bg-purple-900/[0.03] hover:shadow-purple-900/10"
            >
              {/* subtle sheen on hover */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              {/* icon */}
              <div className="relative z-10 mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-4xl transition-all duration-300 group-hover:bg-purple-900/10">
                {icon}
              </div>

              <h3 className="relative z-10 mb-4 text-2xl font-extrabold leading-snug text-white transition-colors duration-300 group-hover:text-gray-900">
                {title}
              </h3>

              <p className="relative z-10 mb-7 text-[15.8px] leading-loose text-white/80 transition-colors duration-300 group-hover:text-gray-600">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}