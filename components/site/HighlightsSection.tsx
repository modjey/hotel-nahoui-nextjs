import Link from "next/link";
import { EventCard, OfferCard } from "@/components/site/content/cards";
import type { PublicEvent, PublicOffer } from "@/lib/public-content";

/** Accueil : offres mises en avant et prochains événements (masqué s'il n'y a rien à montrer). */
export function HighlightsSection({ offers, events }: { offers: PublicOffer[]; events: PublicEvent[] }) {
  if (offers.length === 0 && events.length === 0) return null;
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
        {offers.length > 0 && (
          <>
            <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
              <div>
                <span className="eyebrow text-primary">Offres du moment</span>
                <h2 className="section-title mt-5 max-w-3xl">Des attentions pensées pour vous.</h2>
              </div>
              <Link href="/offres" className="link-underline text-foreground">Toutes les offres</Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((o) => (
                <OfferCard key={o.id} offer={o} />
              ))}
            </div>
          </>
        )}

        {events.length > 0 && (
          <div className={offers.length > 0 ? "mt-24" : undefined}>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-6">
              <div>
                <span className="eyebrow text-primary">Agenda</span>
                <h2 className="section-title mt-5">À venir à l&rsquo;hôtel</h2>
              </div>
              <Link href="/evenements" className="link-underline text-foreground">Tous les événements</Link>
            </div>
            <div className="border-b border-border">
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
