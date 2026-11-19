import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import type { PublicEvent, PublicFacility, PublicOffer } from "@/lib/public-content";

/** Cartes des contenus gérés dans l'admin (offres, événements, espaces). Sans état : utilisables partout. */

export const fcfa = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/ | /g, " ")} FCFA`;
export const day = (iso: string, withYear = false) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" });

function Cta({ href, label }: { href: string | null; label: string | null }) {
  if (!href) return null;
  const external = /^https?:\/\//.test(href);
  const content = (
    <>
      {label || "En savoir plus"} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
    </>
  );
  const cls = "link-underline text-foreground mt-auto pt-5";
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{content}</a>;
  // tel:, mailto: : lien simple, sans navigation client.
  if (!href.startsWith("/")) return <a href={href} className={cls}>{content}</a>;
  return <Link href={href} className={cls}>{content}</Link>;
}

export const OFFER_LABELS: Record<string, string> = {
  SEJOUR: "Séjour",
  RESTAURANT: "Restaurant",
  SEMINAIRE: "Séminaire",
  EVENEMENT: "Événement",
  BIEN_ETRE: "Bien-être",
  AUTRE: "Offre",
};

export function OfferCard({ offer }: { offer: PublicOffer }) {
  return (
    <article className="group flex h-full flex-col border border-border bg-card">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {offer.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={offer.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        )}
        <span className="absolute left-0 top-0 bg-primary px-3 py-1.5 text-xs font-medium text-white">{OFFER_LABELS[offer.category]}</span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl leading-tight text-balance">{offer.title}</h3>
        {offer.summary && <p className="mt-3 text-[0.95rem] text-muted-foreground text-pretty">{offer.summary}</p>}
        {offer.price != null && (
          <p className="mt-4 text-sm">
            <strong className="text-lg tabular">{fcfa(offer.price)}</strong>
            {offer.priceLabel && <span className="text-muted-foreground"> {offer.priceLabel}</span>}
          </p>
        )}
        {offer.validUntil && <p className="mt-2 text-xs text-muted-foreground">Valable jusqu&apos;au {day(offer.validUntil, true)}</p>}
        <Cta href={offer.ctaUrl || "/contact"} label={offer.ctaLabel || "Profiter de l'offre"} />
      </div>
    </article>
  );
}

export function EventCard({ event }: { event: PublicEvent }) {
  const d = new Date(event.startDate);
  return (
    <article className="group grid grid-cols-[auto_1fr] gap-5 border-t border-border py-7 sm:grid-cols-[auto_1fr_14rem] sm:gap-8">
      <div className="w-16 text-center">
        <div className="font-display text-4xl leading-none tabular">{d.getUTCDate()}</div>
        <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
          {d.toLocaleDateString("fr-FR", { month: "short", timeZone: "UTC" })}
        </div>
      </div>
      <div className="flex min-w-0 flex-col">
        <h3 className="font-display text-2xl leading-tight">{event.title}</h3>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{day(event.startDate)}{event.endDate && event.endDate !== event.startDate ? ` → ${day(event.endDate)}` : ""}</span>
          {event.venue && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{event.venue}</span>}
          {event.price != null && <span>{event.price === 0 ? "Entrée libre" : fcfa(event.price)}</span>}
        </p>
        {(event.summary || event.description) && <p className="mt-3 text-[0.95rem] text-foreground/85 text-pretty whitespace-pre-line">{event.summary || event.description}</p>}
        <Cta href={event.ctaUrl} label={event.ctaLabel} />
      </div>
      {event.imageUrl && (
        <div className="col-span-2 aspect-[4/3] overflow-hidden bg-muted sm:col-span-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
      )}
    </article>
  );
}

/** Présentation d'un espace : texte à gauche, photos à droite (alternance avec `reverse`). */
export function FacilityBlock({ facility, reverse = false }: { facility: PublicFacility; reverse?: boolean }) {
  const photos = [facility.coverImageUrl, ...facility.gallery].filter((u): u is string => Boolean(u));
  return (
    <section className="border-t border-border py-16 lg:py-24">
      <div className={`grid grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:gap-16 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <div>
          <h2 className="section-title">{facility.name}</h2>
          {facility.summary && <p className="mt-5 text-lg text-foreground/85 text-pretty">{facility.summary}</p>}
          {facility.description && <p className="mt-4 text-[0.98rem] leading-relaxed text-muted-foreground whitespace-pre-line">{facility.description}</p>}
          {(facility.hours || facility.capacity) && (
            <dl className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {facility.hours && (
                <div className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" /><div><dt className="sr-only">Horaires</dt><dd>{facility.hours}</dd></div></div>
              )}
              {facility.capacity && (
                <div className="flex items-start gap-2"><Users className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" /><div><dt className="sr-only">Capacité</dt><dd>{facility.capacity}</dd></div></div>
              )}
            </dl>
          )}
          {facility.features.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {facility.features.map((f) => (
                <li key={f} className="border border-border px-3 py-1.5 text-sm">{f}</li>
              ))}
            </ul>
          )}
        </div>
        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {photos.slice(0, 5).map((src, i) => (
              <div key={src + i} className={`overflow-hidden bg-muted ${i === 0 ? "col-span-2 aspect-[16/10]" : "aspect-square"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={i === 0 ? facility.name : ""} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
