"use client";
import React, { useState } from "react";

// Components
import HeroSection from "@/components/Sections/Header";
import AboutUs from "@/components/Sections/AboutUs";
import Pricing from "@/components/Sections/Pricing";
import Contact from "@/components/Sections/Contact";
import Footer from "@/components/Sections/Footer";
import Features from "@/components/Sections/features";
import Services from "@/components/Sections/Services";
import Merchandise from "@/components/Sections/Merchandise";
import Events from "@/components/Sections/events";

export default function Landing() {
  const [newPlan, setNewPlan] = useState<string | null>(null);

  const planSelectHandler = (plan: string) => {
    if (plan) {
      setNewPlan(plan);
    }
  };

  return (
    <>
      <div id="home">
        <HeroSection />
      </div>

      <div id="about">
        <AboutUs />
      </div>

      <div id="features">
        <Features />
      </div>

      <div id="services">
        <Services />
      </div>

      <div id="merchandise">
        <Merchandise />
      </div>

      <div id="events">
        <Events />
      </div>

      <div id="pricing">
        <Pricing />
      </div>

      <div id="contact">
        <Contact />
      </div>

      <Footer />
    </>
  );
}