import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { OfferCard } from "@/components/site/content/cards";
import { getPublishedOffers } from "@/lib/public-content";

export const metadata: Metadata = {
  title: "Offres et promotions",
  description: "Offres du moment à l'Hôtel Nahoui Balmer : séjours, restaurant, séminaires, bien-être et événements à San-Pédro.",
  alternates: { canonical: "/offres" },
  openGraph: { url: "/offres", title: "Offres — Hôtel Nahoui Balmer" },
};

export const revalidate = 60;

const SECTIONS = [
  { key: "SEJOUR", title: "Séjours" },
  { key: "RESTAURANT", title: "Restaurant & bars" },
  { key: "SEMINAIRE", title: "Séminaires & entreprises" },
  { key: "EVENEMENT", title: "Événements" },
  { key: "BIEN_ETRE", title: "Bien-être" },
  { key: "AUTRE", title: "Et aussi" },
] as const;

export default async function Page() {
  const offers = await getPublishedOffers();
  const groups = SECTIONS.map((s) => ({ ...s, items: offers.filter((o) => o.category === s.key) })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-10 pt-16 pb-12">
          <span className="eyebrow text-primary">Offres & promotions</span>
          <h1 className="font-display mt-5 text-4xl sm:text-5xl font-light text-balance">Les offres du moment</h1>
        </div>
      </section>
      <main className="mx-auto max-w-[1440px] px-5 lg:px-10 py-16 space-y-20">
        {groups.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="font-display text-2xl font-light">Aucune offre en ce moment</h2>
            <p className="text-muted-foreground mt-2 mb-8">Revenez bientôt, ou découvrez nos chambres et suites.</p>
            <Link href="/stays" className="btn-fill-editorial">Voir les chambres</Link>
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.key} aria-labelledby={`offres-${g.key}`}>
              <h2 id={`offres-${g.key}`} className="section-title">{g.title}</h2>
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((o) => (
                  <OfferCard key={o.id} offer={o} />
                ))}
              </div>
            </section>
          ))
        )}
        <section className="border-t border-border pt-12 flex flex-wrap items-center justify-between gap-6">
          <p className="text-muted-foreground max-w-xl">Un groupe, un séminaire ou un événement privé ? Recevez une proposition sur mesure.</p>
          <Link href="/devis" className="btn-fill-editorial">Demander un devis</Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
