"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Preloader from "./Preloader";

export default function AppShell({ children }) {
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const [routeLoading, setRouteLoading] = useState(false);
  const [isFirstRender, setIsFirstRender] = useState(true);

  // initial page-load preloader
  useEffect(() => {
    const finishLoading = () => {
      setFadeOut(true);
      setTimeout(() => setLoading(false), 1000);
    };

    if (document.readyState === "complete") {
      const timer = setTimeout(finishLoading, 1200);
      return () => clearTimeout(timer);
    }

    window.addEventListener("load", finishLoading, { once: true });
    const fallback = setTimeout(finishLoading, 4000);

    return () => {
      window.removeEventListener("load", finishLoading);
      clearTimeout(fallback);
    };
  }, []);

  // route-change overlay
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }

    setRouteLoading(true);
    const timer = setTimeout(() => setRouteLoading(false), 700);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
    {loading && (
  <div
    style={{
      opacity: fadeOut ? 0 : 1,
      pointerEvents: fadeOut ? "none" : "auto",
      transition: "opacity 0.5s ease",
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "#fff",
    }}
  >
    <Preloader />
  </div>
)}

{!loading && routeLoading && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9998,
      background: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(2px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Preloader />
  </div>
)}

      {children}
    </>
  );
}