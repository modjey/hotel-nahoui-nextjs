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

  if (!loading && reviews.length === 0) return null;

  return (
    <section className="bg-warm py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="eyebrow text-primary">Avis clients</span>
          <h2 className="font-display mt-5 text-4xl sm:text-5xl font-light text-balance">
            Ce que nos hôtes en disent.
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse text-center">
                <div className="h-4 w-24 bg-border mx-auto mb-6" />
                <div className="h-6 w-3/4 bg-border mx-auto mb-4" />
                <div className="h-4 w-1/2 bg-border mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className={`h-3.5 w-3.5 ${j < review.rating ? "fill-primary text-primary" : "text-border"}`} />
                  ))}
                </div>
                <Quote className="h-6 w-6 text-primary/30 mx-auto mb-4" />
                <p className="font-display text-xl font-light leading-relaxed text-balance">
                  &laquo;&nbsp;{review.comment}&nbsp;&raquo;
                </p>
                <p className="eyebrow mt-6 text-muted-foreground">{review.user?.name || "Anonyme"}</p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-14 text-center">
          <Link href="/avis" className="link-underline text-foreground">
            Voir tous les avis
          </Link>
        </div>
      </div>
    </section>
  );
}
