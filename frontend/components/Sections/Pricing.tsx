"use client";
import React, { useState } from "react";
import { useWebsiteConfig } from "@/hooks/useWebsiteConfig";
import type { PricingPlan } from "@/types/website";

function PricingCard({ plan }: { plan: PricingPlan }) {
  return (
    <div
      className={`
        relative flex flex-col rounded-3xl p-8 overflow-hidden
        transition-all duration-300 group
        bg-gradient-to-br from-[#1e293b]/95 to-[#0f172a]/95
        backdrop-blur-xl
        hover:-translate-y-2
        ${plan.popular
          ? "border-2 border-violet-500 shadow-[0_15px_40px_rgba(139,92,246,0.25)]"
          : "border border-white/8 hover:border-violet-500 hover:shadow-[0_15px_40px_rgba(139,92,246,0.2)]"
        }
      `}
    >
      {/* Popular ribbon */}
      {plan.popular && (
        <div
          className="absolute top-5 -right-10 bg-violet-500 text-white text-xs font-semibold px-12 py-2 rotate-45 tracking-wide"
        >
          {plan.popularLabel}
        </div>
      )}

      {/* Plan name */}
      <h2 className="text-2xl font-bold text-white mb-2">{plan.name}</h2>

      {/* Description */}
      <p className="text-slate-400 text-sm leading-relaxed mb-6 min-h-[56px]">
        {plan.description}
      </p>

      {/* Price */}
      <div className="mb-6">
        <span className="text-5xl font-extrabold text-white">{plan.price}</span>
        {plan.period && (
          <span className="text-slate-400 text-sm ml-1">{plan.period}</span>
        )}
      </div>

      {/* Features */}
      <ul className="flex-1 mb-8 space-y-0 divide-y divide-white/5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-3 py-3 text-slate-200 text-sm">
            <span className="text-green-400 font-bold flex-shrink-0">✓</span>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        className="
          w-full py-4 rounded-2xl font-semibold text-white text-sm
          bg-gradient-to-r from-violet-500 to-indigo-500
          hover:scale-[1.03] hover:opacity-95
          transition-all duration-300
          cursor-pointer
        "
      >
        {plan.cta}
      </button>
    </div>
  );
}

function PricingSkeleton() {
  return (
    <section className="w-full bg-[#0f172a] py-24 px-5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14 space-y-4">
          <div className="mx-auto h-10 w-2/3 max-w-md animate-pulse rounded bg-white/10" />
          <div className="mx-auto h-6 w-1/2 max-w-lg animate-pulse rounded bg-white/10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-[520px] animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Pricing() {
  const { data: config, isLoading } = useWebsiteConfig();
  const [tab, setTab] = useState<"artist" | "label">("artist");

  if (isLoading) return <PricingSkeleton />;

  const pricing = config?.pricing;

  // Hidden via the admin visibility toggle, or the config failed to load.
  if (!pricing) return null;

  const { heading, subtext, artistPlans, labelPlans } = pricing;
  const plans = tab === "artist" ? artistPlans : labelPlans;

  return (
    <section id="pricing" className="w-full bg-[#0f172a] py-24 px-5">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            {heading}
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            {subtext}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center gap-3 mb-12">
          {(["artist", "label"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`
                px-6 py-3 rounded-full text-sm font-medium border transition-all duration-300 cursor-pointer
                ${tab === t
                  ? "bg-violet-500 border-violet-500 text-white"
                  : "bg-[#1e293b] border-slate-600 text-white hover:border-violet-400"
                }
              `}
            >
              {t === "artist" ? "Artist Plans" : "Record Label Plans"}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {plans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>

      </div>
    </section>
  );
}