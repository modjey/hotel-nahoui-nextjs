"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addDays, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

function Stepper({
  label,
  hint,
  value,
  min,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-[0.9375rem] font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`Retirer ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-10 w-10 border border-border grid place-items-center hover:border-foreground disabled:opacity-30 disabled:hover:border-border"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center tabular font-semibold">{value}</span>
        <button
          type="button"
          aria-label={`Ajouter ${label.toLowerCase()}`}
          onClick={() => onChange(value + 1)}
          className="h-10 w-10 border border-border grid place-items-center hover:border-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

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

  const nights = checkIn && checkOut ? differenceInCalendarDays(checkOut, checkIn) : 0;
  const fmt = (d: Date) => format(d, isMobile ? "d MMM" : "EEE d MMM", { locale: fr });

  const fieldClass =
    "group text-left px-5 py-3.5 lg:px-6 lg:py-4 border-b sm:border-b-0 sm:border-r border-white/35 hover:bg-white/10 transition-colors focus-visible:outline-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
      className="w-full max-w-5xl bg-primary p-1.5 shadow-[var(--shadow-elevated)]"
    >
      <div className="border border-white/80 text-white flex flex-col sm:flex-row items-stretch">
        <div className="hidden lg:flex flex-col justify-center px-6 border-r border-white/35">
          <span className="font-display text-2xl leading-none whitespace-nowrap">Votre séjour</span>
        </div>

        {/* Dates */}
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={`${fieldClass} sm:flex-[1.6]`}>
              <span className="eyebrow block text-white/85">Arrivée — Départ</span>
              <span className="mt-1 block text-[1.0625rem] font-medium truncate first-letter:uppercase">
                {checkIn && checkOut
                  ? `${fmt(checkIn)} → ${fmt(checkOut)}`
                  : checkIn
                    ? `${fmt(checkIn)} → ?`
                    : "Choisir les dates"}
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
              disabled={(date) => date < new Date()}
              numberOfMonths={isMobile ? 1 : 2}
            />
            <div className="flex items-center justify-between gap-4 p-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                {nights > 0 ? `${nights} nuit${nights > 1 ? "s" : ""}` : "Sélectionnez vos dates"}
              </span>
              <button type="button" onClick={() => setDatePickerOpen(false)} className="btn-fill-editorial !min-h-10 !py-2">
                Valider
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Voyageurs */}
        <Popover open={guestPickerOpen} onOpenChange={setGuestPickerOpen}>
          <PopoverTrigger asChild>
            <button type="button" className={`${fieldClass} sm:flex-1`}>
              <span className="eyebrow block text-white/85">Voyageurs</span>
              <span className="mt-1 block text-[1.0625rem] font-medium">
                {adults} adulte{adults > 1 ? "s" : ""}
                {children > 0 ? ` · ${children} enfant${children > 1 ? "s" : ""}` : ""}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 rounded-none" align="start">
            <div className="divide-y divide-border">
              <Stepper label="Adultes" hint="13 ans et plus" value={adults} min={1} onChange={setAdults} />
              <Stepper label="Enfants" hint="2 à 12 ans" value={children} min={0} onChange={setChildren} />
            </div>
            <button type="button" onClick={() => setGuestPickerOpen(false)} className="btn-fill-editorial w-full mt-3">
              Valider
            </button>
          </PopoverContent>
        </Popover>

        {/* Recherche */}
        <div className="p-2 sm:p-2.5 flex">
          <button
            type="button"
            onClick={handleSearch}
            className="btn-on-brand w-full sm:w-auto sm:px-7 whitespace-nowrap"
          >
            Voir les disponibilités
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
