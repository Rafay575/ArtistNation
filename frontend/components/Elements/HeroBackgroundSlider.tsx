"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import Image from "next/image";

// Import your background images (replace with actual paths)
import bg1 from "@/assets/img/hero-bg.png";   // your existing one
import bg2 from "@/assets/img/hero-bg.png";  // add more as needed
import bg3 from "@/assets/img/bg-services-dash.png";

const backgrounds = [
  { src: bg1, alt: "Hero background 1" },
  { src: bg2, alt: "Hero background 2" },
  { src: bg3, alt: "Hero background 3" },
];

export default function HeroBackgroundSlider() {
  return (
    <Swiper
      modules={[Autoplay, EffectFade]}
      effect="fade"
      autoplay={{ delay: 4000, disableOnInteraction: false }}
      loop={true}
      speed={1200}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    >
      {backgrounds.map((bg, index) => (
        <SwiperSlide key={index}>
          <Image
            src={bg.src}
            alt={bg.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}