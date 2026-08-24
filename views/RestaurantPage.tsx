"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Clock, MapPin, Phone, Mail, Star } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      {/* Hero */}
      <section className="relative h-[85vh] min-h-[560px] w-full overflow-hidden">
        <img src={heroImg} alt="Restaurant de l'Hôtel Nahoui Balmer" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="eyebrow"
          >
            Cuisine ivoirienne authentique
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="font-display mt-6 text-5xl sm:text-6xl lg:text-7xl font-light"
          >
            Notre Restaurant
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="mt-6 max-w-md text-sm sm:text-base text-white/85"
          >
            La cuisine ivoirienne, dans un cadre exceptionnel à San Pedro.
          </motion.p>
        </div>
      </section>

      {/* Info */}
      <section className="mx-auto max-w-[1440px] px-6 lg:px-10 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-b border-border pb-20 mb-20">
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
              className="text-center sm:text-left"
            >
              <item.icon className="h-6 w-6 text-primary mb-4 mx-auto sm:mx-0" />
              <h3 className="font-display text-xl font-light">{item.title}</h3>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[1, 2, 3].map((j) => (
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
            <div className="text-center mb-16">
              <span className="eyebrow text-primary">Notre carte</span>
              <h2 className="font-display mt-5 text-4xl sm:text-5xl font-light">Le menu Nahoui</h2>
            </div>

            {groupedDishes.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">Aucun plat disponible pour le moment.</p>
            ) : (
              <div className="space-y-20">
                {groupedDishes.map((section, sectionIndex) => (
                  <motion.div
                    key={section.category}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.8, delay: sectionIndex * 0.05 }}
                  >
                    <h3 className="eyebrow text-muted-foreground mb-8 pb-4 border-b border-border">{section.category}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                      {section.items.map((item, itemIndex) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-60px" }}
                          transition={{ duration: 0.6, delay: itemIndex * 0.05 }}
                          className="group"
                        >
                          <div className="relative overflow-hidden aspect-[4/5]">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover img-zoom" />
                            ) : (
                              <div className="absolute inset-0 bg-muted grid place-items-center text-sm text-muted-foreground">
                                Image non disponible
                              </div>
                            )}
                          </div>
                          <div className="mt-5 flex items-baseline justify-between gap-3">
                            <h4 className="font-display text-xl font-light">{item.name}</h4>
                            <span className="font-display text-primary shrink-0">
                              {item.price.toLocaleString()} {item.currency}
                            </span>
                          </div>
                          {item.description && (
                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Reservation CTA */}
      <section className="bg-ink text-white text-center py-20 lg:py-28">
        <span className="eyebrow text-white/70">Réservation</span>
        <h2 className="font-display mt-5 text-3xl sm:text-4xl font-light">Réservez votre table</h2>
        <div className="mt-6 flex flex-col sm:flex-row gap-4 sm:gap-10 justify-center items-center text-sm text-white/80">
          <span className="flex items-center gap-2">
            <Phone className="h-4 w-4" /> 27 34 71 22 33 · 07 88 49 49 79
          </span>
          <span className="flex items-center gap-2">
            <Mail className="h-4 w-4" /> hotelnahoui@yahoo.com
          </span>
        </div>
        <div className="mt-9">
          <Link href="/contact" className="link-underline text-white">
            Réserver votre table
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
