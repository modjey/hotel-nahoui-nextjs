"use client";
import { motion } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";
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

function Stars({ value, size = "h-3.5 w-3.5" }: { value: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} sur 5`}>
      {[...Array(5)].map((_, j) => (
        <Star
          key={j}
          aria-hidden="true"
          className={`${size} ${j < Math.round(value) ? "fill-primary text-primary" : "text-foreground/20"}`}
        />
      ))}
    </div>
  );
}

export function AvisSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/rooms/all-reviews?status=APPROVED&limit=3`);
        const data = await res.json();
        if (data.success) setReviews(data.data.reviews);
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
    <section className="bg-warm py-24 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between mb-12 lg:mb-14">
          <div>
            <span className="eyebrow text-primary">Avis clients</span>
            <h2 className="section-title mt-5">Ce que nos hôtes en disent.</h2>
          </div>
          {!loading && reviews.length > 0 && (
            <div className="flex items-end gap-5">
              <p className="font-display text-7xl leading-none tabular">
                {averageRating.toFixed(1).replace(".", ",")}
                <span className="text-2xl text-muted-foreground"> / 5</span>
              </p>
              <div className="pb-2">
                <Stars value={averageRating} size="h-4 w-4" />
                <Link href="/avis" className="link-underline mt-3 text-brand-text">
                  Tous les avis <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border p-8 animate-pulse">
                <div className="h-8 w-8 bg-muted mb-6" />
                <div className="h-4 w-full bg-muted mb-2" />
                <div className="h-4 w-4/5 bg-muted mb-2" />
                <div className="h-4 w-2/3 bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review, i) => (
              <motion.figure
                key={review.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                className="bg-card border border-border p-8 lg:p-10 flex flex-col"
              >
                <div className="flex items-start justify-between">
                  <span aria-hidden="true" className="font-display text-7xl leading-[0.6] text-primary h-8">&laquo;</span>
                  <Stars value={review.rating} />
                </div>
                <blockquote className="mt-6 flex-1 font-display text-xl lg:text-[1.4rem] leading-snug text-pretty">
                  {review.comment}
                </blockquote>
                <figcaption className="mt-8 pt-6 border-t border-border flex items-center gap-3">
                  {review.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={review.user.image} alt="" className="h-10 w-10 object-cover" />
                  ) : (
                    <span className="h-10 w-10 frame-inset grid place-items-center font-display text-base">
                      {(review.user?.name || "A")[0].toUpperCase()}
                    </span>
                  )}
                  <span className="text-[0.9375rem] font-semibold">{review.user?.name || "Client anonyme"}</span>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
