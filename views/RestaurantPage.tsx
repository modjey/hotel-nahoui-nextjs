"use client";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock, MapPin, Phone, Mail, Star, X, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { api } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

const heroImg = "/assets/resto.png";

type Dish = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  category: { id: string; name: string; slug: string };
  location: { id: string; name: string; city: string | null };
};

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export function RestaurantPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dishesData, categoriesData] = await Promise.all([
          api.get<{ dishes: Dish[] }>("/api/dishes"),
          api.get<{ categories: Category[] }>("/api/dish-categories"),
        ]);
        setDishes(dishesData.dishes);
        setCategories(categoriesData.categories);
      } catch (error) {
        console.error("Error loading menu:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const groupedDishes = categories.map((category: Category) => ({
    category: category.name,
    items: dishes.filter((dish: Dish) => dish.category.id === category.id),
  })).filter((group: { category: string; items: Dish[] }) => group.items.length > 0);

  const flatDishes = useMemo(() => groupedDishes.flatMap((g) => g.items), [groupedDishes]);
  const dishIndexById = useMemo(() => new Map(flatDishes.map((d, i) => [d.id, i])), [flatDishes]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (id: string) => {
    const index = dishIndexById.get(id);
    if (index === undefined) return;
    setCurrentIndex(index);
    setLightboxOpen(true);
  };
  const closeLightbox = () => setLightboxOpen(false);
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % flatDishes.length);
  }, [flatDishes.length]);
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + flatDishes.length) % flatDishes.length);
  }, [flatDishes.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") goToPrevious();
      else if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, goToNext, goToPrevious]);

  const currentDish = flatDishes[currentIndex];

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      {/* Hero */}
      <section className="relative h-[85vh] min-h-[560px] w-full overflow-hidden">
        <img src={heroImg} alt="Restaurant de l'Hôtel Nahoui Balmer" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 photo-scrim" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-5 lg:px-10 pb-14 lg:pb-20 text-white">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="eyebrow inline-flex items-center gap-3 before:content-[''] before:h-2.5 before:w-2.5 before:bg-primary before:outline before:outline-1 before:outline-offset-2 before:outline-white"
          >
            Cuisine ivoirienne authentique
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="font-display mt-5 text-[3.25rem] leading-[0.95] sm:text-7xl lg:text-8xl tracking-[-0.02em] text-balance"
          >
            Notre Restaurant
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="mt-5 max-w-xl text-base sm:text-lg text-white/90 text-pretty"
          >
            La cuisine ivoirienne, dans un cadre exceptionnel à San Pedro.
          </motion.p>
        </div>
      </section>

      {/* Info */}
      <section className="mx-auto max-w-[1440px] px-5 lg:px-10 py-14 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 border-y border-border mb-20 sm:divide-x divide-border">
          {[
            { icon: Clock, title: "Horaires", content: ["Petit-déjeuner : 6h – 10h", "Déjeuner : 12h – 15h", "Dîner : 19h – 23h"] },
            { icon: MapPin, title: "Emplacement", content: ["Restaurant principal", "Hôtel Nahoui Balmer", "San Pedro, Côte d'Ivoire"] },
            { icon: Star, title: "Spécialités", content: ["Cuisine ivoirienne", "Fruits de mer", "Plats traditionnels"] },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
              className="py-7 sm:px-8 first:sm:pl-0 border-b sm:border-b-0 border-border last:border-b-0"
            >
              <h3 className="flex items-center gap-2 text-[0.8125rem] font-semibold text-muted-foreground">
                <item.icon className="h-4 w-4 text-primary" /> {item.title}
              </h3>
              <div className="mt-3 space-y-1 text-[1.0625rem] text-foreground">
                {item.content.map((line) => <p key={line}>{line}</p>)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Menu */}
        {loading ? (
          <div className="space-y-16">
            <Skeleton className="h-8 w-48 mx-auto" />
            {[1, 2].map((i) => (
              <div key={i} className="space-y-6">
                <Skeleton className="h-6 w-40" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="space-y-3">
                      <Skeleton className="aspect-[4/5] w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-14 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="eyebrow text-primary">Notre carte</span>
                <h2 className="section-title mt-5">Le menu Nahoui</h2>
              </div>
              <nav aria-label="Catégories du menu" className="flex flex-wrap gap-2">
                {groupedDishes.map((section) => (
                  <a key={section.category} href={`#menu-${section.category}`} className="h-10 px-4 inline-flex items-center border border-border text-sm font-medium hover:border-foreground transition-colors">
                    {section.category}
                  </a>
                ))}
              </nav>
            </div>

            {groupedDishes.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Aucun plat disponible pour le moment.</p>
            ) : (
              <div className="space-y-20">
                {groupedDishes.map((section, sectionIndex) => (
                  <motion.div
                    key={section.category}
                    id={`menu-${section.category}`}
                    className="scroll-mt-28"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.8, delay: sectionIndex * 0.05 }}
                  >
                    <div className="flex items-end justify-between gap-6 pb-4 border-b-2 border-foreground">
                      <h3 className="font-display text-3xl sm:text-4xl leading-none">{section.category}</h3>
                      <span className="text-sm text-muted-foreground tabular">{section.items.length} plat{section.items.length > 1 ? "s" : ""}</span>
                    </div>
                    <ul className="grid grid-cols-1 lg:grid-cols-2 gap-x-14">
                      {section.items.map((item) => (
                        <li key={item.id} className="border-b border-border">
                          <button
                            type="button"
                            onClick={() => openLightbox(item.id)}
                            className="group w-full text-left flex items-center gap-4 py-4"
                          >
                            <span className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden bg-muted">
                              {item.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.imageUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover img-zoom" />
                              ) : null}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="flex items-baseline gap-3">
                                <span className="font-display text-lg sm:text-xl leading-snug group-hover:text-brand-text transition-colors">{item.name}</span>
                                <span className="leader hidden sm:block" aria-hidden="true" />
                                <span className="ml-auto sm:ml-0 shrink-0 font-semibold tabular text-[0.9375rem]">
                                  {item.price.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ")} {item.currency === "XOF" ? "F" : item.currency}
                                </span>
                              </span>
                              {item.description && (
                                <span className="mt-1 block text-sm text-muted-foreground leading-relaxed line-clamp-2">{item.description}</span>
                              )}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Reservation CTA */}
      <section className="bg-primary text-white text-center px-5 shadow-[inset_0_0_0_12px_var(--brand),inset_0_0_0_13px_rgb(255_255_255/0.8)] py-20 lg:py-28">
        <span className="eyebrow text-white/90">Réservation</span>
        <h2 className="font-display mt-5 text-4xl sm:text-5xl leading-[1.02] text-balance">Réservez votre table</h2>
        <div className="mt-6 flex flex-col sm:flex-row gap-4 sm:gap-10 justify-center items-center text-sm text-white/90">
          <span className="flex items-center gap-2">
            <Phone className="h-4 w-4" /> 27 34 71 22 33 · 07 88 49 49 79
          </span>
          <span className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> hotelnahoui@yahoo.com
          </span>
        </div>
        <div className="mt-9">
          <Link href="/contact" className="btn-on-brand">
            Réserver votre table
          </Link>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxOpen && currentDish && (
        <div className="fixed inset-0 z-50 bg-[rgb(26_12_9/0.85)] flex items-center justify-center">
          <button onClick={closeLightbox} aria-label="Fermer" className="absolute top-6 right-6 text-white/80 hover:text-white z-10">
            <X className="h-6 w-6" />
          </button>

          {flatDishes.length > 1 && (
            <>
              <button onClick={goToPrevious} aria-label="Précédent" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10">
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button onClick={goToNext} aria-label="Suivant" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10">
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <div className="relative w-full h-full max-w-6xl mx-auto flex flex-col items-center justify-center p-4 sm:p-8">
            <div className="relative w-full flex-1 min-h-0 flex items-center justify-center">
              {currentDish.imageUrl ? (
                <img
                  src={currentDish.imageUrl}
                  alt={currentDish.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-white/60 text-sm">Image non disponible</div>
              )}
            </div>

            <div className="mt-6 text-center text-white max-w-xl">
              <span className="eyebrow text-white/60">{currentDish.category.name}</span>
              <div className="mt-2 flex items-center justify-center gap-4">
                <h3 className="font-display text-2xl font-light">{currentDish.name}</h3>
                <span className="font-display text-primary">
                  {currentDish.price.toLocaleString()} {currentDish.currency}
                </span>
              </div>
              {currentDish.description && (
                <p className="mt-2 text-sm text-white/70 leading-relaxed">{currentDish.description}</p>
              )}
              <p className="mt-4 text-xs text-white/50">{currentIndex + 1} / {flatDishes.length}</p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
