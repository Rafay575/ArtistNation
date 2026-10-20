"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RxCross1 } from "react-icons/rx";
import { RxHamburgerMenu } from "react-icons/rx";
import { HiOutlineShoppingCart } from "react-icons/hi";
import { useArtist } from "@/contexts/ArtistContext";
import { useCart } from "@/contexts/CartContext";               // 👈 new
import AuthModal from "./AuthModal";
import CartModal from "./CartModal";
import toast from "react-hot-toast";

export default function Navbar() {
  const { menu, settings } = useArtist();
  const { items: cartItems } = useCart();                      // 👈 real cart items

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [mobileHoveredLink, setMobileHoveredLink] = useState<string | null>(null);

  const [authOpen, setAuthOpen] = useState(false);
  const [authView, setAuthView] = useState<"signin" | "signup">("signin");

  const [fanUser, setFanUser] = useState<any>(null);
  const [fanToken, setFanToken] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("fanToken");
    const user = localStorage.getItem("fanUser");
    if (token && user) {
      setFanToken(token);
      setFanUser(JSON.parse(user));
    }
  }, []);

  const handleAuthSuccess = (user: any, token: string) => {
    localStorage.setItem("fanToken", token);
    localStorage.setItem("fanUser", JSON.stringify(user));
    setFanToken(token);
    setFanUser(user);
    setAuthOpen(false);
    toast.success(`Welcome, ${user.fullName || "Fan"}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem("fanToken");
    localStorage.removeItem("fanUser");
    setFanToken(null);
    setFanUser(null);
    setDropdownOpen(false);
    toast.success("Logged out");
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const primaryColor = settings?.primary_color || "#5D2FDB";
  const logoUrl = settings?.logo_url || null;
  const siteName = settings?.site_name || "Artist Site";

  const logoSrc = logoUrl
    ? logoUrl
    : (scrolled || menuOpen ? "/logo-black.png" : "/logo.png");

  const openAuth = (view: "signin" | "signup") => {
    setAuthView(view);
    setAuthOpen(true);
    setMenuOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = fanUser ? getInitials(fanUser.fullName || "Fan") : "";

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 max-w-[100vw] ${
          scrolled || menuOpen
            ? "bg-white shadow-lg"
            : "bg-transparent! border-b border-gray-300/20"
        }`}
      >
        <nav className="mx-auto px-4 lg:px-10">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center shrink-0">
              <Image
                src={logoSrc}
                alt={siteName}
                width={180}
                height={50}
                priority
                unoptimized={true}
                className="w-auto h-10 md:h-12 object-contain"
              />
            </Link>

            <div className="hidden lg:flex items-center xl:gap-7">
              {menu.map((link) => {
                const isHovered = hoveredLink === link.href;
                let textColor;
                if (isHovered) {
                  textColor = "white";
                } else if (scrolled) {
                  textColor = "rgb(55 65 81)";
                } else {
                  textColor = "white";
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium transition px-5 xl:px-8 py-2 rounded-full"
                    style={{
                      color: textColor,
                      backgroundColor: isHovered ? primaryColor : "transparent",
                    }}
                    onMouseEnter={() => setHoveredLink(link.href)}
                    onMouseLeave={() => setHoveredLink(null)}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Auth + Cart */}
            <div className="hidden lg:flex items-center gap-3">
              {fanUser ? (
                <>
                  {/* Cart icon with real badge */}
                  <button
                    onClick={() => setCartOpen(true)}
                    className="relative p-2 rounded-full hover:bg-gray-100 transition"
                  >
                    <HiOutlineShoppingCart size={24} className="text-gray-700" />
                    {cartItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItems.length}
                      </span>
                    )}
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-gray-100 transition"
                    >
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {initials}
                      </div>
                      <span className="text-sm text-gray-700">{fanUser.fullName?.split(" ")[0]}</span>
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <Link
                          href="/orders"
                          onClick={() => {
                            setDropdownOpen(false);
                          
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Orders
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openAuth("signin")}
                    className={`text-sm font-medium px-5 py-2 rounded-md transition ${
                      scrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/10"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openAuth("signup")}
                    className="rounded-md px-8 py-2 text-white font-medium transition duration-300 hover:scale-105 hover:shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden"
              aria-label="Toggle Menu"
              style={{ color: scrolled || menuOpen ? primaryColor : "white" }}
            >
              {menuOpen ? <RxCross1 size={30} /> : <RxHamburgerMenu size={30} />}
            </button>
          </div>

          {/* Mobile Dropdown – unchanged */}
          <div
            className={`lg:hidden absolute left-0 top-full w-full transition-all duration-300 origin-top ${
              menuOpen ? "opacity-100 scale-y-100 visible" : "opacity-0 scale-y-95 invisible"
            }`}
          >
            <div className="bg-white shadow-xl">
              <div className="flex flex-col py-4">
                {menu.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="px-6 py-4 text-gray-800 font-medium border-b border-gray-100 transition"
                    style={{
                      backgroundColor:
                        mobileHoveredLink === link.href ? primaryColor + "20" : "transparent",
                    }}
                    onMouseEnter={() => setMobileHoveredLink(link.href)}
                    onMouseLeave={() => setMobileHoveredLink(null)}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="p-4 space-y-3">
                  {fanUser ? (
                    <>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          toast("Orders feature coming soon");
                        }}
                        className="w-full rounded-md py-3 font-medium text-gray-700 border border-gray-200"
                      >
                        Orders
                      </button>
                      <button
                        onClick={() => {
                          handleLogout();
                          setMenuOpen(false);
                        }}
                        className="w-full rounded-md py-3 font-medium text-red-600 border border-red-200"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => openAuth("signup")}
                        className="w-full rounded-md py-3 text-white font-medium"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Sign Up
                      </button>
                      <button
                        onClick={() => openAuth("signin")}
                        className="w-full rounded-md py-3 font-medium text-gray-700 border border-gray-200"
                      >
                        Sign In
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* ----- Cart Modal ----- */}
      <CartModal
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        primaryColor={primaryColor}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialView={authView}
        logoSrc={logoUrl || "/logo-black.png"}
        siteName={siteName}
        primaryColor={primaryColor}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}