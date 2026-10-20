"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BedDouble, Maximize2, Users } from "lucide-react";
import { getDiscountedPrice } from "@/lib/pricing";

const ease = [0.22, 1, 0.36, 1] as const;

export type RoomCardRoom = {
  id: string;
  slug: string;
  name: string;
  roomNumber: string | null;
  shortDescription: string | null;
  basePrice: number;
  currency: string;
  discountPercent: number;
  maxGuests: number;
  beds: number | null;
  sizeSqm: number | null;
  coverImageUrl: string | null;
  isFeatured: boolean;
  roomType: { name: string } | null;
};

export function formatFcfa(value: number, currency = "XOF") {
  if (currency !== "XOF") {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  }
  return `${new Intl.NumberFormat("fr-FR").format(value).replace(/ | /g, " ")} F`;
}

export interface RoomCardProps {
  room: RoomCardRoom;
  /** URL de destination. Par défaut `/rooms/{slug}`. */
  href?: string;
  /** Index dans la liste, utilisé pour échelonner l'animation d'apparition. */
  index?: number;
  /** Affiche la description courte sous les caractéristiques. */
  showDescription?: boolean;
  /** Dates sélectionnées ailleurs sur la page (recherche `/stays`) : active le bloc "contexte dates". */
  showAvailability?: boolean;
  isAvailable?: boolean;
  /** Nombre de nuits sélectionnées ; si fourni, affiche le total du séjour en pied de carte. */
  nights?: number;
}

/**
 * Carte chambre réutilisable (image, badges, prix, caractéristiques, CTA).
 * Utilisée sur `/stays` (avec contexte de dates/disponibilité) et sur le
 * carrousel de la page d'accueil (sans dates, avec description courte).
 */
export function RoomCard({
  room,
  href,
  index = 0,
  showDescription = false,
  showAvailability = false,
  isAvailable = true,
  nights,
}: RoomCardProps) {
  const unavailable = showAvailability && !isAvailable;
  const hasDatesContext = typeof nights === "number";

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease, delay: (index % 4) * 0.06 }}
    >
      <Link href={href ?? `/rooms/${room.slug}`} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          {room.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={room.coverImageUrl}
              alt={room.name}
              loading="lazy"
              className={`h-full w-full object-cover img-zoom ${unavailable ? "grayscale" : ""}`}
            />
          ) : (
            <div className="h-full w-full grid place-items-center text-muted-foreground text-sm">Photo à venir</div>
          )}
          {unavailable && <div className="absolute inset-0 bg-[rgb(26_12_9/0.5)]" />}

          <div className="absolute left-4 top-4 flex gap-2">
            {room.isFeatured && !unavailable && (
              <span className="bg-card text-foreground text-xs font-semibold px-2.5 py-1.5">Coup de cœur</span>
            )}
            {unavailable && (
              <span className="bg-card text-foreground text-xs font-semibold px-2.5 py-1.5">Complet à ces dates</span>
            )}
            {room.discountPercent > 0 && !unavailable && (
              <span className="bg-red-600 text-white text-xs font-semibold px-2.5 py-1.5">-{room.discountPercent}%</span>
            )}
          </div>

          {!unavailable && (
            <span className="price-stamp absolute left-4 bottom-4">
              <small>la nuit, dès</small>
              {room.discountPercent > 0 ? (
                <>
                  <span className="text-xs line-through opacity-70">
                    {formatFcfa(room.basePrice, room.currency)}
                  </span>
                  <strong>{formatFcfa(getDiscountedPrice(room.basePrice, room.discountPercent), room.currency)}</strong>
                </>
              ) : (
                <strong>{formatFcfa(room.basePrice, room.currency)}</strong>
              )}
            </span>
          )}
        </div>

        <div className="pt-5">
          <p className="eyebrow text-muted-foreground">
            {room.roomType?.name || "Chambre"}
            {room.roomNumber ? ` · N° ${room.roomNumber}` : ""}
          </p>
          <h3 className="font-display mt-1.5 text-[1.75rem] leading-tight truncate">{room.name}</h3>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            {room.sizeSqm ? <li className="inline-flex items-center gap-1.5"><Maximize2 className="h-3.5 w-3.5" />{room.sizeSqm} m²</li> : null}
            <li className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{room.maxGuests} pers.</li>
            {room.beds ? <li className="inline-flex items-center gap-1.5"><BedDouble className="h-3.5 w-3.5" />{room.beds} lit{room.beds > 1 ? "s" : ""}</li> : null}
          </ul>
          {showDescription && room.shortDescription ? (
            <p className="mt-2 text-sm text-muted-foreground truncate">{room.shortDescription}</p>
          ) : null}

          <div className={`mt-4 pt-4 border-t border-border flex items-center gap-4 ${hasDatesContext ? "justify-between" : "justify-end"}`}>
            {hasDatesContext && (
              !unavailable && (nights ?? 0) > 0 ? (
                <p className="text-sm">
                  <span className="font-semibold tabular">{formatFcfa(getDiscountedPrice(room.basePrice, room.discountPercent) * (nights ?? 0), room.currency)}</span>
                  <span className="text-muted-foreground"> · {nights} nuit{(nights ?? 0) > 1 ? "s" : ""}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Changez de dates pour la réserver</p>
              )
            )}
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-text">
              {unavailable ? "Détails" : hasDatesContext ? "Réserver" : "Voir la chambre"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
