import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { LogOut, Menu, Phone, Search, User, X } from "lucide-react";
import ScrollRestoringLink from "./ScrollRestoringLink";
import { useAuth } from "../context/AuthContext";
import { useAnnouncement } from "../context/AnnouncementContext";
import SearchModal from "./SearchModal";
import { PHONE_MAIN_DISPLAY, PHONE_MAIN_HREF } from "../config/site";
import { buildAccountUrl } from "../utils/authRedirect";
import FallbackImage from "./FallbackImage";

const navLinks = [
  { path: "/", label: "Home" },
  { path: "/services", label: "Services" },
  { path: "/service-areas", label: "Areas" },
  { path: "/testimonials", label: "Reviews" },
  { path: "/about", label: "About" },
  { path: "/faq", label: "FAQ" },
  { path: "/contact", label: "Contact" },
];

const navLinkClass = (active) =>
  `text-base font-medium transition ${
    active ? "text-brand-700" : "text-zinc-600 hover:text-zinc-950"
  }`;

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, logout, registerAuthModals } = useAuth();
  const { visible: bannerVisible } = useAnnouncement();

  useEffect(() => {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    registerAuthModals(
      () => navigate(buildAccountUrl({ signIn: true, returnTo })),
      () => navigate(buildAccountUrl({ signUp: true, returnTo })),
    );
  }, [registerAuthModals, navigate, location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (isAuthenticated) return;
    const wantsSignIn = searchParams.get("signin") === "1";
    const wantsSignUp = searchParams.get("signup") === "1";
    if (!wantsSignIn && !wantsSignUp) return;
    if (location.pathname === "/account") return;

    const next = new URLSearchParams();
    if (wantsSignIn) next.set("signin", "1");
    if (wantsSignUp) next.set("signup", "1");
    if (location.pathname !== "/") next.set("returnTo", location.pathname);
    navigate(`/account?${next.toString()}`, { replace: true });
  }, [searchParams, isAuthenticated, location.pathname, navigate]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`fixed left-0 right-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-xl transition-[top] ${
        bannerVisible ? "top-[4vh]" : "top-0"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <ScrollRestoringLink to="/" className="flex shrink-0 items-center" aria-label="Apex Five Cleaning home">
            <FallbackImage
              src="/apex-five-logo.png"
              alt="Apex Five Cleaning"
              className="h-11 w-auto max-w-[calc(100vw-8rem)] object-contain sm:h-12"
            />
          </ScrollRestoringLink>

          <div className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => (
              <ScrollRestoringLink
                key={link.path}
                to={link.path}
                className={navLinkClass(isActive(link.path))}
              >
                {link.label}
              </ScrollRestoringLink>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {!isAuthenticated && (
              <ScrollRestoringLink
                to="/account"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-brand-700"
                title="My account"
                aria-label="My account"
              >
                <User className="h-5 w-5" />
              </ScrollRestoringLink>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu((open) => !open)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-zinc-200 px-3 text-sm font-semibold text-zinc-800 transition hover:border-brand-400 hover:bg-brand-50"
                >
                  <User className="h-4 w-4 text-brand-700" />
                  {user?.firstName || "Account"}
                </button>
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 z-50 mt-2 w-48 rounded-md border border-zinc-200 bg-white py-2 shadow-lg">
                      <Link
                        to="/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                      >
                        My Dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-brand-700"
              title="Search"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <a
              href={PHONE_MAIN_HREF}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-zinc-200 text-brand-700"
              aria-label={`Call ${PHONE_MAIN_DISPLAY}`}
            >
              <Phone className="h-5 w-5" />
            </a>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-zinc-200 text-zinc-800"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-zinc-200 bg-white md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="grid gap-1">
              {navLinks.map((link) => (
                <ScrollRestoringLink
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className={`rounded-md px-3 py-3 text-base font-medium ${
                    isActive(link.path)
                      ? "bg-brand-50 text-brand-700"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {link.label}
                </ScrollRestoringLink>
              ))}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={closeMobileMenu}
                    className="rounded-md px-3 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    My Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    className="rounded-md px-3 py-3 text-left text-base font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <ScrollRestoringLink
                  to="/account"
                  onClick={closeMobileMenu}
                  className="rounded-md px-3 py-3 text-base font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Account
                </ScrollRestoringLink>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowSearch(true);
                  closeMobileMenu();
                }}
                className="rounded-md px-3 py-3 text-left text-base font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {!isMobileMenuOpen && (
        <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 right-3 z-[70] md:hidden">
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 bg-white/95 p-2 shadow-xl shadow-zinc-950/15 backdrop-blur">
            <a
              href={PHONE_MAIN_HREF}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-zinc-200 text-sm font-semibold text-zinc-900"
            >
              <Phone className="h-4 w-4 text-brand-700" aria-hidden="true" />
              Call Now
            </a>
            <ScrollRestoringLink
              to="/request-a-quote"
              className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-brand-600 px-3 text-sm font-semibold text-white"
            >
              Get a Quote
            </ScrollRestoringLink>
          </div>
        </div>
      )}

      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </nav>
  );
};

export default Navbar;
