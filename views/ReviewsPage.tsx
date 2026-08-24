"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Star, Quote } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { Skeleton } from "@/components/ui/skeleton";

type Review = {
  id: string;
  rating: number;
  comment: string;
  user: { name: string | null };
};

export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ averageRating: 0, approved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/rooms/all-reviews?status=APPROVED&limit=48`);
        const data = await res.json();
        if (data.success) {
          setReviews(data.data.reviews);
          const approved = data.data.reviews.length;
          const averageRating = approved > 0
            ? data.data.reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / approved
            : 0;
          setStats({ averageRating, approved });
        }
      } catch (err) {
        console.error("Erreur chargement avis:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-16 pb-16 text-center">
          <span className="eyebrow text-primary">Avis clients</span>
          <h1 className="font-display mt-5 text-4xl sm:text-5xl lg:text-6xl font-light">
            Ce que nos hôtes en disent.
          </h1>
          {!loading && stats.approved > 0 && (
            <div className="mt-8 flex items-center justify-center gap-8">
              <div>
                <div className="font-display text-3xl font-light">{stats.averageRating.toFixed(1)}</div>
                <div className="eyebrow text-muted-foreground mt-1">Note moyenne</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <div className="font-display text-3xl font-light">{stats.approved}</div>
                <div className="eyebrow text-muted-foreground mt-1">Avis publiés</div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 lg:px-10 py-24 lg:py-32">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="text-center space-y-4">
                <Skeleton className="h-4 w-24 mx-auto" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground">Aucun avis pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: (i % 6) * 0.06 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className={`h-3.5 w-3.5 ${j < review.rating ? "fill-primary text-primary" : "text-border"}`} />
                  ))}
                </div>
                <Quote className="h-5 w-5 text-primary/30 mx-auto mb-4" />
                <p className="font-display text-lg font-light leading-relaxed text-balance">
                  &laquo;&nbsp;{review.comment}&nbsp;&raquo;
                </p>
                <p className="eyebrow mt-5 text-muted-foreground">{review.user?.name || "Anonyme"}</p>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-ink text-white text-center py-20 lg:py-28">
        <Quote className="h-6 w-6 mx-auto mb-6 text-white/60" />
        <span className="eyebrow text-white/70">Votre expérience</span>
        <h2 className="font-display mt-5 text-3xl sm:text-4xl font-light">Partagez votre séjour.</h2>
        <p className="mt-4 text-sm text-white/70 max-w-md mx-auto">
          Après votre séjour, laissez un avis directement depuis la page de votre chambre.
        </p>
        <div className="mt-9">
          <Link href="/stays" className="link-underline text-white">
            Réserver un séjour
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
