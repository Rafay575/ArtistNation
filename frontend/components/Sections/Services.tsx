"use client";
import React from "react";
import Image from "next/image";
import { useWebsiteConfig } from "@/hooks/useWebsiteConfig";
import type { IconFeature } from "@/types/website";

function ServicesSkeleton() {
  return (
    <section className="w-full min-h-screen bg-gray-900 flex items-center">
      <div className="w-full lg:w-1/2 py-12 px-6 sm:px-10 lg:pl-16 lg:pr-8 lg:py-16 space-y-6">
        <div className="h-10 w-3/4 animate-pulse rounded bg-white/10" />
        <div className="h-16 w-full animate-pulse rounded bg-white/10" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 w-full animate-pulse rounded bg-white/10" />
        ))}
      </div>
    </section>
  );
}

export default function Services() {
  const { data: config, isLoading } = useWebsiteConfig();

  if (isLoading) return <ServicesSkeleton />;

  const services = config?.services;

  // Hidden via the admin visibility toggle, or the config failed to load.
  if (!services) return null;

  const { title, description, backgroundImage, features } = services;

  return (
    <section
      id="services"
      className="w-full min-h-screen bg-cover bg-center flex flex-col lg:flex-row justify-between items-center"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Left – text content */}
      <div className="flex items-center justify-center w-full lg:w-1/2 py-12 px-6 sm:px-10 lg:pl-16 lg:pr-8 lg:py-16">
        <div className="max-w-xl w-full">
          <h1 className="font-extrabold text-[1.8rem] sm:text-[2.2rem] lg:text-[2.5rem] leading-tight text-white">
            {title}
          </h1>
          <p className="my-6 font-['Inter'] text-sm sm:text-base font-normal leading-[25px] text-[#B6B4BC]">
            {description}
          </p>
          <DashboardFeatures features={features} />
        </div>
      </div>
    </section>
  );
}

function DashboardFeatures({ features }: { features: IconFeature[] }) {
  return (
    <div className="text-white">
      {features.map((feature, i) => (
        <div key={i} className="flex mt-6">
          <div className="w-[60px] h-[37px] flex-shrink-0 max-sm:w-[80%] max-sm:h-auto">
            <Image
              src={feature.icon}
              alt={feature.title}
              width={60}
              height={37}
              unoptimized
              className="w-[60px] h-[37px] object-contain"
            />
          </div>
          <div className="ml-6">
            <h3 className="font-['Inter'] text-base font-bold leading-[23px] tracking-[0.35px] text-left text-white">
              {feature.title}
            </h3>
            <p className="mt-2 font-['Inter'] text-sm font-normal leading-[21px] text-left text-[#B6B4BC]">
              {feature.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}