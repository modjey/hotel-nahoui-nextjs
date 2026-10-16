"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BedDouble, Minus, Plus, Users, Maximize2 } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { api } from "@/lib/api-client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { addDays, differenceInCalendarDays, format, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { getDiscountedPrice } from "@/lib/pricing";


type Room = {
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
  bathrooms: number | null;
  sizeSqm: number | null;
  coverImageUrl: string | null;
  isFeatured: boolean;
  roomType: { id: string; slug: string; name: string };
  location: { id: string; slug: string; name: string; city: string | null };
};

const sorts = ["Prix croissant", "Prix décroissant", "Surface"] as const;
type Sort = typeof sorts[number];

const ease = [0.22, 1, 0.36, 1] as const;

export function formatFcfa(value: number, currency = "XOF") {
  if (currency !== "XOF") {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  }
  return `${new Intl.NumberFormat("fr-FR").format(value).replace(/ | /g, " ")} FCFA`;
}

function Stepper({ label, hint, value, min, onChange }: { label: string; hint: string; value: number; min: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-[0.9375rem] font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`Retirer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="h-10 w-10 border border-border grid place-items-center hover:border-foreground disabled:opacity-30">
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center tabular font-semibold">{value}</span>
        <button type="button" aria-label={`Ajouter ${label.toLowerCase()}`} onClick={() => onChange(value + 1)} className="h-10 w-10 border border-border grid place-items-center hover:border-foreground">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SuitesPageContent() {
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomAvailability, setRoomAvailability] = useState<Record<string, boolean>>({});

  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");
  const adultsParam = searchParams.get("adults");
  const childrenParam = searchParams.get("children");

  const defaultCheckIn = useMemo(() => addDays(startOfDay(new Date()), 14), []);
  const defaultCheckOut = useMemo(() => addDays(defaultCheckIn, 3), [defaultCheckIn]);
  const [checkIn, setCheckIn] = useState<Date | undefined>(() => checkInParam ? new Date(checkInParam) : defaultCheckIn);
  const [checkOut, setCheckOut] = useState<Date | undefined>(() => checkOutParam ? new Date(checkOutParam) : defaultCheckOut);
  const [adults, setAdults] = useState(() => adultsParam ? Math.max(1, parseInt(adultsParam, 10) || 1) : 2);
  const [children, setChildren] = useState(() => childrenParam ? Math.max(0, parseInt(childrenParam, 10) || 0) : 0);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [guestPickerOpen, setGuestPickerOpen] = useState(false);

  const availabilityCheckIn = checkIn ?? defaultCheckIn;
  const availabilityCheckOut = checkOut ?? addDays(availabilityCheckIn, 3);
  const availabilityCheckInIso = useMemo(() => availabilityCheckIn.toISOString(), [availabilityCheckIn]);
  const availabilityCheckOutIso = useMemo(() => availabilityCheckOut.toISOString(), [availabilityCheckOut]);
  const roomIdsKey = useMemo(() => rooms.map((room) => room.id).join(","), [rooms]);
  const totalGuests = adults + children;
  const nights = Math.max(0, differenceInCalendarDays(availabilityCheckOut, availabilityCheckIn));

  const [cat, setCat] = useState("Toutes");
  const [sort, setSort] = useState<Sort>(sorts[0]);
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ rooms: Room[] }>("/api/rooms", { cache: "no-store" });
        setRooms(data.rooms);
      } catch (err) {
        console.error("Erreur chargement chambres", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Disponibilité de chaque chambre pour les dates choisies
  useEffect(() => {
    if (rooms.length === 0) return;
    (async () => {
      try {
        const res = await fetch(
          `/api/rooms/availability?checkIn=${encodeURIComponent(availabilityCheckInIso)}&checkOut=${encodeURIComponent(availabilityCheckOutIso)}`
        );
        const data = await res.json();
        setRoomAvailability(data.success ? data.data.availability : {});
      } catch (err) {
        console.error("Error checking room availability:", err);
        setRoomAvailability({});
      }
    })();
  }, [availabilityCheckInIso, availabilityCheckOutIso, roomIdsKey, rooms.length]);

  // Catégories, avec le prix de départ de chacune
  const categories = useMemo(() => {
    const map = new Map<string, { name: string; from: number; count: number }>();
    rooms.forEach((r) => {
      const price = getDiscountedPrice(r.basePrice, r.discountPercent);
      const prev = map.get(r.roomType.name);
      map.set(r.roomType.name, {
        name: r.roomType.name,
        from: prev ? Math.min(prev.from, price) : price,
        count: (prev?.count ?? 0) + 1,
      });
    });
    return Array.from(map.values()).sort((a, b) => a.from - b.from);
  }, [rooms]);

  const showAvailability = Object.keys(roomAvailability).length > 0;

  const list = useMemo(() => {
    let out = rooms.filter((r) => {
      if (cat !== "Toutes" && r.roomType.name !== cat) return false;
      if (r.maxGuests < totalGuests) return false;
      if (availableOnly && showAvailability && roomAvailability[r.id] === false) return false;
      return true;
    });
    if (sort === "Prix croissant") out = [...out].sort((a, b) => getDiscountedPrice(a.basePrice, a.discountPercent) - getDiscountedPrice(b.basePrice, b.discountPercent));
    if (sort === "Prix décroissant") out = [...out].sort((a, b) => getDiscountedPrice(b.basePrice, b.discountPercent) - getDiscountedPrice(a.basePrice, a.discountPercent));
    if (sort === "Surface") out = [...out].sort((a, b) => (b.sizeSqm ?? 0) - (a.sizeSqm ?? 0));
    // Les chambres disponibles d'abord
    if (showAvailability) {
      out = [...out].sort((a, b) => Number(roomAvailability[b.id] !== false) - Number(roomAvailability[a.id] !== false));
    }
    return out;
  }, [rooms, cat, sort, totalGuests, availableOnly, showAvailability, roomAvailability]);

  const availableCount = showAvailability ? list.filter((r) => roomAvailability[r.id] !== false).length : list.length;
  const fmt = (d: Date) => format(d, "EEE d MMM", { locale: fr });

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      {/* En-tête */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-10 pt-14 pb-24 lg:pt-20 lg:pb-28">
          <span className="eyebrow text-primary !text-[#ff6b75]">Séjourner</span>
          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.98]">Chambres &amp; suites</h1>
            <p className="max-w-md text-[1.0625rem] text-white/80">
              {rooms.length || 28} chambres réparties en {categories.length || 10} catégories, de 23 à 80 m².
              Choisissez vos dates pour voir ce qui est libre.
            </p>
          </div>
        </div>
      </section>

      {/* Barre de séjour */}
      <div className="relative z-20 -mt-12 mx-auto max-w-[1440px] px-5 lg:px-10">
        <div className="bg-primary p-1.5 shadow-[var(--shadow-elevated)]">
          <div className="border border-white/80 text-white flex flex-col md:flex-row">
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <button type="button" className="text-left px-5 py-4 md:flex-[1.6] border-b md:border-b-0 md:border-r border-white/35 hover:bg-white/10">
                  <span className="eyebrow block text-white/85">Arrivée — Départ</span>
                  <span className="mt-1 block text-[1.0625rem] font-medium first-letter:uppercase">
                    {checkIn && checkOut ? `${fmt(checkIn)} → ${fmt(checkOut)}` : "Choisir les dates"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-none" align="start">
                <CalendarPicker
                  mode="range"
                  selected={{ from: checkIn, to: checkOut }}
                  onSelect={(range) => {
                    setCheckIn(range?.from);
                    setCheckOut(range?.to);
                  }}
                  disabled={(date) => date < startOfDay(new Date())}
                  numberOfMonths={2}
                />
                <div className="flex items-center justify-between gap-4 p-3 border-t border-border">
                  <span className="text-sm text-muted-foreground">{nights > 0 ? `${nights} nuit${nights > 1 ? "s" : ""}` : "Sélectionnez vos dates"}</span>
                  <button type="button" onClick={() => setDatePickerOpen(false)} className="btn-fill-editorial !min-h-10 !py-2">Valider</button>
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={guestPickerOpen} onOpenChange={setGuestPickerOpen}>
              <PopoverTrigger asChild>
                <button type="button" className="text-left px-5 py-4 md:flex-1 border-b md:border-b-0 md:border-r border-white/35 hover:bg-white/10">
                  <span className="eyebrow block text-white/85">Voyageurs</span>
                  <span className="mt-1 block text-[1.0625rem] font-medium">
                    {adults} adulte{adults > 1 ? "s" : ""}{children > 0 ? ` · ${children} enfant${children > 1 ? "s" : ""}` : ""}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 rounded-none" align="start">
                <div className="divide-y divide-border">
                  <Stepper label="Adultes" hint="13 ans et plus" value={adults} min={1} onChange={setAdults} />
                  <Stepper label="Enfants" hint="2 à 12 ans" value={children} min={0} onChange={setChildren} />
                </div>
                <button type="button" onClick={() => setGuestPickerOpen(false)} className="btn-fill-editorial w-full mt-3">Valider</button>
              </PopoverContent>
            </Popover>

            <div className="px-5 py-4 md:flex-1 flex items-center">
              <p className="text-[0.9375rem]">
                {loading ? (
                  "Recherche des disponibilités…"
                ) : (
                  <>
                    <strong className="font-display text-2xl font-normal tabular">{availableCount}</strong>{" "}
                    chambre{availableCount > 1 ? "s" : ""} disponible{availableCount > 1 ? "s" : ""}
                    {nights > 0 ? ` · ${nights} nuit${nights > 1 ? "s" : ""}` : ""}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres : catégories + tri */}
      <div className="sticky top-[72px] z-30 mt-10 bg-background/95 backdrop-blur-md border-y border-border">
        <div className="mx-auto max-w-[1440px] px-5 lg:px-10 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 scroll-fade-mask" role="group" aria-label="Filtrer par catégorie">
            {[{ name: "Toutes", from: 0, count: rooms.length }, ...categories].map((c) => {
              const active = c.name === cat;
              return (
                <button
                  key={c.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCat(c.name)}
                  className={`shrink-0 h-10 px-4 text-sm font-medium border transition-colors whitespace-nowrap ${
                    active ? "bg-ink text-white border-ink" : "border-border text-foreground/75 hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {c.name}
                  {c.name !== "Toutes" && <span className={`ml-2 tabular ${active ? "text-white/60" : "text-muted-foreground"}`}>{c.count}</span>}
                </button>
              );
            })}
          </div>
          <label className="hidden md:flex items-center gap-2 text-sm font-medium shrink-0 cursor-pointer">
            <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} className="accent-[var(--brand)] h-4 w-4" />
            Disponibles uniquement
          </label>
          <label className="sr-only" htmlFor="sort-rooms">Trier</label>
          <select
            id="sort-rooms"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-10 border border-border bg-card px-3 text-sm font-medium focus:outline-none focus:border-foreground shrink-0"
          >
            {sorts.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <main className="mx-auto max-w-[1440px] px-5 lg:px-10 py-12 lg:py-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-14">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/5] w-full rounded-none" />
                <Skeleton className="h-6 w-2/3 rounded-none" />
                <Skeleton className="h-4 w-1/2 rounded-none" />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-display text-3xl">Aucune chambre ne correspond.</p>
            <p className="mt-3 text-muted-foreground">
              Essayez une autre catégorie ou moins de voyageurs — notre Grande Mezzanine accueille jusqu&rsquo;à 6 personnes.
            </p>
            <button type="button" onClick={() => { setCat("Toutes"); setAvailableOnly(false); }} className="btn-outline-editorial mt-8">
              Voir toutes les chambres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-14">
            {list.map((room, index) => (
              <RoomCard
                key={room.id}
                room={room}
                index={index}
                isAvailable={roomAvailability[room.id] !== false}
                showAvailability={showAvailability}
                checkIn={availabilityCheckIn}
                checkOut={availabilityCheckOut}
                nights={nights}
                adults={adults}
                childrenCount={children}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export function SuitesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background"><Nav /></div>}>
      <SuitesPageContent />
    </Suspense>
  );
}

function RoomCard({
  room,
  index = 0,
  isAvailable = true,
  showAvailability = false,
  checkIn,
  checkOut,
  nights,
  adults,
  childrenCount,
}: {
  room: Room;
  index?: number;
  isAvailable?: boolean;
  showAvailability?: boolean;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  adults: number;
  childrenCount: number;
}) {
  const unavailable = showAvailability && !isAvailable;
  const detailsParams = new URLSearchParams({
    checkIn: checkIn.toISOString(),
    checkOut: checkOut.toISOString(),
    adults: adults.toString(),
    children: childrenCount.toString(),
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease, delay: (index % 3) * 0.06 }}
    >
      <Link href={`/rooms/${room.slug}?${detailsParams.toString()}`} className="group block">
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
                    {formatFcfa(room.basePrice, room.currency).replace(" FCFA", " F")}
                  </span>
                  <strong>{formatFcfa(getDiscountedPrice(room.basePrice, room.discountPercent), room.currency).replace(" FCFA", " F")}</strong>
                </>
              ) : (
                <strong>{formatFcfa(room.basePrice, room.currency).replace(" FCFA", " F")}</strong>
              )}
            </span>
          )}
        </div>

        <div className="pt-5">
          <p className="eyebrow text-muted-foreground">
            {room.roomType.name}
            {room.roomNumber ? ` · N° ${room.roomNumber}` : ""}
          </p>
          <h3 className="font-display mt-1.5 text-[1.75rem] leading-tight">{room.name}</h3>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            {room.sizeSqm ? <li className="inline-flex items-center gap-1.5"><Maximize2 className="h-3.5 w-3.5" />{room.sizeSqm} m²</li> : null}
            <li className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{room.maxGuests} pers.</li>
            {room.beds ? <li className="inline-flex items-center gap-1.5"><BedDouble className="h-3.5 w-3.5" />{room.beds} lit{room.beds > 1 ? "s" : ""}</li> : null}
          </ul>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-4">
            {!unavailable && nights > 0 ? (
              <p className="text-sm">
                <span className="font-semibold tabular">{formatFcfa(getDiscountedPrice(room.basePrice, room.discountPercent) * nights, room.currency)}</span>
                <span className="text-muted-foreground"> · {nights} nuit{nights > 1 ? "s" : ""}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Changez de dates pour la réserver</p>
            )}
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-text">
              {unavailable ? "Détails" : "Réserver"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
