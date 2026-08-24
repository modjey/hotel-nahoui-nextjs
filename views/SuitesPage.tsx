"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Heart, Star, SlidersHorizontal, MapPin, Search, X, Users, Bed, Bath, Calendar } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { api } from "@/lib/api-client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Room = {
  id: string;
  slug: string;
  name: string;
  roomNumber: string | null;
  shortDescription: string | null;
  basePrice: number;
  currency: string;
  maxGuests: number;
  beds: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  coverImageUrl: string | null;
  isFeatured: boolean;
  roomType: { id: string; slug: string; name: string };
  location: { id: string; slug: string; name: string; city: string | null };
};

const sorts = ["Choix de l'éditeur", "Prix · croissant", "Prix · décroissant"] as const;
type Sort = typeof sorts[number];

function SuitesPageContent() {
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomAvailability, setRoomAvailability] = useState<Record<string, boolean>>({});

  // Get search params from URL
  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");
  const adultsParam = searchParams.get("adults");
  const childrenParam = searchParams.get("children");

  const defaultCheckIn = useMemo(() => addDays(startOfDay(new Date()), 14), []);
  const defaultCheckOut = useMemo(() => addDays(defaultCheckIn, 3), [defaultCheckIn]);
  const [checkIn, setCheckIn] = useState<Date | undefined>(() => checkInParam ? new Date(checkInParam) : defaultCheckIn);
  const [checkOut, setCheckOut] = useState<Date | undefined>(() => checkOutParam ? new Date(checkOutParam) : defaultCheckOut);
  const [adults, setAdults] = useState(() => adultsParam ? parseInt(adultsParam, 10) : 2);
  const [children, setChildren] = useState(() => childrenParam ? parseInt(childrenParam, 10) : 0);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [guestPickerOpen, setGuestPickerOpen] = useState(false);
  const availabilityCheckIn = checkIn ?? defaultCheckIn;
  const availabilityCheckOut = checkOut ?? addDays(availabilityCheckIn, 3);
  const availabilityCheckInIso = useMemo(() => availabilityCheckIn.toISOString(), [availabilityCheckIn]);
  const availabilityCheckOutIso = useMemo(() => availabilityCheckOut.toISOString(), [availabilityCheckOut]);
  const roomIdsKey = useMemo(() => rooms.map((room) => room.id).join(","), [rooms]);
  const totalGuests = adults + children;

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

  // Check availability for each room when dates are provided
  useEffect(() => {
    if (rooms.length === 0) return;

    (async () => {
      try {
        const res = await fetch(
          `/api/rooms/availability?checkIn=${encodeURIComponent(availabilityCheckInIso)}&checkOut=${encodeURIComponent(availabilityCheckOutIso)}`
        );
        const data = await res.json();
        const availability = data.success ? data.data.availability : {};
        setRoomAvailability(availability);
      } catch (err) {
        console.error("Error checking room availability:", err);
        setRoomAvailability({});
      }
    })();
  }, [availabilityCheckInIso, availabilityCheckOutIso, roomIdsKey, rooms.length]);

  const [cat, setCat] = useState("Tous");
  const [sort, setSort] = useState<Sort>(sorts[0]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [locationId, setLocationId] = useState("Toutes");
  const [minGuests, setMinGuests] = useState(totalGuests);
  const [minBeds, setMinBeds] = useState(0);
  const [minBaths, setMinBaths] = useState(0);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categories = useMemo(() => {
    const types = new Set(rooms.map((r) => r.roomType.name));
    return ["Tous", ...Array.from(types)];
  }, [rooms]);

  const locationOptions = useMemo(() => {
    const map = new Map<string, string>();
    rooms.forEach((r) => map.set(r.location.id, r.location.name));
    return [{ id: "Toutes", name: "Toutes les localisations" }, ...Array.from(map, ([id, name]) => ({ id, name }))];
  }, [rooms]);

  const priceBounds = useMemo(() => {
    if (rooms.length === 0) return { min: 0, max: 1_000_000 };
    const prices = rooms.map((r) => r.basePrice);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [rooms]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = rooms.filter((r) => {
      if (cat !== "Tous" && r.roomType.name !== cat) return false;
      if (locationId !== "Toutes" && r.location.id !== locationId) return false;
      if (maxPrice !== null && r.basePrice > maxPrice) return false;
      if (r.maxGuests < minGuests) return false;
      if ((r.beds ?? 0) < minBeds) return false;
      if ((r.bathrooms ?? 0) < minBaths) return false;
      if (featuredOnly && !r.isFeatured) return false;
      if (q) {
        const haystack = [
          r.name,
          r.shortDescription ?? "",
          r.roomType.name,
          r.location.name,
          r.location.city ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    if (sort === "Prix · croissant") out = [...out].sort((a, b) => a.basePrice - b.basePrice);
    if (sort === "Prix · décroissant") out = [...out].sort((a, b) => b.basePrice - a.basePrice);
    return out;
  }, [rooms, cat, sort, maxPrice, search, locationId, minGuests, minBeds, minBaths, featuredOnly]);

  const uniqueLocations = useMemo(
    () => new Set(rooms.map((r) => r.location.id)).size,
    [rooms],
  );
  const showAvailability = Object.keys(roomAvailability).length > 0;
  const availableResultsCount = showAvailability
    ? list.filter((room) => roomAvailability[room.id] !== false).length
    : list.length;
  const availabilityDateLabel = `${format(availabilityCheckIn, "dd/MM/yyyy", { locale: fr })} – ${format(availabilityCheckOut, "dd/MM/yyyy", { locale: fr })}`;
  const stayDatesLabel = `${format(availabilityCheckIn, "dd MMM yyyy", { locale: fr })} → ${format(availabilityCheckOut, "dd MMM yyyy", { locale: fr })}`;
  const displayedGuests = totalGuests;
  const filterResultsCount = showAvailability ? availableResultsCount : list.length;

  const activeFiltersCount =
    (cat !== "Tous" ? 1 : 0) +
    (locationId !== "Toutes" ? 1 : 0) +
    (search ? 1 : 0) +
    (minGuests > 0 && minGuests !== totalGuests ? 1 : 0) +
    (minBeds > 0 ? 1 : 0) +
    (minBaths > 0 ? 1 : 0) +
    (featuredOnly ? 1 : 0) +
    (maxPrice !== null && maxPrice < priceBounds.max ? 1 : 0);

  const resetFilters = () => {
    setCat("Tous");
    setLocationId("Toutes");
    setSearch("");
    setMinGuests(0);
    setMinBeds(0);
    setMinBaths(0);
    setFeaturedOnly(false);
    setMaxPrice(null);
    setSort(sorts[0]);
  };

  const updateAdults = (value: number) => {
    const nextAdults = Math.max(1, value);
    setAdults(nextAdults);
    setMinGuests(nextAdults + children);
  };

  const updateChildren = (value: number) => {
    const nextChildren = Math.max(0, value);
    setChildren(nextChildren);
    setMinGuests(adults + nextChildren);
  };

  const updateGuestFilter = (value: number) => {
    setMinGuests(value);
    if (value > 0) {
      setAdults(value);
      setChildren(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
            <aside>
              <div className="space-y-6 pr-2">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-8 w-20 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-20 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            </aside>
            <main>
              <div className="mb-6 pb-4 border-b border-border space-y-4">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-20 w-full rounded-[1.75rem]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-12">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (value: number, currency = "XOF") =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const filtersContent = (
    <div className="space-y-6 pr-2">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5">
              {activeFiltersCount}
            </span>
          )}
        </h2>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Recherche</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, ville, type..."
            className="w-full h-10 pl-9 pr-9 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Type de chambre</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`h-8 px-3 text-xs border transition-all ${
                cat === c
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> Localisation
        </label>
        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          {locationOptions.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">
          Prix max · {formatPrice(maxPrice ?? priceBounds.max)}
        </label>
        <input
          type="range"
          min={priceBounds.min}
          max={priceBounds.max || 1}
          step={1000}
          value={maxPrice ?? priceBounds.max}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="accent-primary w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{formatPrice(priceBounds.min)}</span>
          <span>{formatPrice(priceBounds.max)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> Voyageurs min
        </label>
        <select
          value={minGuests}
          onChange={(e) => updateGuestFilter(Number(e.target.value))}
          className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value={0}>Tous</option>
          {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Bed className="h-3.5 w-3.5" /> Lits min
        </label>
        <select
          value={minBeds}
          onChange={(e) => setMinBeds(Number(e.target.value))}
          className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value={0}>Tous</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Bath className="h-3.5 w-3.5" /> Salles de bain min
        </label>
        <select
          value={minBaths}
          onChange={(e) => setMinBaths(Number(e.target.value))}
          className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
        >
          <option value={0}>Tous</option>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors">
        <input
          type="checkbox"
          checked={featuredOnly}
          onChange={(e) => setFeaturedOnly(e.target.checked)}
          className="accent-primary h-4 w-4"
        />
        Vedettes uniquement
      </label>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      {/* Hero strip */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-16 pb-12">
          <span className="eyebrow text-primary">La collection</span>
          <h1 className="font-display mt-5 text-4xl sm:text-5xl lg:text-6xl font-light text-balance leading-[1.05]">
            Chambres & Suites
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl">
            {list.length} séjour{list.length > 1 ? "s" : ""} · sélectionnés cette saison dans {uniqueLocations} localisation{uniqueLocations > 1 ? "s" : ""}.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block">
            {filtersContent}
          </aside>

          {/* Main grid */}
          <main>
            {/* Toolbar */}
            <div className="mb-6 pb-4 border-b border-border space-y-4">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{list.length}</span> séjour{list.length > 1 ? "s" : ""} trouvé{list.length > 1 ? "s" : ""}
                    {showAvailability && (
                      <span> · {availableResultsCount} disponible{availableResultsCount > 1 ? "s" : ""} du {availabilityDateLabel}</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden btn-fill-editorial"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filtrer
                    {filterResultsCount > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center bg-primary-foreground px-1.5 text-[10px] text-primary">
                        {filterResultsCount}
                      </span>
                    )}
                  </button>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    className="h-10 rounded-full border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 xl:w-auto"
                  >
                    {sorts.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-3 rounded-[1.75rem] border border-border bg-secondary/30 p-2">
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-3 rounded-[1.35rem] bg-background px-5 py-4 text-left shadow-sm hover:bg-background/80 transition-colors">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Dates du séjour</div>
                        <div className="mt-1 text-sm sm:text-base font-semibold text-foreground">{stayDatesLabel}</div>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="space-y-3">
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
                      <div className="flex justify-end p-3 border-t border-border">
                        <button
                          type="button"
                          onClick={() => setDatePickerOpen(false)}
                          className="h-10 px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          Confirmer
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Popover open={guestPickerOpen} onOpenChange={setGuestPickerOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-3 rounded-[1.35rem] bg-background px-5 py-4 text-left shadow-sm hover:bg-background/80 transition-colors">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Voyageurs</div>
                        <div className="mt-1 text-sm sm:text-base font-semibold text-foreground">
                          {displayedGuests} voyageur{displayedGuests > 1 ? "s" : ""}
                        </div>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="start">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Adultes</div>
                          <div className="text-xs text-muted-foreground">13 ans et plus</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => updateAdults(adults - 1)} className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:border-foreground">−</button>
                          <span className="w-6 text-center">{adults}</span>
                          <button type="button" onClick={() => updateAdults(adults + 1)} className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:border-foreground">+</button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">Enfants</div>
                          <div className="text-xs text-muted-foreground">2–12 ans</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => updateChildren(children - 1)} className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:border-foreground">−</button>
                          <span className="w-6 text-center">{children}</span>
                          <button type="button" onClick={() => updateChildren(children + 1)} className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:border-foreground">+</button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGuestPickerOpen(false)}
                        className="w-full h-10 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        Confirmer
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {list.length === 0 ? (
              <div className="text-center py-32 text-muted-foreground">
                <MapPin className="mx-auto h-6 w-6 mb-3" />
                Aucun séjour ne correspond à ces filtres.
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-12"
              >
                {list.map((room, index) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    index={index}
                    isAvailable={roomAvailability[room.id] !== false}
                    showAvailability={showAvailability}
                    checkIn={availabilityCheckIn}
                    checkOut={availabilityCheckOut}
                    adults={adults}
                    childrenCount={children}
                  />
                ))}
              </motion.div>
            )}
          </main>
        </div>
      </div>

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-[2rem] px-6 pb-6 pt-5 lg:hidden">
          <SheetHeader className="mb-6 text-left">
            <SheetTitle className="font-display text-2xl">Filtrer les séjours</SheetTitle>
          </SheetHeader>
          {filtersContent}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(false)}
            className="mt-6 h-12 w-full rounded-full bg-primary text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90"
          >
            Voir les résultats
          </button>
        </SheetContent>
      </Sheet>

      <Footer />
    </div>
  );
}

export function SuitesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Nav />
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-10">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
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
  adults,
  childrenCount,
}: {
  room: Room;
  index?: number;
  isAvailable?: boolean;
  showAvailability?: boolean;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  childrenCount: number;
}) {
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: room.currency,
      maximumFractionDigits: 0,
    }).format(value);
  const detailsParams = new URLSearchParams({
    checkIn: checkIn.toISOString(),
    checkOut: checkOut.toISOString(),
    adults: adults.toString(),
    children: childrenCount.toString(),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: (index % 4) * 0.06 }}
    >
      <Link href={`/rooms/${room.slug}?${detailsParams.toString()}`} className={`group block rounded-2xl ${showAvailability && !isAvailable ? "ring-2 ring-red-500/70 ring-offset-4 ring-offset-background" : ""}`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
          {room.coverImageUrl ? (
            <img
              src={room.coverImageUrl}
              alt={room.name}
              loading="lazy"
              className="h-full w-full object-cover img-zoom"
            />
          ) : (
            <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
              Aucune image
            </div>
          )}
          {showAvailability && !isAvailable && (
            <div className="absolute inset-0 bg-black/55 backdrop-grayscale" />
          )}
          {room.isFeatured && (
            <span className="absolute top-4 left-4 bg-background/95 backdrop-blur text-[11px] font-medium tracking-wide uppercase px-3 py-1.5 rounded-full">
              Vedette
            </span>
          )}
          {showAvailability && !isAvailable && (
            <span className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-red-600 text-white text-center text-xs font-semibold tracking-wide uppercase px-4 py-3 rounded-full shadow-2xl">
              Indisponible pour ces dates
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
            }}
            className="absolute top-4 right-4 h-9 w-9 grid place-items-center rounded-full bg-background/40 backdrop-blur-sm text-white hover:bg-background/60 transition-colors"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>

        <div className="pt-4 px-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-[17px] leading-snug text-foreground truncate">
              {room.name}
              {room.roomNumber && <span className="text-xs text-muted-foreground ml-2">N° {room.roomNumber}</span>}
            </h3>
            <div className="flex items-center gap-1 text-sm text-foreground shrink-0">
              <Star className="h-3.5 w-3.5 fill-current" />
              4.85
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {room.location.city ? `${room.location.city}, ` : ""}
            {room.location.name}
          </p>
          <p className="text-sm mt-2.5">
            <span className="font-medium text-foreground">{formatPrice(room.basePrice)}</span>
            <span className="text-muted-foreground"> · nuit · {room.maxGuests} voyageur{room.maxGuests > 1 ? "s" : ""}</span>
          </p>
          {showAvailability && (
            <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              isAvailable
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {isAvailable ? "Disponible pour ces dates" : "Indisponible pour ces dates"}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
