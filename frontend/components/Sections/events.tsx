"use client";
import React from "react";
import Image from "next/image";
import { useWebsiteConfig } from "@/hooks/useWebsiteConfig";

function EventsSkeleton() {
  return (
    <section className="w-full bg-gray-900">
      <div className="mx-auto pl-4 sm:pl-8">
        <div className="flex flex-col lg:flex-row justify-between items-center relative">
          <div className="w-full lg:w-1/2 p-2 sm:p-14 my-[50px] space-y-6">
            <div className="h-10 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="h-20 w-full animate-pulse rounded bg-white/10" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded bg-white/10" />
            ))}
          </div>
          <div className="w-full lg:w-auto h-[400px] animate-pulse rounded bg-white/10" />
        </div>
      </div>
    </section>
  );
}

export default function Events() {
  const { data: config, isLoading } = useWebsiteConfig();

  if (isLoading) return <EventsSkeleton />;

  const events = config?.events;

  // Hidden via the admin visibility toggle, or the config failed to load.
  if (!events) return null;

  const { backgroundImage, title, description, mainImage, bottomIconsImage, features } = events;

  return (
    <section
      id="events"
      className="w-full bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Centered container */}
      <div className="mx-auto pl-4 sm:pl-8">
        {/* Main flex row */}
        <div className="flex flex-col lg:flex-row justify-between items-center relative">
          {/* Left side – Content */}
          <div className="w-full lg:w-1/2 p-2 sm:p-14 my-[50px]">
            <h1 className="font-extrabold text-[2.5rem] text-white">{title}</h1>
            <p className="my-8 font-['Inter'] text-base font-normal leading-[25px] text-left text-[#b6b4bc]">
              {description}
            </p>

            {/* Feature list */}
            <div className="text-white w-full max-w-[420px]">
              {features.map((feature, i) => (
                <div key={i} className="flex mt-12">
                  <Image
                    src={feature.icon}
                    alt={feature.title}
                    width={60}
                    height={44}
                    unoptimized
                    className="w-[60px] h-[44px] object-contain"
                  />
                  <div className="ml-6">
                    <h3 className="font-['Inter'] text-base font-bold leading-[23px] tracking-[0.035em] text-left">
                      {feature.title}
                    </h3>
                    <p className="mt-2 font-['Inter'] text-sm font-normal leading-[21px] text-left text-[#b6b4bc]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side – Image */}
          <div className="flex flex-col w-full lg:w-auto">
            <div className="flex relative z-1 w-full justify-center lg:w-auto lg:justify-start">
              <Image
                src={mainImage}
                alt="Events"
                width={600}
                height={400}
                unoptimized
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* Bottom icons bar */}
        <div className="border-t border-[rgba(182,180,188,0.2)] flex justify-around items-center mx-auto px-8">
          <Image
            src={bottomIconsImage}
            alt="Sponsors / partners"
            width={1200}
            height={80}
            unoptimized
            className="min-h-[80px] w-full h-auto object-contain"
          />
        </div>
      </div>
    </section>
  );
}