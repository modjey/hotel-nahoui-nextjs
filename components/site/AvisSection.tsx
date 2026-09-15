"use client";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

type Review = {
  id: string;
  rating: number;
  comment: string;
  user: {
    name: string | null;
    image?: string | null;
  };
};

export function AvisSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/rooms/all-reviews?status=APPROVED&limit=3`);
        const data = await res.json();
        if (data.success) {
          setReviews(data.data.reviews);
        }
      } catch (err) {
        console.error("Erreur chargement avis:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Pas d'avis approuvés en base : la section ne s'affiche pas
  if (!loading && reviews.length === 0) return null;

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <section className="bg-warm py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="eyebrow text-primary">Avis clients</span>
          <h2 className="font-display mt-4 text-3xl sm:text-4xl lg:text-5xl font-light text-balance">
            Ce que nos hôtes en disent.
          </h2>
          {!loading && reviews.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className={`h-4 w-4 ${j < Math.round(averageRating) ? "fill-primary text-primary" : "text-border"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{averageRating.toFixed(1)} / 5</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-sm bg-white shadow-[var(--shadow-card)] p-8 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-border mx-auto mb-5" />
                <div className="h-4 w-24 bg-border mx-auto mb-6" />
                <div className="h-3 w-full bg-border mb-2" />
                <div className="h-3 w-3/4 bg-border mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
                className="hover-lift rounded-sm bg-white shadow-[var(--shadow-card)] p-8 flex flex-col items-center text-center"
              >
                <Quote className="h-6 w-6 text-primary/30 mb-4" />
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className={`h-3.5 w-3.5 ${j < review.rating ? "fill-primary text-primary" : "text-border"}`} />
                  ))}
                </div>
                <p className="font-display text-lg lg:text-xl font-light leading-relaxed text-balance flex-1">
                  &laquo;&nbsp;{review.comment}&nbsp;&raquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  {review.user?.image ? (
                    <img src={review.user.image} alt={review.user.name || "Client"} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="h-9 w-9 rounded-full bg-primary/10 text-primary grid place-items-center font-display text-sm">
                      {(review.user?.name || "A")[0]}
                    </span>
                  )}
                  <p className="eyebrow text-muted-foreground">{review.user?.name || "Anonyme"}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/avis" className="link-underline text-foreground">
            Voir tous les avis
          </Link>
        </div>
      </div>
    </section>
  );
}
