"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-scroll";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/authSlice";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useWebsiteConfig } from "@/hooks/useWebsiteConfig";

interface TopNavbarProps {
  selectedPlan?: string | null;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ selectedPlan }) => {
  const { data: config } = useWebsiteConfig();
  const [scrollY, setScrollY] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  // navbar/footer are always present on WebsiteConfig (never null), but
  // config itself is undefined until the query resolves, so guard both.
  const logo = config?.navbar.logo;
  const companyLinks = config?.footer.companyLinks ?? [];

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      if (menuOpen) closeMenu();
    };
    setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen, closeMenu]);

  const navHeight = scrollY > 100 ? "h-[80px]" : "h-[100px]";
  const navBg = scrollY > 100 || menuOpen ? "bg-[#483E79]" : "";

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || "U";

  const handleLogout = async () => {
    try {
      await api.post('/api/logout');
    } catch (error: any) {
      if (error.response?.status !== 401) { toast.error('Could not sign out. Please retry.'); return; }
    }
    dispatch(logout());
    window.location.replace('/login');
  };

  return (
    <div className="overflow-x-hidden">
      <nav className={`fixed top-0 left-0 z-[99] w-full max-w-[100vw] transition-all duration-300 ease-in-out ${navBg}`}>

        {/* ── DESKTOP ROW (lg+) ── */}
        <div
          className={`hidden lg:flex w-[80%] mx-auto items-center justify-between border-b border-white/10 transition-all duration-300 ${navHeight}`}
        >
          {/* Logo – dynamic, from admin-editable config */}
          <Link to="home" smooth offset={-80} className="flex items-center cursor-pointer flex-shrink-0">
            {logo ? (
              <img src={logo} alt="logo" className="h-[50px] w-auto" />
            ) : (
              // reserves the same height while the query resolves, so the
              // desktop bar doesn't jump once the logo pops in
              <div className="h-[50px] w-[140px]" />
            )}
          </Link>

          {/* Nav links */}
          <ul className="flex items-center mx-auto mb-0 list-none">
            {companyLinks.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                smooth
                offset={-80}
                duration={500}
                className="px-[20px] py-[10px] text-[0.938rem] text-white no-underline cursor-pointer"
              >
                <span className="relative group">
                  {label}
                  <span className="absolute bg-[#483E79] -bottom-2 left-0 w-full h-0.5 origin-left scale-x-0 group-hover:scale-x-100 group-[.active]:scale-x-100 transition-transform duration-300 ease-out" />
                </span>
              </Link>
            ))}
          </ul>

          {/* Auth buttons (desktop) */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isAuthenticated && user ? (
              <div className="relative group">
                <button className="w-9 h-9 rounded-full bg-white text-[#483E79] font-bold text-sm flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer">
                  {initial}
                </button>
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button
                    onClick={() => router.push("/admin/dashboard")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
          <button
  onClick={() => router.push("/login")}
  className="px-[18px] py-[8px] rounded-[8px] text-[0.85rem] font-semibold text-[#5D2FDB] bg-transparent border border-[#5D2FDB] hover:bg-[#5D2FDB] hover:text-white cursor-pointer shadow-sm transition-colors duration-200"
>
  Sign In
</button>
<button
  onClick={() => router.push("/signup")}
  className="px-[18px] py-[8px] rounded-[8px] text-[0.85rem] font-semibold text-[#483E79] bg-white hover:bg-gray-50 cursor-pointer shadow-sm transition-colors duration-200"
>
  Sign Up
</button>
                </>
            )}
          </div>
        </div>

        {/* ── MOBILE ROW (below lg) ── */}
        <div
          className={`lg:hidden grid grid-cols-[1fr_auto_1fr] w-full px-4 items-center  border-b border-white/10 transition-all duration-300 h-[70px]`}
        >
          {/* LEFT – burger */}
          <div className="flex items-center justify-start">
            <button
              onClick={toggleMenu}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="bg-transparent border-0 outline-none cursor-pointer p-2 -ml-2"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className={`block h-0.5 bg-white rounded transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
                <span className={`block h-0.5 bg-white rounded transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
                <span className={`block h-0.5 bg-white rounded transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-[9px]" : ""}`} />
              </div>
            </button>
          </div>

          {/* CENTER – logo */}
          <div className="flex items-center justify-center">
            <Link to="home" smooth offset={-80} className="cursor-pointer flex items-center">
              {logo ? (
                <img src={logo} alt="logo" className="h-[40px] w-auto" />
              ) : (
                <div className="h-[40px] w-[110px]" />
              )}
            </Link>
          </div>

          {/* RIGHT – avatar (mobile) */}
          <div className="flex items-center justify-end">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
                  className="w-8 h-8 rounded-full bg-white text-[#483E79] font-bold text-xs flex items-center justify-center"
                >
                  {initial}
                </button>
                {mobileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <button
                      onClick={() => { setMobileDropdownOpen(false); router.push("/admin/dashboard"); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => { setMobileDropdownOpen(false); handleLogout(); }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-lg"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* ── MOBILE DROPDOWN ── */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out bg-[#483E79] ${
            menuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <ul className="w-full list-none mb-0 px-4">
            {companyLinks.map(({ to, label }) => (
              <li key={to} className="border-b border-white/10 last:border-0">
                <Link
                  activeClass="active"
                  to={to}
                  spy
                  smooth
                  offset={-80}
                  duration={0}
                  ignoreCancelEvents
                  onClick={closeMenu}
                  className="flex items-center py-4 text-[0.95rem] text-white/90 cursor-pointer hover:text-white transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li className="py-4 flex gap-3">
              {isAuthenticated && user ? (
                <button
                  onClick={() => { closeMenu(); router.push("/admin/dashboard"); }}
                  className="flex-1 py-[10px] rounded-[8px] text-[0.9rem] font-semibold text-[#483E79] bg-white cursor-pointer hover:bg-white/90 shadow-sm transition-colors duration-200"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { closeMenu(); router.push("/login"); }}
                    className="flex-1 py-[10px] rounded-[8px] text-[0.9rem] font-medium text-white/90 border border-white/25 cursor-pointer hover:bg-white/10 transition-colors duration-200"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { closeMenu(); router.push("/signup"); }}
                    className="flex-1 py-[10px] rounded-[8px] text-[0.9rem] font-semibold text-[#483E79] bg-white cursor-pointer hover:bg-white/90 shadow-sm transition-colors duration-200"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </li>
          </ul>
        </div>

      </nav>
    </div>
  );
};

export default TopNavbar;