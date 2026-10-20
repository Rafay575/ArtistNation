"use client";
import React from "react";
import Image from "next/image";
import { useWebsiteConfig } from "@/hooks/useWebsiteConfig";

function MerchandiseSkeleton() {
  return (
    <section className="flex flex-col md:flex-row items-center justify-center min-h-[840px] py-8 md:py-0 w-full mx-auto px-8 bg-white">
      <div className="w-full md:w-1/2 h-[400px] animate-pulse rounded bg-gray-100" />
      <div className="w-full md:w-1/2 p-4 md:p-12 space-y-6">
        <div className="h-10 w-3/4 animate-pulse rounded bg-gray-100" />
        <div className="h-20 w-full animate-pulse rounded bg-gray-100" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded bg-gray-100" />
        ))}
      </div>
    </section>
  );
}

export default function Merchandise() {
  const { data: config, isLoading } = useWebsiteConfig();

  if (isLoading) return <MerchandiseSkeleton />;

  const merchandise = config?.merchandise;

  // Hidden via the admin visibility toggle, or the config failed to load.
  if (!merchandise) return null;

  const { title, description, mainImage, features } = merchandise;

  return (
    <section
      id="merchandise"
      className="flex flex-col md:flex-row items-center justify-center min-h-[840px] py-8 md:py-0 w-full mx-auto px-8 bg-white"
    >
      {/* Left – Image */}
      <div className="flex flex-col items-center md:items-start order-2 md:order-none">
        <div className="relative w-full h-auto">
          <Image
            src={mainImage}
            alt="Merchandise"
            width={500}
            height={500}
            unoptimized
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* Right – Content */}
      <div className="w-full md:w-1/2 p-4 md:p-12">
        <h1 className="font-extrabold text-[2.5rem] text-[#111111]">{title}</h1>
        <p className="my-8 font-['Inter'] text-base font-normal leading-[25px] text-left text-[#514D4D]">
          {description}
        </p>

        {/* Features list */}
        <div>
          {features.map((feature, i) => (
            <div key={i} className="flex mt-6">
              <Image
                src={feature.icon}
                alt={feature.title}
                width={50}
                height={34}
                unoptimized
                className="w-[50px] h-[34px] object-contain"
              />
              <div className="ml-6">
                <h3 className="font-['Inter'] text-base font-bold leading-[23px] tracking-[0.035em] text-left text-[#111111]">
                  {feature.title}
                </h3>
                <p className="mt-2 font-['Inter'] text-sm font-normal leading-[21px] tracking-normal text-left text-[#514D4D]">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}