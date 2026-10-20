"use client";
import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/effect-fade";
import Image from "next/image";
import { Link } from "react-scroll";

import TopNavbar from "@/components/Nav/TopNavbar";
import PlayIcon from "@/assets/img/play-btn.png";
import { useWebsiteConfig } from "@/hooks/useWebsiteConfig";

export default function HeroSection({
  selectedPlan,
}: {
  selectedPlan?: string | null;
}) {
  const { data: config, isLoading, isError } = useWebsiteConfig();
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperRef, setSwiperRef] = useState<SwiperType | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);

  const openVideo = () => setVideoOpen(true);
  const closeVideo = () => setVideoOpen(false);

  const slides = config?.heroSlides;
  const heroVideo = config?.heroVideo;

  // ✅ Helper: any YouTube URL → embed URL
  const toYouTubeEmbed = (url?: string | null): string | null => {
    if (!url) return null;
    const t = url.trim();
    if (!t) return null;
    if (t.includes('/embed/')) return t;
    const short = t.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
    if (short) return `https://www.youtube.com/embed/${short[1]}`;
    const watch = t.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
    if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
    return t;
  };

  // Loading state
  if (isLoading) {
    return (
      <section
        className="relative flex items-center justify-center bg-black"
        style={{ minHeight: "100vh", height: "100vh" }}
      >
        <TopNavbar selectedPlan={selectedPlan} />
        <div className="animate-pulse text-white/40 text-sm">Loading…</div>
      </section>
    );
  }

  // No slides or hidden
  if (isError || !slides || slides.length === 0) {
    return (
      <section className="relative bg-black" style={{ minHeight: "20vh" }}>
        <TopNavbar selectedPlan={selectedPlan} />
      </section>
    );
  }

  // ✅ Compute which video to render
  const videoType = heroVideo?.type ?? 'youtube';
  const rawUrl = heroVideo?.url ?? '';
  const fileUrl = heroVideo?.file ?? '';

  const embedUrl = videoType === 'youtube' ? toYouTubeEmbed(rawUrl) : null;
  const hasFile = videoType === 'file' && !!fileUrl;
  const hasAnyVideo = !!embedUrl || hasFile;

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-fade-up    { animation: fadeInUp 0.5s ease both; }
        .hero-fade-up-d1 { animation: fadeInUp 0.5s 0.10s ease both; }
        .hero-fade-up-d2 { animation: fadeInUp 0.5s 0.20s ease both; }
        .hero-fade-up-d3 { animation: fadeInUp 0.5s 0.30s ease both; }
        .hero-swiper,
        .hero-swiper .swiper-wrapper,
        .hero-swiper .swiper-slide { height: 100% !important; }
      `}</style>

      <section
        className="relative overflow-x-hidden"
        style={{ minHeight: "100vh", height: "100vh" }}
      >
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          autoplay={{ delay: 4500, disableOnInteraction: false }}
          loop
          speed={1400}
          onSwiper={setSwiperRef}
          onSlideChange={(s) => setActiveIndex(s.realIndex)}
          className="hero-swiper"
          style={{
            position: "absolute", top: 0, left: 0,
            width: "100%", height: "100%", zIndex: 0,
          }}
        >
          {slides.map((slide, i) => (
            <SwiperSlide
              key={i}
              style={{ position: "relative", width: "100%", height: "100%" }}
            >
              <Image
                src={slide.bg}
                alt={slide.bgAlt}
                fill
                unoptimized={true}
                sizes="100vw"
                style={{ objectFit: "cover", objectPosition: "center" }}
              />
              <div
                style={{
                  position: "absolute", inset: 0,
                  background:
                    "linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.42) 55%, transparent 100%)",
                }}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <div
          className="relative flex flex-col"
          style={{ zIndex: 10, minHeight: "100vh" }}
        >
          <TopNavbar selectedPlan={selectedPlan} />

          <div className="flex-1 flex items-center w-[80%] mx-auto pb-20 pt-32">
            <div className="max-w-2xl w-full">
              <h1
                key={`h-${activeIndex}`}
                className="hero-fade-up text-white font-extrabold text-4xl mt-5 md:text-7xl leading-tight"
              >
                {slides[activeIndex].headline}
              </h1>
              <p
                key={`p-${activeIndex}`}
                className="hero-fade-up-d1 mt-8 text-base leading-relaxed"
                style={{ color: "#B6B4BC" }}
              >
                {slides[activeIndex].subtext}
              </p>
              <div
                key={`cta-${activeIndex}`}
                className="hero-fade-up-d2 flex items-center gap-5 mt-14"
              >
                <Link
                  to="pricing"
                  smooth
                  offset={-80}
                  className="bg-white text-gray-900 font-semibold text-sm px-6 py-3 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {slides[activeIndex].cta}
                </Link>

                {/* Watch Video — only if a video is configured */}
                {hasAnyVideo && (
                  <button
                    onClick={openVideo}
                    className="flex items-center gap-3 cursor-pointer group bg-transparent border-0 p-0"
                  >
                    <Image
                      src={PlayIcon}
                      alt="Play video"
                      className="w-11 h-11 rounded-lg"
                    />
                    <span className="text-white text-xs group-hover:text-gray-300 transition-colors">
                      Watch Video
                    </span>
                  </button>
                )}
              </div>

              <div className="hero-fade-up-d3 flex items-center justify-between mt-10">
                <div className="flex gap-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => swiperRef?.slideToLoop(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      className="block h-1 rounded-full transition-all duration-500 focus:outline-none"
                      style={{
                        width: i === activeIndex ? "2rem" : "0.75rem",
                        background:
                          i === activeIndex
                            ? "rgba(255,255,255,1)"
                            : "rgba(255,255,255,0.35)",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal — renders iframe OR <video> based on heroVideo.type */}
      {videoOpen && hasAnyVideo && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={closeVideo}
        >
          <div
            className="relative w-[90%] max-w-4xl aspect-video rounded-xl overflow-hidden shadow-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            {embedUrl && !hasFile && (
              <iframe
                width="100%"
                height="100%"
                src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
                title="Video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0"
              />
            )}

            {hasFile && (
              <video
                src={fileUrl}
                controls
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full"
              />
            )}

            <button
              onClick={closeVideo}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
              aria-label="Close video"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}