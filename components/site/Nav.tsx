"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, User, ChevronDown, LogOut, X, Settings, Phone, Waves, Compass, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import { WhatsAppIcon } from "@/components/site/social-icons";

const WHATSAPP_URL = "https://api.whatsapp.com/send?phone=%2B2250788494979";

export function Nav() {
  const pathname = usePathname() ?? "/";
  const { user, logout } = useAuth();
  const [language, setLanguage] = useState("fr");
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isExperienceMenuOpen, setIsExperienceMenuOpen] = useState(false);
  const [isDrawerExperienceOpen, setIsDrawerExperienceOpen] = useState(false);
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
    setIsExperienceMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bloque le scroll du body quand le menu latéral est ouvert
  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isSidebarOpen]);

  const navLinks = [
    { href: "/stays",      label: "Hébergements" },
    { href: "/restaurant", label: "Restauration" },
    { href: "/photobook",  label: "Photobook" },
    { href: "/blog",       label: "Actualité" },
  ];

  // Sous-menu "Expériences" — regroupe bien-être, expériences et événements
  const experienceLinks = [
    {
      href: "/bien-etre",
      label: "Bien-être",
      description: "Piscine, spa et salle de sport pour se ressourcer.",
      icon: Waves,
    },
    {
      href: "/services",
      label: "Expériences",
      description: "Détente, bar VIP et moments pensés sur-mesure.",
      icon: Compass,
    },
    {
      href: "/evenements",
      label: "Événements",
      description: "Excursions, célébrations et réceptions privées.",
      icon: PartyPopper,
    },
  ];
  const isExperienceActive = experienceLinks.some((l) => isActive(l.href));

  // Liens complets du menu latéral
  const drawerLinks = [
    { href: "/",           label: "L'Hôtel" },
    { href: "/stays",      label: "Hébergements" },
    { href: "/restaurant", label: "Restauration" },
    { href: "/photobook",  label: "Photobook" },
    { href: "/blog",       label: "Actualité" },
    { href: "/contact",    label: "Contact" },
  ];

  const isStaff = user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "MODERATOR");

  const handleUserClick = () => {
    if (user) setIsUserMenuOpen((v) => !v);
    else setIsAuthModalOpen(true);
  };

  const fg = transparent ? "text-white" : "text-foreground";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color] duration-500 border-b ${
          transparent
            ? "bg-transparent border-transparent"
            : "bg-background/95 backdrop-blur-md border-border"
        }`}
      >
        <div
          className={`mx-auto max-w-[1440px] px-5 lg:px-10 flex items-center justify-between gap-6 transition-[height] duration-500 ${
            transparent ? "h-20 lg:h-24" : "h-[72px]"
          }`}
        >
          {/* Marque */}
          <div className="flex items-center gap-5 shrink-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Ouvrir le menu"
              className={`h-11 w-11 grid place-items-center border transition-colors duration-500 ${
                transparent ? "border-white/60 text-white hover:bg-white/10" : "border-border text-foreground hover:border-foreground"
              }`}
            >
              <Menu className="h-5 w-5" strokeWidth={1.6} />
            </button>
            <Link href="/" className="flex items-center gap-3" aria-label="Hôtel Nahoui Balmer - accueil">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="h-10 w-10" />
              <span className={`hidden sm:flex flex-col leading-none transition-colors duration-500 ${fg}`}>
                <span className="font-display text-[1.35rem]">Nahoui Balmer</span>
                <span className="text-[0.75rem] font-medium opacity-80 mt-1">Hôtel · San Pedro</span>
              </span>
            </Link>
          </div>

          {/* Navigation principale — toujours visible sur grand écran */}
          <nav aria-label="Navigation principale" className={`hidden xl:flex items-center gap-8 text-[0.9375rem] font-medium transition-colors duration-500 ${fg}`}>
            {navLinks.slice(0, 2).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`relative py-2 transition-opacity hover:opacity-100 ${
                  isActive(link.href) ? "opacity-100" : "opacity-80"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-primary" />
                )}
              </Link>
            ))}

            {/* Mega-menu "Expériences" — regroupe bien-être, expériences et événements */}
            <div
              className="relative"
              onMouseEnter={() => setIsExperienceMenuOpen(true)}
              onMouseLeave={() => setIsExperienceMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsExperienceMenuOpen((v) => !v)}
                aria-expanded={isExperienceMenuOpen}
                aria-haspopup="true"
                className={`relative flex items-center gap-1.5 py-2 transition-opacity hover:opacity-100 ${
                  isExperienceActive || isExperienceMenuOpen ? "opacity-100" : "opacity-80"
                }`}
              >
                Expériences
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isExperienceMenuOpen ? "rotate-180" : ""}`} />
                {isExperienceActive && (
                  <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-primary" />
                )}
              </button>

              <AnimatePresence>
                {isExperienceMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-1/2 top-full z-50 mt-3 w-[640px] -translate-x-1/2 bg-card border border-border shadow-[var(--shadow-elevated)] text-foreground"
                  >
                    <div className="grid grid-cols-3 gap-px bg-border">
                      {experienceLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsExperienceMenuOpen(false)}
                            className="group flex flex-col gap-3 bg-card p-6 transition-colors hover:bg-secondary"
                          >
                            <span className="flex h-10 w-10 items-center justify-center border border-border transition-colors group-hover:border-foreground">
                              <Icon className="h-4.5 w-4.5" strokeWidth={1.6} />
                            </span>
                            <span>
                              <span className="font-display text-lg block">{item.label}</span>
                              <span className="mt-1 block text-sm text-muted-foreground leading-snug">
                                {item.description}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {navLinks.slice(2).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`relative py-2 transition-opacity hover:opacity-100 ${
                  isActive(link.href) ? "opacity-100" : "opacity-80"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-primary" />
                )}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className={`flex items-center gap-4 lg:gap-5 transition-colors duration-500 ${fg}`}>
            {/* Sélecteur de langue désactivé pour le moment — à réactiver plus tard.
            <div className="relative hidden sm:block">
              <button
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                aria-label="Changer de langue"
                aria-expanded={isLanguageMenuOpen}
                className="flex items-center gap-1 text-[0.9375rem] font-medium opacity-90 hover:opacity-100 h-11"
              >
                {languages.find((l) => l.code === language)?.flag}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {isLanguageMenuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-card border border-border py-1 z-50 shadow-[var(--shadow-elevated)]">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLanguageMenuOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left hover:bg-secondary flex items-center gap-3 text-sm text-foreground ${
                        language === lang.code ? "font-semibold" : ""
                      }`}
                    >
                      <span className="eyebrow w-6">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            */}

            <button
              onClick={handleUserClick}
              aria-label={user ? "Mon compte" : "Se connecter"}
              className="h-11 w-9 grid place-items-center"
            >
              {user ? (
                <span className={`h-8 w-8 rounded-full grid place-items-center overflow-hidden border ${transparent ? "border-white/60" : "border-border"}`}>
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </span>
              ) : (
                <User className="h-5 w-5" strokeWidth={1.6} />
              )}
            </button>

            <Link href="/stays" className="hidden sm:inline-flex btn-fill-editorial">
              Réserver
            </Link>

            {user && isUserMenuOpen && !isMobile && (
              <div className="absolute right-6 top-full mt-1 w-64 bg-card border border-border shadow-[var(--shadow-elevated)] py-1 z-50 text-foreground">
                <div className="px-4 py-3 border-b border-border">
                  <div className="text-sm font-semibold truncate">{user.name || user.email || user.phone}</div>
                  {user.email && <div className="text-xs text-muted-foreground truncate">{user.email}</div>}
                </div>
                {isStaff && (
                  <Link href="/admin" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary">
                    <Settings className="h-4 w-4" /> Espace administrateur
                  </Link>
                )}
                <Link href="/bookings" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-secondary">
                  Mes réservations
                </Link>
                <button
                  onClick={async () => {
                    setIsUserMenuOpen(false);
                    await logout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {!isHome && <div aria-hidden className="h-[72px]" />}

      {/* Menu latéral */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-[60] bg-[rgb(26_12_9/0.55)]"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 left-0 bottom-0 z-[70] w-full sm:w-[460px] bg-ink text-white flex flex-col"
              aria-label="Menu"
            >
              <div className="flex items-center justify-between px-6 sm:px-10 h-20 border-b border-white/15">
                <Link href="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="" className="h-9 w-9" />
                  <span className="font-display text-xl">Nahoui Balmer</span>
                </Link>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Fermer le menu"
                  className="h-11 w-11 grid place-items-center border border-white/30 hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" strokeWidth={1.6} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 flex flex-col">
                <nav className="flex flex-col" aria-label="Menu principal">
                  {drawerLinks.slice(0, 3).map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.08 + i * 0.04 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsSidebarOpen(false)}
                        aria-current={isActive(link.href) ? "page" : undefined}
                        className={`group flex items-center gap-4 py-3 font-display text-[1.75rem] leading-tight transition-colors ${
                          isActive(link.href) ? "text-white" : "text-white/75 hover:text-white"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 shrink-0 transition-colors ${
                            isActive(link.href) ? "bg-primary outline outline-1 outline-offset-2 outline-white" : "bg-white/0 group-hover:bg-primary"
                          }`}
                        />
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}

                  {/* Section "Expériences" dépliable — regroupe bien-être, expériences et événements */}
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.08 + 3 * 0.04 }}
                  >
                    <button
                      type="button"
                      onClick={() => setIsDrawerExperienceOpen((v) => !v)}
                      aria-expanded={isDrawerExperienceOpen}
                      className={`group flex w-full items-center gap-4 py-3 font-display text-[1.75rem] leading-tight transition-colors ${
                        isExperienceActive ? "text-white" : "text-white/75 hover:text-white"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 shrink-0 transition-colors ${
                          isExperienceActive ? "bg-primary outline outline-1 outline-offset-2 outline-white" : "bg-white/0 group-hover:bg-primary"
                        }`}
                      />
                      Expériences
                      <ChevronDown className={`h-5 w-5 ml-auto transition-transform duration-300 ${isDrawerExperienceOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isDrawerExperienceOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden pl-6 border-l border-white/15 ml-1"
                        >
                          {experienceLinks.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                aria-current={isActive(item.href) ? "page" : undefined}
                                className={`flex items-start gap-3 py-3 transition-colors ${
                                  isActive(item.href) ? "text-white" : "text-white/70 hover:text-white"
                                }`}
                              >
                                <Icon className="h-5 w-5 mt-0.5 shrink-0" strokeWidth={1.6} />
                                <span>
                                  <span className="block font-display text-lg leading-tight">{item.label}</span>
                                  <span className="block text-sm text-white/50 mt-0.5">{item.description}</span>
                                </span>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {drawerLinks.slice(3).map((link, i) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.08 + (i + 4) * 0.04 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsSidebarOpen(false)}
                        aria-current={isActive(link.href) ? "page" : undefined}
                        className={`group flex items-center gap-4 py-3 font-display text-[1.75rem] leading-tight transition-colors ${
                          isActive(link.href) ? "text-white" : "text-white/75 hover:text-white"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 shrink-0 transition-colors ${
                            isActive(link.href) ? "bg-primary outline outline-1 outline-offset-2 outline-white" : "bg-white/0 group-hover:bg-primary"
                          }`}
                        />
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                <div className="mt-8">
                  <Link href="/stays" onClick={() => setIsSidebarOpen(false)} className="btn-fill-editorial w-full">
                    Réserver un séjour
                  </Link>
                </div>

                <div className="mt-8 pt-6 border-t border-white/15 grid gap-3 text-[0.9375rem] text-white/80">
                  <a href="tel:+2252734712233" className="inline-flex items-center gap-3 hover:text-white">
                    <Phone className="h-4 w-4" /> +225 27 34 71 22 33
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 hover:text-white">
                    <WhatsAppIcon className="h-4 w-4" /> Écrire sur WhatsApp
                  </a>
                </div>

                {/* Sélecteur de langue désactivé pour le moment — à réactiver plus tard.
                <div className="mt-6 flex gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`h-10 px-4 text-sm font-semibold border transition-colors ${
                        language === lang.code ? "border-white bg-white text-ink" : "border-white/30 text-white/80 hover:border-white"
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
                */}

                <div className="mt-8 pt-6 border-t border-white/15">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-10 rounded-full border border-white/30 grid place-items-center overflow-hidden shrink-0">
                          {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate">{user.name || user.email || user.phone}</div>
                          {user.email && <div className="text-xs text-white/60 truncate">{user.email}</div>}
                        </div>
                      </div>
                      {isStaff && (
                        <Link href="/admin" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-2 py-1.5 text-sm text-white/80 hover:text-white">
                          <Settings className="h-4 w-4" /> Espace administrateur
                        </Link>
                      )}
                      <Link href="/bookings" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-2 py-1.5 text-sm text-white/80 hover:text-white">
                        Mes réservations
                      </Link>
                      <button
                        onClick={async () => { setIsSidebarOpen(false); await logout(); }}
                        className="flex items-center gap-2 py-1.5 text-sm text-white/80 hover:text-white"
                      >
                        <LogOut className="h-4 w-4" /> Se déconnecter
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setIsSidebarOpen(false); setIsAuthModalOpen(true); }}
                      className="w-full h-12 inline-flex items-center justify-center gap-2 border border-white/40 text-[0.9375rem] font-semibold hover:bg-white hover:text-ink transition-colors"
                    >
                      <User className="h-4 w-4" /> Se connecter
                    </button>
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
