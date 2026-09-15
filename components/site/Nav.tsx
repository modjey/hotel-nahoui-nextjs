"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Menu, User, ChevronDown, LogOut, X, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";

export function Nav() {
  const pathname = usePathname() ?? "/";
  const { user, logout } = useAuth();
  const [language, setLanguage] = useState("fr");
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isMobile = useIsMobile();
  const isHome = pathname === "/";
  const transparent = isHome && !isScrolled && !isSidebarOpen;

  const languages = [
    { code: "fr", name: "Français", flag: "FR" },
    { code: "en", name: "English", flag: "EN" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isSidebarOpen]);

  const navLinks = [
    { href: "/",           label: "L'Hôtel" },
    { href: "/stays",      label: "Chambres & Suites" },
    { href: "/restaurant", label: "Restaurant" },
    { href: "/services",   label: "Expériences" },
    { href: "/evenements", label: "Événements" },
    { href: "/contact",    label: "Contact" },
  ];

  // Onglets secondaires affichés uniquement dans le drawer mobile
  const drawerExtraLinks = [
    { href: "/photobook", label: "Photobook" },
    { href: "/blog",      label: "Blog" },
  ];

  const handleUserClick = () => {
    if (user) {
      setIsUserMenuOpen((v) => !v);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
          transparent
            ? "bg-transparent"
            : "bg-background/95 backdrop-blur-md border-b border-border/70"
        }`}
      >
        <div
          className={`mx-auto max-w-[1440px] px-6 lg:px-10 flex items-center justify-between gap-8 transition-all duration-500 ${
            transparent ? "h-24 lg:h-28" : "h-20"
          }`}
        >
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Hôtel Nahoui Balmer" className="h-8 w-8 lg:h-9 lg:w-9" />
              <span
                className={`font-display text-xl lg:text-2xl tracking-[0.14em] uppercase transition-colors duration-500 ${
                  transparent ? "text-white" : "text-foreground"
                }`}
              >
              </span>
            </Link>

            {/* Menu button — opens sidebar */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Ouvrir le menu"
              className={`flex items-center gap-2 eyebrow transition-colors duration-500 ${transparent ? "text-white" : "text-foreground"}`}
            >
              <Menu className="h-5 w-5" />
              <span>Menu</span>
            </button>
          </div>

          {/* Inline nav — visible only when scrolled (not at top) */}
          <nav
            className={`hidden lg:flex items-center gap-9 eyebrow transition-colors duration-500 ${
              transparent ? "text-white/85 opacity-0 pointer-events-none" : "text-foreground/75 opacity-100"
            }`}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:opacity-100 transition-opacity duration-300 pb-1 ${
                  isActive(link.href)
                    ? `opacity-100 border-b border-foreground`
                    : "opacity-70"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className={`flex items-center gap-5 transition-colors duration-500 ${transparent ? "text-white" : "text-foreground"}`}>
            <div className="relative hidden sm:block">
              <button
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                className="flex items-center gap-1.5 eyebrow opacity-80 hover:opacity-100 transition-opacity"
              >
                <Globe className="h-3.5 w-3.5" />
                {languages.find((l) => l.code === language)?.flag}
                <ChevronDown className="h-3 w-3" />
              </button>
              {isLanguageMenuOpen && (
                <div className="absolute right-0 mt-3 w-40 bg-background border border-border py-2 z-50 shadow-[var(--shadow-elevated)]">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLanguageMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-secondary flex items-center gap-3 text-sm text-foreground"
                    >
                      <span className="eyebrow">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/stays"
              className={`hidden sm:inline-flex btn-fill-editorial ${transparent ? "" : ""}`}
            >
              Réserver
            </Link>

            {/* User avatar — opens auth modal or user menu */}
            <button
              onClick={handleUserClick}
              aria-label="Compte"
              className="flex items-center gap-2"
            >
              {user ? (
                <span className={`h-7 w-7 rounded-full grid place-items-center overflow-hidden border ${transparent ? "border-white/50" : "border-border"}`}>
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </span>
              ) : (
                <User className="h-5 w-5" />
              )}
            </button>

            {user && isUserMenuOpen && !isMobile && (
              <div className="absolute right-6 top-full mt-1 w-64 bg-background border border-border shadow-[var(--shadow-elevated)] py-2 z-50 text-foreground">
                <div className="px-4 py-3 border-b border-border">
                  <div className="text-sm font-medium truncate">
                    {user.name || user.email || user.phone}
                  </div>
                  {user.email && (
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  )}
                </div>
                {(user.role === "ADMIN" ||
                  user.role === "SUPER_ADMIN" ||
                  user.role === "MODERATOR") && (
                  <Link
                    href="/admin"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-secondary"
                  >
                    Espace administrateur
                  </Link>
                )}
                <Link
                  href="/bookings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="block px-4 py-2 text-sm hover:bg-secondary"
                >
                  Mes réservations
                </Link>
                <button
                  onClick={async () => {
                    setIsUserMenuOpen(false);
                    await logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-secondary flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {!isHome && <div aria-hidden className="h-20" />}

      {/* Sidebar menu */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />

            {/* Sidebar panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 left-0 bottom-0 z-[70] w-full sm:w-[420px] bg-background flex flex-col"
            >
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-8 h-16 border-b border-border">
                <span className="eyebrow text-primary">Menu</span>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Fermer le menu"
                  className="p-2 -mr-2 text-foreground hover:text-primary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Sidebar content */}
              <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col">
                <nav className="flex flex-col">
                  {[...navLinks, ...drawerExtraLinks].map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.06 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`block py-2.5 font-display text-lg lg:text-xl font-light border-b border-border transition-colors hover:text-primary ${
                          isActive(link.href) ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                {/* Reserve CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
                  className="mt-6"
                >
                  <Link
                    href="/stays"
                    onClick={() => setIsSidebarOpen(false)}
                    className="btn-fill-editorial w-full"
                  >
                    Réserver
                  </Link>
                </motion.div>

                {/* Language switcher */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
                  className="mt-5 flex gap-3"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`eyebrow px-3.5 py-1.5 border transition-colors ${
                        language === lang.code
                          ? "border-primary text-primary"
                          : "border-border text-muted-foreground hover:border-foreground"
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </motion.div>

                {/* Auth section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
                  className="mt-6 pt-5 border-t border-border"
                >
                  {user ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-10 rounded-full border border-border grid place-items-center overflow-hidden shrink-0">
                          {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{user.name || user.email || user.phone}</div>
                          {user.email && <div className="text-xs text-muted-foreground truncate">{user.email}</div>}
                        </div>
                      </div>
                      {(user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "MODERATOR") && (
                        <Link href="/admin" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-2 py-2 text-sm text-foreground/80 hover:text-primary transition-colors">
                          <Settings className="h-4 w-4" /> Espace administrateur
                        </Link>
                      )}
                      <Link href="/bookings" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-2 py-2 text-sm text-foreground/80 hover:text-primary transition-colors">
                        Mes réservations
                      </Link>
                      <button
                        onClick={async () => { setIsSidebarOpen(false); await logout(); }}
                        className="flex items-center gap-2 py-2 text-sm text-foreground/80 hover:text-primary transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Se déconnecter
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setIsSidebarOpen(false); setIsAuthModalOpen(true); }}
                      className="btn-outline-editorial w-full"
                    >
                      <User className="h-4 w-4" /> Se connecter
                    </button>
                  )}
                </motion.div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
