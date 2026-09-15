"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

export function SearchBar() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [checkIn, setCheckIn] = useState<Date | undefined>(addDays(new Date(), 14));
  const [checkOut, setCheckOut] = useState<Date | undefined>(addDays(new Date(), 17));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [guestPickerOpen, setGuestPickerOpen] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn.toISOString());
    if (checkOut) params.set("checkOut", checkOut.toISOString());
    params.set("adults", adults.toString());
    params.set("children", children.toString());
    router.push(`/stays?${params.toString()}`);
  };

  const totalGuests = adults + children;

  const dateLabel = checkIn && checkOut
    ? isMobile
      ? `${format(checkIn, "dd MMM", { locale: fr })} → ${format(checkOut, "dd MMM", { locale: fr })}`
      : `${format(checkIn, "dd MMM yyyy", { locale: fr })} → ${format(checkOut, "dd MMM yyyy", { locale: fr })}`
    : checkIn
      ? `Arrivée ${format(checkIn, "dd MMM", { locale: fr })}`
      : "Arrivée → Départ";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      className="w-full max-w-4xl"
    >
      <div className="bg-background border border-border shadow-[var(--shadow-elevated)] flex flex-col sm:flex-row items-stretch sm:items-center gap-0">

        {/* Dates */}
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center sm:flex-[2] px-5 py-3.5 sm:px-6 sm:py-5 hover:bg-secondary/50 transition-colors text-left border-b sm:border-b-0 sm:border-r border-border">
              <Calendar className="h-4 w-4 text-muted-foreground mr-3 shrink-0" />
              <div className="min-w-0">
                <div className="eyebrow text-muted-foreground">Dates du séjour</div>
                <div className="text-sm font-medium truncate mt-1">{dateLabel}</div>
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
                disabled={(date) => date < new Date()}
                numberOfMonths={isMobile ? 1 : 2}
              />
              <div className="flex justify-end p-3 border-t border-border">
                <button
                  onClick={() => setDatePickerOpen(false)}
                  className="btn-fill-editorial"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Guests */}
        <Popover open={guestPickerOpen} onOpenChange={setGuestPickerOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center sm:flex-1 px-5 py-3.5 sm:px-6 sm:py-5 hover:bg-secondary/50 transition-colors text-left border-b sm:border-b-0 border-border">
              <Users className="h-4 w-4 text-muted-foreground mr-3 shrink-0" />
              <div>
                <div className="eyebrow text-muted-foreground">Voyageurs</div>
                <div className="text-sm font-medium mt-1">
                  {totalGuests} voyageur{totalGuests > 1 ? "s" : ""}
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
                <div className="flex items-center gap-3">
                  <button onClick={() => setAdults(Math.max(1, adults - 1))} className="h-8 w-8 border border-border flex items-center justify-center hover:border-foreground">−</button>
                  <span className="w-6 text-center">{adults}</span>
                  <button onClick={() => setAdults(adults + 1)} className="h-8 w-8 border border-border flex items-center justify-center hover:border-foreground">+</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Enfants</div>
                  <div className="text-xs text-muted-foreground">2–12 ans</div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setChildren(Math.max(0, children - 1))} className="h-8 w-8 border border-border flex items-center justify-center hover:border-foreground">−</button>
                  <span className="w-6 text-center">{children}</span>
                  <button onClick={() => setChildren(children + 1)} className="h-8 w-8 border border-border flex items-center justify-center hover:border-foreground">+</button>
                </div>
              </div>
              <button onClick={() => setGuestPickerOpen(false)} className="btn-fill-editorial w-full">
                Confirmer
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Search button */}
        <button
          onClick={handleSearch}
          className="btn-fill-editorial sm:!px-10 w-full sm:w-auto shrink-0"
        >
          <Search className="h-3.5 w-3.5" />
          Rechercher
        </button>
      </div>
    </motion.div>
  );
}
