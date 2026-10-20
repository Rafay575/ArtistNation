"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import NextLink from "next/link";
import { Link as ScrollLink } from "react-scroll";
import { useWebsiteConfig } from "@/hooks/useWebsiteConfig";
import { api } from "@/lib/api";

function FooterSkeleton() {
  return (
    <footer className="pt-12 sm:pt-16 text-center w-full bg-gray-900">
      <div className="w-full max-w-[1220px] mx-auto px-5 sm:px-8 space-y-8">
        <div className="mx-auto h-8 w-40 animate-pulse rounded bg-white/10" />
        <div className="mx-auto h-4 w-64 animate-pulse rounded bg-white/10" />
        <div className="mx-auto h-12 w-full max-w-[600px] animate-pulse rounded bg-white/10" />
      </div>
    </footer>
  );
}

export default function Footer() {
  const { data: config, isLoading } = useWebsiteConfig();
  const currentYear = new Date().getFullYear();

  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  if (isLoading || !config) return <FooterSkeleton />;

  const {
    backgroundImage,
    brandName,
    tagline,
    socialIcons,
    subscribePlaceholder,
    subscribeButtonText,
    companyLinks,
    helpLinks,
    contactInfo,
    copyright,
  } = config.footer;

  const handleSubscribe = async () => {
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setSubscribing(true);
    try {
      const response = await api.post("/api/subscribe", { email });
      toast.success(response.data.message || "Subscribed successfully!");
      setEmail("");
    } catch (error: any) {
      const msg = error.response?.data?.error || "Subscription failed. Please try again.";
      toast.error(msg);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer
      className="pt-12 sm:pt-16 text-center w-full bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="w-full max-w-[1220px] mx-auto px-5 sm:px-8">
        {/* Brand & social */}
        <div className="text-center mx-auto mb-8">
          <h1 className="font-unbounded text-[1.5rem] sm:text-[1.68rem] font-semibold text-white m-0">
            {brandName}
          </h1>
          <p className="font-inter text-sm sm:text-base text-white/90 mt-1">
            {tagline}
          </p>
          <div className="flex justify-center gap-5 sm:gap-6 py-5 sm:py-6">
            {socialIcons.map((icon, idx) => (
              <Image
                key={idx}
                src={icon.src}
                alt={icon.alt}
                width={40}
                height={40}
                unoptimized
                className="h-8 sm:h-10 w-auto object-contain"
              />
            ))}
          </div>
        </div>

        {/* Email subscribe */}
        <div className="flex w-full max-w-[600px] mx-auto">
          <input
            type="email"
            placeholder={subscribePlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="py-3 sm:py-4 px-4 sm:px-6 bg-transparent border border-[#D7D7D7] rounded-l-lg w-full font-inter text-xs sm:text-sm text-white placeholder-white/60 outline-none min-w-0"
          />
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={subscribing}
            className="py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-[#050455] to-[#4f057c] text-white font-inter text-xs sm:text-sm font-medium border border-l-0 border-[#d7d7d74d] rounded-r-lg hover:opacity-80 transition-opacity cursor-pointer whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {subscribing ? "Subscribing..." : subscribeButtonText}
          </button>
        </div>

        {/* Links columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 sm:gap-6 my-10 text-left">
          <div className="flex flex-col text-white">
            <span className="font-inter text-sm font-bold mb-1">Company</span>
            {companyLinks.map(({ label, to }) => (
              <ScrollLink
                key={label}
                to={to}
                smooth={true}
                duration={500}
                offset={-80}
                className="text-white/80 hover:text-white transition-colors cursor-pointer my-1.5 font-inter text-sm"
              >
                {label}
              </ScrollLink>
            ))}
          </div>

          <div className="flex flex-col text-white">
            <span className="font-inter text-sm font-bold mb-1">Help & Support</span>
            {helpLinks.map(({ label, to }) => (
              <NextLink
                key={label}
                href={to}
                className="text-white/80 hover:text-white transition-colors cursor-pointer my-1.5 font-inter text-sm"
              >
                {label}
              </NextLink>
            ))}
          </div>

          <div className="flex flex-col text-white col-span-2 md:col-span-1">
            <span className="font-inter text-sm font-bold mb-1">Contact Us</span>
            <p className="font-inter text-sm my-1.5 text-white/80 leading-relaxed">
              {contactInfo.address}
            </p>
            <p className="font-inter text-sm my-1.5 text-white/80">
              {contactInfo.email}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1220px] mx-auto px-5 sm:px-8">
        <div className="border-t border-white/20 w-full flex justify-center">
          <p className="text-white/70 text-xs sm:text-sm text-center py-5 font-inter">
            © {currentYear} {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}