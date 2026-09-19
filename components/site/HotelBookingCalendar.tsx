"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";

/* ───────────────────────────── Types ───────────────────────────── */

export type DateAvailability = {
  /** false = complet / fermé à la réservation */
  available: boolean;
  /** prix par nuit en devise mineure (ex: XOF, pas de centimes) */
  price?: number;
  /** nombre minimum de nuits si l'arrivée est ce jour-là */
  minStay?: number;
  /** empêche un départ ce jour-là (fermeture au départ) */
  closedToDeparture?: boolean;
};

/** Clé au format "YYYY-MM-DD" (heure locale) */
export type AvailabilityMap = Record<string, DateAvailability>;

/**
 * Construit une AvailabilityMap depuis des réservations : chaque nuit réservée devient
 * indisponible (le jour de départ reste ouvert comme jour d'arrivée).
 * `excludeIds` permet d'ignorer certaines réservations (ex : celle en cours d'édition).
 */
export function buildAvailabilityMap(
  bookings: { id?: string; checkIn: string; checkOut: string; status: string }[],
  excludeIds: string[] = []
): AvailabilityMap {
  const map: AvailabilityMap = {};
  for (const b of bookings) {
    if (b.status === "CANCELLED" || b.status === "COMPLETED") continue;
    if (b.id && excludeIds.includes(b.id)) continue;
    const end = new Date(b.checkOut);
    const d = new Date(b.checkIn);
    d.setHours(0, 0, 0, 0);
    while (d < end) {
      const key = toKey(d);
      map[key] = { available: false };
      d.setDate(d.getDate() + 1);
    }
  }
  return map;
}

export interface GuestCount {
  adults: number;
  children: number;
}

export interface HotelBookingCalendarProps {
  /** Disponibilité par date. Toute date absente est traitée comme disponible au prix de base. */
  availability?: AvailabilityMap;
  /** Prix par nuit utilisé quand une date n'a pas de prix explicite */
  basePrice?: number;
  /** Devise affichée (libellé uniquement, pas de conversion) */
  currencyLabel?: string;
  /** Nombre de mois affichés côte à côte (1 sur mobile automatiquement) */
  monthsToShow?: 1 | 2 | 3;
  /** Séjour minimum par défaut si non précisé pour la date d'arrivée */
  defaultMinStay?: number;
  /** Nombre de nuits maximum consultées en avant pour calculer un départ possible */
  maxLookaheadNights?: number;
  /** Capacité maximale par chambre (adultes + enfants) */
  maxGuestsPerRoom?: number;
  /** Dates présélectionnées ; si elles changent depuis le parent, la sélection interne se resynchronise */
  initialCheckIn?: Date | null;
  initialCheckOut?: Date | null;
  /** Appelé à chaque changement de sélection ; checkOut vaut null tant que le départ n'est pas choisi */
  onSelectionChange?: (checkIn: Date | null, checkOut: Date | null) => void;
  /** Appelé quand le nombre de voyageurs change */
  onGuestsChange?: (guests: GuestCount) => void;
  /** Autorise la sélection de dates passées et la navigation vers les mois précédents (usage admin) */
  allowPastDates?: boolean;
  hotelName?: string;
  className?: string;
}

/* ───────────────────────────── Constantes ───────────────────────────── */

const WEEKDAYS_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/* ───────────────────────────── Utilitaires date ───────────────────────────── */

function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return toKey(a) === toKey(b);
}

function formatPrice(value: number, currencyLabel: string): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(value))} ${currencyLabel}`;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

/** Génère la grille d'un mois : 6 semaines, lundi en premier, jours hors-mois inclus pour l'alignement */
function buildMonthGrid(year: number, month: number): { date: Date; inMonth: boolean }[] {
  const first = new Date(year, month, 1);
  const firstWeekday = (first.getDay() + 6) % 7; // 0 = lundi
  const gridStart = addDays(first, -firstWeekday);
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(gridStart, i);
    cells.push({ date, inMonth: date.getMonth() === month });
  }
  return cells;
}

/* ───────────────────────────── Composant ───────────────────────────── */

export default function HotelBookingCalendar({
  availability = {},
  basePrice = 45000,
  currencyLabel = "FCFA",
  monthsToShow = 2,
  defaultMinStay = 1,
  maxLookaheadNights = 60,
  maxGuestsPerRoom = 4,
  initialCheckIn = null,
  initialCheckOut = null,
  onSelectionChange,
  onGuestsChange,
  allowPastDates = false,
  hotelName,
  className = "",
}: HotelBookingCalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [checkIn, setCheckIn] = useState<Date | null>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<Date | null>(initialCheckOut);

  // Resynchronise la sélection quand les dates initiales changent depuis le parent
  // (comparaison par timestamp pour tolérer des objets Date recréés à chaque render)
  const initCI = initialCheckIn ? initialCheckIn.getTime() : null;
  const initCO = initialCheckOut ? initialCheckOut.getTime() : null;
  const [lastInitial, setLastInitial] = useState({ ci: initCI, co: initCO });
  if (initCI !== lastInitial.ci || initCO !== lastInitial.co) {
    setLastInitial({ ci: initCI, co: initCO });
    setCheckIn(initialCheckIn);
    setCheckOut(initialCheckOut);
  }
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [guests, setGuests] = useState<GuestCount>({ adults: 2, children: 0 });
  const [guestPopoverOpen, setGuestPopoverOpen] = useState(false);
  const guestPopoverRef = useRef<HTMLDivElement>(null);

  const [effectiveMonths, setEffectiveMonths] = useState(monthsToShow);
  useEffect(() => {
    const update = () => setEffectiveMonths(window.innerWidth < 768 ? 1 : monthsToShow);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [monthsToShow]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (guestPopoverRef.current && !guestPopoverRef.current.contains(e.target as Node)) {
        setGuestPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const getInfo = useCallback(
    (date: Date): Required<Pick<DateAvailability, "available" | "price" | "closedToDeparture">> & { minStay: number } => {
      const info = availability[toKey(date)];
      return {
        available: info?.available ?? true,
        price: info?.price ?? basePrice,
        minStay: info?.minStay ?? defaultMinStay,
        closedToDeparture: info?.closedToDeparture ?? false,
      };
    },
    [availability, basePrice, defaultMinStay]
  );

  const isPast = useCallback((date: Date) => date < today, [today]);

  /** Dernière date de départ atteignable depuis l'arrivée, en respectant la disponibilité de chaque nuit */
  const maxCheckout = useMemo(() => {
    if (!checkIn) return null;
    let cursor = checkIn;
    for (let i = 0; i < maxLookaheadNights; i++) {
      const night = addDays(checkIn, i);
      if (!getInfo(night).available) break;
      cursor = addDays(night, 1);
    }
    return cursor;
  }, [checkIn, getInfo, maxLookaheadNights]);

  const minCheckout = useMemo(() => {
    if (!checkIn) return null;
    const minStay = getInfo(checkIn).minStay;
    return addDays(checkIn, Math.max(1, minStay));
  }, [checkIn, getInfo]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return Math.max(0, Math.round((startOfDay(checkOut).getTime() - startOfDay(checkIn).getTime()) / 86400000));
  }, [checkIn, checkOut]);

  const subtotal = useMemo(() => {
    if (!checkIn || nights === 0) return 0;
    let total = 0;
    for (let i = 0; i < nights; i++) {
      total += getInfo(addDays(checkIn, i)).price;
    }
    return total;
  }, [checkIn, nights, getInfo]);

  const isSelectingCheckout = checkIn !== null && checkOut === null;

  function dayStatus(date: Date, inMonth: boolean) {
    const key = toKey(date);
    const info = getInfo(date);
    const disabledBase = (!allowPastDates && isPast(date)) || !inMonth;

    let disabled = disabledBase;
    let isCheckoutCandidate = false;

    if (isSelectingCheckout && checkIn) {
      isCheckoutCandidate = true;
      if (date <= checkIn) {
        disabled = disabledBase || !info.available;
      } else {
        const tooSoon = minCheckout ? date < minCheckout : false;
        const tooFar = maxCheckout ? date > maxCheckout : false;
        const closed = info.closedToDeparture;
        disabled = disabledBase || tooSoon || tooFar || closed;
      }
    } else {
      disabled = disabledBase || !info.available;
    }

    const isCheckIn = checkIn ? sameDay(date, checkIn) : false;
    const isCheckOut = checkOut ? sameDay(date, checkOut) : false;

    let inRange = false;
    if (checkIn && checkOut) {
      inRange = date > checkIn && date < checkOut;
    } else if (checkIn && hoverDate && isSelectingCheckout) {
      const previewEnd = hoverDate > checkIn ? hoverDate : checkIn;
      inRange = date > checkIn && date < previewEnd;
    }

    // Nuit réellement indisponible (réservée) — distinct des dates juste non éligibles au départ
    const unavailable = inMonth && !info.available;

    return { key, info, disabled, unavailable, isCheckIn, isCheckOut, inRange, isCheckoutCandidate };
  }

  function handleDayClick(date: Date, disabled: boolean) {
    if (disabled) return;

    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date);
      setCheckOut(null);
      onSelectionChange?.(date, null);
      return;
    }
    if (isSelectingCheckout) {
      if (date <= checkIn) {
        setCheckIn(date);
        onSelectionChange?.(date, null);
        return;
      }
      setCheckOut(date);
      onSelectionChange?.(checkIn, date);
    }
  }

  function clearSelection() {
    setCheckIn(null);
    setCheckOut(null);
    setHoverDate(null);
    onSelectionChange?.(null, null);
  }

  function goToMonth(offset: number) {
    setViewDate((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      if (allowPastDates) return next;
      const floor = new Date(today.getFullYear(), today.getMonth(), 1);
      return next < floor ? floor : next;
    });
  }

  function updateGuests(patch: Partial<GuestCount>) {
    const next = { ...guests, ...patch };
    next.adults = Math.max(1, next.adults);
    next.children = Math.max(0, next.children);
    const capacity = maxGuestsPerRoom;
    if (next.adults + next.children > capacity) {
      next.adults = Math.min(next.adults, capacity);
      next.children = Math.min(next.children, Math.max(0, capacity - next.adults));
    }
    setGuests(next);
    onGuestsChange?.(next);
  }

  const monthsData = Array.from({ length: effectiveMonths }, (_, i) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth() + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), cells: buildMonthGrid(d.getFullYear(), d.getMonth()) };
  });

  const canGoPrev = allowPastDates || viewDate.getFullYear() > today.getFullYear() ||
    (viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() > today.getMonth());

  return (
    <div
      className={`w-full bg-[#FBFAF7] text-[#1C1B19] ${className}`}
      style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" }}
    >
      <div className="mx-auto max-w-5xl border border-[#DDD8CD]">
        {/* En-tête */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DDD8CD] px-6 py-5">
          <div>
            {hotelName && (
              <p className="font-display text-lg text-[#1C1B19]">
                {hotelName}
              </p>
            )}
            <p className="text-sm text-[#6B655A]">Sélectionnez vos dates d&apos;arrivée et de départ</p>
          </div>

          {/* Sélecteur voyageurs */}
          <div className="relative" ref={guestPopoverRef}>
            <button
              type="button"
              onClick={() => setGuestPopoverOpen((v) => !v)}
              className="flex items-center gap-2 border border-[#DDD8CD] px-4 py-2 text-sm hover:border-[#2F4538] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F4538]"
              aria-expanded={guestPopoverOpen}
            >
              <span>
                {guests.adults + guests.children} pers.
              </span>
              <span aria-hidden className="text-[#6B655A]">⌄</span>
            </button>
            {guestPopoverOpen && (
              <div className="absolute right-0 z-20 mt-2 w-64 border border-[#DDD8CD] bg-white p-4 shadow-[0_8px_24px_rgba(28,27,25,0.08)]">
                <GuestStepper
                  label="Adultes"
                  value={guests.adults}
                  min={1}
                  onChange={(v) => updateGuests({ adults: v })}
                />
                <GuestStepper
                  label="Enfants"
                  value={guests.children}
                  min={0}
                  onChange={(v) => updateGuests({ children: v })}
                />
                <p className="mt-2 text-xs text-[#6B655A]">
                  Jusqu&apos;à {maxGuestsPerRoom} personnes
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Calendrier */}
          <div className="flex-1 px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                disabled={!canGoPrev}
                aria-label="Mois précédent"
                className="grid h-8 w-8 place-items-center border border-[#DDD8CD] text-[#1C1B19] hover:border-[#2F4538] disabled:cursor-not-allowed disabled:opacity-30"
              >
                ‹
              </button>
              <div className="flex gap-10">
                {monthsData.map((m, i) => (
                  <p key={i} className="font-display text-base">
                    {MONTHS_FR[m.month]} {m.year}
                  </p>
                ))}
              </div>
              <button
                type="button"
                onClick={() => goToMonth(1)}
                aria-label="Mois suivant"
                className="grid h-8 w-8 place-items-center border border-[#DDD8CD] text-[#1C1B19] hover:border-[#2F4538]"
              >
                ›
              </button>
            </div>

            <div className={`grid gap-8 ${effectiveMonths === 1 ? "grid-cols-1" : "sm:grid-cols-2"}`}>
              {monthsData.map((m, mi) => (
                <div key={mi}>
                  <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-[#6B655A]">
                    {WEEKDAYS_FR.map((w) => (
                      <div key={w}>{w}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {m.cells.map(({ date, inMonth }, ci) => {
                      const { info, disabled, unavailable, isCheckIn, isCheckOut, inRange, isCheckoutCandidate } =
                        dayStatus(date, inMonth);
                      const selected = isCheckIn || isCheckOut;

                      return (
                        <button
                          key={ci}
                          type="button"
                          disabled={disabled}
                          onMouseEnter={() => setHoverDate(date)}
                          onFocus={() => setHoverDate(date)}
                          onClick={() => handleDayClick(date, disabled)}
                          aria-pressed={selected}
                          aria-label={`${formatShortDate(date)}${
                            unavailable ? ", complet" : inMonth && !disabled ? `, ${formatPrice(info.price, currencyLabel)}` : ""
                          }`}
                          className={[
                            "relative flex h-12 flex-col items-center justify-center text-xs transition-colors",
                            !inMonth ? "invisible" : "",
                            unavailable ? "cursor-not-allowed bg-[#EFEBE2] text-[#B7AF9E] line-through" : "",
                            disabled && !unavailable && inMonth ? "cursor-not-allowed text-[#C9C3B6]" : "",
                            !disabled && inMonth ? "text-[#1C1B19] hover:bg-[#EFEBE2]" : "",
                            selected ? "!bg-[#2F4538] !text-white" : "",
                            inRange && !selected ? "bg-[#E7EEE7]" : "",
                            !disabled && inMonth && !selected && isCheckoutCandidate ? "focus-visible:ring-2 focus-visible:ring-[#2F4538]" : "",
                          ].join(" ")}
                        >
                          <span className="leading-none">{date.getDate()}</span>
                          {inMonth && !disabled && (
                            <span
                              className={`mt-1 text-[10px] leading-none ${
                                selected ? "text-white/85" : "text-[#8A8372]"
                              }`}
                            >
                              {new Intl.NumberFormat("fr-FR", { notation: "compact" }).format(info.price)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-4 text-xs text-[#6B655A]">
              <LegendDot className="bg-white border border-[#DDD8CD]" label="Disponible" />
              <LegendDot className="bg-[#2F4538]" label="Sélectionné" />
              <LegendDot className="bg-[#EFEBE2]" label="Complet" muted />
            </div>
          </div>

          {/* Résumé */}
          <div className="w-full border-t border-[#DDD8CD] bg-white px-6 py-6 lg:w-80 lg:border-l lg:border-t-0">
            <p className="text-xs uppercase tracking-wide text-[#6B655A]">Votre séjour</p>

            <div className="mt-3 flex border border-[#DDD8CD]">
              <div className="flex-1 border-r border-[#DDD8CD] px-3 py-3">
                <p className="text-[11px] text-[#6B655A]">Arrivée</p>
                <p className="text-sm">{checkIn ? formatShortDate(checkIn) : "—"}</p>
              </div>
              <div className="flex-1 px-3 py-3">
                <p className="text-[11px] text-[#6B655A]">Départ</p>
                <p className="text-sm">{checkOut ? formatShortDate(checkOut) : "—"}</p>
              </div>
            </div>

            {checkIn && !checkOut && (
              <p className="mt-3 text-xs text-[#8A8372]">
                Séjour minimum : {getInfo(checkIn).minStay} nuit{getInfo(checkIn).minStay > 1 ? "s" : ""} — choisissez une date de départ
              </p>
            )}

            <div className="mt-4 border-t border-[#DDD8CD] pt-2">
              <GuestStepper
                label="Adultes"
                value={guests.adults}
                min={1}
                onChange={(v) => updateGuests({ adults: v })}
              />
              <GuestStepper
                label="Enfants"
                value={guests.children}
                min={0}
                onChange={(v) => updateGuests({ children: v })}
              />
              <p className="pt-1 text-xs text-[#6B655A]">
                Jusqu&apos;à {maxGuestsPerRoom} personnes
              </p>
            </div>

            {checkIn && checkOut && nights > 0 && (
              <div className="mt-4 space-y-1 border-t border-[#DDD8CD] pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B655A]">Nuits</span>
                  <span>{nights}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-[#6B655A]">Total estimé</span>
                  <span>{formatPrice(subtotal, currencyLabel)}</span>
                </div>
              </div>
            )}

            {(checkIn || checkOut) && (
              <button
                type="button"
                onClick={clearSelection}
                className="mt-2 w-full py-2 text-xs text-[#6B655A] underline-offset-2 hover:underline"
              >
                Effacer les dates
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── Sous-composants ───────────────────────────── */

function GuestStepper({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-[#1C1B19]">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`Diminuer ${label}`}
          className="grid h-6 w-6 place-items-center border border-[#DDD8CD] text-sm disabled:opacity-30"
        >
          −
        </button>
        <span className="w-4 text-center text-sm">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={`Augmenter ${label}`}
          className="grid h-6 w-6 place-items-center border border-[#DDD8CD] text-sm"
        >
          +
        </button>
      </div>
    </div>
  );
}

function LegendDot({ className, label, muted }: { className: string; label: string; muted?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 ${className}`} />
      <span className={muted ? "line-through" : ""}>{label}</span>
    </span>
  );
}
