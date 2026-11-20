"use client";
import { displayRoomName } from "@/lib/room-display";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, Check, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { HOTEL_CONTACT, whatsappLink } from "@/lib/hotel-contact";
import { useAuth } from "@/components/auth/AuthProvider";
import { api, ApiError } from "@/lib/api-client";
import HotelBookingCalendar, { type AvailabilityMap, buildAvailabilityMap, isRangeAvailable, mergeAvailability, stayTotalFromMap } from "@/components/site/HotelBookingCalendar";
import { getDiscountedPrice } from "@/lib/pricing";
import { type Room, fcfa } from "@/components/site/booking/room";
import { BookingConfirmationDialog } from "@/components/site/booking/BookingConfirmationDialog";

/** Tunnel de demande de réservation (dates → coordonnées → récapitulatif), affiché en plein écran. */
export function BookingFlowOverlay({ room, initialCheckIn, initialCheckOut, initialAdults, initialChildren, bookings, calendarDays = {}, defaultMinStay = 1, holdHours = 24, onClose }: { room: Room | null; initialCheckIn: Date | undefined; initialCheckOut: Date | undefined; initialAdults: number; initialChildren: number; bookings: { id: string; checkIn: string; checkOut: string; status: string }[]; calendarDays?: AvailabilityMap; defaultMinStay?: number; holdHours?: number; onClose: () => void }) {
  const { user, refresh } = useAuth();
  const steps = ["Dates", "Détails", "Récapitulatif"] as const;
  type Step = typeof steps[number];
  const [step, setStep] = useState<Step>(() => {
    const storedState = localStorage.getItem('bookingFlowState');
    if (storedState) {
      try {
        const state = JSON.parse(storedState);
        const restoredStep = state.step === 'Auth' ? 'Détails' : state.step;
        localStorage.removeItem('bookingFlowState');
        return (steps as readonly string[]).includes(restoredStep) ? restoredStep : 'Dates';
      } catch {
        return 'Dates';
      }
    }
    // Le tunnel commence toujours par l'étape 1 (dates préremplies depuis la fiche chambre).
    return 'Dates';
  });
  const stepIndex = steps.indexOf(step);
  // Demande envoyée : référence affichée sur l'écran de confirmation (null tant que rien n'est envoyé).
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);
  const confirmed = confirmedRef !== null;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  // Erreur d'envoi affichée dans le tunnel, toujours avec un recours (WhatsApp, téléphone).
  const [sendError, setSendError] = useState<string | null>(null);
  const [editContact, setEditContact] = useState(false);
  const hasSyncedUserInfo = useRef(false);

  // Local state for editable fields
  const [checkIn, setCheckIn] = useState<Date | undefined>(() => {
    const storedState = localStorage.getItem('bookingFlowState');
    if (storedState) {
      try {
        const state = JSON.parse(storedState);
        return state.checkIn ? new Date(state.checkIn) : initialCheckIn;
      } catch {
        return initialCheckIn;
      }
    }
    return initialCheckIn;
  });
  const [checkOut, setCheckOut] = useState<Date | undefined>(() => {
    const storedState = localStorage.getItem('bookingFlowState');
    if (storedState) {
      try {
        const state = JSON.parse(storedState);
        return state.checkOut ? new Date(state.checkOut) : initialCheckOut;
      } catch {
        return initialCheckOut;
      }
    }
    return initialCheckOut;
  });
  const maxGuests = room?.maxGuests ?? 10;
  const [adults, setAdults] = useState(() => {
    const clamp = (v: number) => Math.min(v || 1, maxGuests);
    const storedState = localStorage.getItem('bookingFlowState');
    if (storedState) {
      try {
        const state = JSON.parse(storedState);
        return clamp(state.adults || initialAdults || 1);
      } catch {
        return clamp(initialAdults || 1);
      }
    }
    return clamp(initialAdults || 1);
  });
  const [children, setChildren] = useState(() => {
    const clamp = (v: number) => Math.min(v || 0, Math.max(0, maxGuests - adults));
    const storedState = localStorage.getItem('bookingFlowState');
    if (storedState) {
      try {
        const state = JSON.parse(storedState);
        return clamp(state.children || initialChildren || 0);
      } catch {
        return clamp(initialChildren || 0);
      }
    }
    return clamp(initialChildren || 0);
  });
  const [guestInfo, setGuestInfo] = useState(() => {
    const storedState = localStorage.getItem('bookingFlowState');
    if (storedState) {
      try {
        const state = JSON.parse(storedState);
        return state.guestInfo || { firstName: '', lastName: '', email: '', phone: '' };
      } catch {
        return { firstName: '', lastName: '', email: '', phone: '' };
      }
    }
    return { firstName: '', lastName: '', email: '', phone: '' };
  });

  // Store booking flow state in window for OAuth redirect
  useEffect(() => {
    (window as unknown as { __bookingFlowState?: unknown }).__bookingFlowState = {
      step,
      checkIn,
      checkOut,
      adults,
      children,
      guestInfo,
    };
  }, [step, checkIn, checkOut, adults, children, guestInfo]);

  // À l'ouverture, revalide la session (renouvelée si possible) pour afficher le bon état :
  // un visiteur dont la session a expiré voit d'emblée la vérification par code.
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Bloque le défilement de la page derrière le tunnel ; Échap ferme le tunnel.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    // Signale le tunnel ouvert : le pop-up des offres flash ne doit pas l'interrompre.
    document.body.dataset.bookingFlow = 'open';
    const onKey = (e: KeyboardEvent) => {
      // Avec le modal du code ouvert, Échap ne ferme que le modal.
      if (e.key === 'Escape' && !sending && !confirmed) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      delete document.body.dataset.bookingFlow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, sending, confirmed]);

  // Sync guest info when user changes, but only if guestInfo is empty and not already synced
  useEffect(() => {
    if (user && !hasSyncedUserInfo.current && !guestInfo.firstName && !guestInfo.lastName && !guestInfo.email) {
      setGuestInfo({
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: (user.phone || '').replace(/^\+?225\s*/, ''),
      });
      hasSyncedUserInfo.current = true;
    }
  }, [user, guestInfo.firstName, guestInfo.lastName, guestInfo.email]);

  const contactComplete = Boolean(guestInfo.firstName.trim() && guestInfo.lastName.trim() && guestInfo.email.trim() && guestInfo.phone.replace(/\D/g, '').length >= 8);
  const showContactFields = !user || editContact || !contactComplete;

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 3;
  const nightlyPrice = room ? getDiscountedPrice(room.basePrice, room.discountPercent) : 0;

  const overlayAvailabilityMap = useMemo(() => mergeAvailability(calendarDays, buildAvailabilityMap(bookings)), [calendarDays, bookings]);
  // Total nuit par nuit (tarifs saisonniers) ; le serveur recalcule de toute façon le montant.
  const total = checkIn && checkOut && checkOut > checkIn ? stayTotalFromMap(overlayAvailabilityMap, checkIn, checkOut, nightlyPrice) : nightlyPrice * nights;
  const averageNightly = nights > 0 ? Math.round(total / nights) : nightlyPrice;

  // Vérification locale et immédiate : aucune nuit de la plage choisie ne doit être indisponible
  const rangeFullyAvailable = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return true;
    return isRangeAvailable(overlayAvailabilityMap, checkIn, checkOut);
  }, [checkIn, checkOut, overlayAvailabilityMap]);

  // Real-time availability check whenever the selected dates change
  const [fetchedAvailability, setAvailability] = useState<boolean | null>(null);
  const datesSelected = Boolean(room?.slug && checkIn && checkOut && checkOut > checkIn);
  // Sans plage valide, la disponibilité est inconnue (dérivée, pas d'état à réinitialiser).
  const availability = datesSelected ? fetchedAvailability : null;
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [conflictingBookings, setConflictingBookings] = useState<{ id: string; checkIn: string; checkOut: string; status: string }[]>([]);
  const [isOwnBooking, setIsOwnBooking] = useState(false);
  // Motif d'indisponibilité renvoyé par le serveur : fermeture ou séjour minimum ("minStay:3").
  const [unavailableReason, setUnavailableReason] = useState<string | null>(null);
  const unavailableMessage = isOwnBooking
    ? "Vous avez déjà une réservation pour ces dates"
    : unavailableReason === "closed"
      ? "Chambre fermée à la réservation sur ces dates"
      : unavailableReason?.startsWith("minStay:")
        ? `Séjour minimum de ${unavailableReason.split(":")[1]} nuits pour cette date d'arrivée`
        : "Chambre indisponible pour ces dates";

  useEffect(() => {
    if (!room?.slug || !checkIn || !checkOut || checkOut <= checkIn) return;
    let cancelled = false;
    (async () => {
      setCheckingAvailability(true);
      try {
        const res = await fetch(`/api/rooms/${room.slug}/availability?checkIn=${encodeURIComponent(checkIn.toISOString())}&checkOut=${encodeURIComponent(checkOut.toISOString())}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.success) {
          setAvailability(data.data.available);
          setConflictingBookings(data.data.conflictingBookings || []);
          setIsOwnBooking(data.data.isOwnBooking || false);
          setUnavailableReason(
            data.data.closed ? "closed" : data.data.meetsMinStay === false ? `minStay:${data.data.minStay}` : null,
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Erreur vérification disponibilité", err);
          setAvailability(null);
        }
      } finally {
        if (!cancelled) setCheckingAvailability(false);
      }
    })();
    return () => { cancelled = true; };
  }, [room?.slug, checkIn, checkOut, user?.id]);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 'Dates') {
      if (!checkIn) newErrors.checkIn = 'Date d\'arrivée requise';
      if (!checkOut) newErrors.checkOut = 'Date de départ requise';
      if (checkIn && checkOut && checkOut <= checkIn) newErrors.dates = 'Le départ doit être après l\'arrivée';
      if (checkIn && checkOut && checkOut > checkIn && !rangeFullyAvailable) newErrors.dates = 'Cette période contient des nuits déjà réservées. Choisissez une plage entièrement disponible.';
      else if (checkIn && checkOut && checkOut > checkIn && availability === false) newErrors.dates = unavailableMessage;
    }
    if (step === 'Détails') {
      if (!guestInfo.firstName.trim()) newErrors.firstName = 'Prénom requis';
      if (!guestInfo.lastName.trim()) newErrors.lastName = 'Nom requis';
      // L'email reçoit la confirmation ; le téléphone sert à l'hôtel pour convenir du règlement.
      if (!guestInfo.email.trim()) {
        newErrors.email = 'Email requis pour recevoir la confirmation';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email.trim())) {
        newErrors.email = 'Adresse email invalide';
      }
      if (guestInfo.phone.replace(/\D/g, '').length < 8) {
        newErrors.phone = 'Numéro requis : l\'hôtel vous rappelle pour convenir du règlement';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => {
    if (validateStep()) {
      const idx = steps.indexOf(step);
      if (idx < steps.length - 1) setStep(steps[idx + 1]);
    }
  };

  const prev = () => {
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
    else onClose();
  };

  const canContinue =
    (step === 'Dates' && checkIn && checkOut && checkOut > checkIn && rangeFullyAvailable && !checkingAvailability && availability !== false) ||
    (step === 'Détails' && guestInfo.firstName.trim() && guestInfo.lastName.trim() && guestInfo.email.trim() && guestInfo.phone.trim()) ||
    step === 'Récapitulatif';

  const inputCls = "h-12 w-full rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-foreground transition-all";

  const fullPhone = () => {
    const raw = guestInfo.phone.trim();
    return raw.startsWith('+') ? raw : `+225 ${raw}`;
  };
  const whatsappText = `Bonjour, je souhaite réserver la chambre « ${room?.name ?? ''} »${checkIn && checkOut ? ` du ${format(checkIn, 'd MMMM', { locale: fr })} au ${format(checkOut, 'd MMMM yyyy', { locale: fr })}` : ''} pour ${adults + children} personne${adults + children > 1 ? 's' : ''}.`;

  /** Envoie la demande (avec ou sans compte : l\u2019hôtel crée le compte en coulisse si besoin). */
  const submitRequest = async () => {
    if (!room || !checkIn || !checkOut) {
      setSendError('Choisissez vos dates avant d\'envoyer la demande.');
      setStep('Dates');
      return;
    }
    const availabilityResponse = await fetch(`/api/rooms/${room.slug}/availability?checkIn=${encodeURIComponent(checkIn.toISOString())}&checkOut=${encodeURIComponent(checkOut.toISOString())}`);
    const availabilityResult = await availabilityResponse.json();
    if (!availabilityResponse.ok || !availabilityResult.success || !availabilityResult.data?.available) {
      if (availabilityResult.data?.isOwnBooking) {
        setSendError('Vous avez déjà une demande pour ces dates : retrouvez-la dans « Mes réservations ».');
        return;
      }
      setSendError(availabilityResult.error?.message || 'Ces dates viennent d\'être prises. Choisissez d\'autres dates ou écrivez-nous.');
      return;
    }

    // Le client API renouvelle seul une session expirée (jeton de 15 min) avant d'abandonner.
    try {
      const data = await api.post<{ booking: { reference: string | null } }>('/api/bookings', {
        roomId: room.id,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        adults,
        children,
        guestFirstName: guestInfo.firstName.trim(),
        guestLastName: guestInfo.lastName.trim(),
        guestEmail: guestInfo.email.trim(),
        guestPhone: fullPhone(),
      });
      setConfirmedRef(data.booking.reference ?? '');
      refresh();
    } catch (err) {
      setSendError(err instanceof ApiError && err.message ? err.message : 'La demande n\'a pas pu être envoyée.');
    }
  };

  /** Bouton principal du récapitulatif : envoi direct, sans code ni compte à créer. */
  const handleSendRequest = async () => {
    setSendError(null);
    setSending(true);
    try {
      await submitRequest();
    } catch {
      setSendError('Connexion impossible pour le moment.');
    } finally {
      setSending(false);
    }
  };

  const nightsLabel = `${nights} nuit${nights > 1 ? 's' : ''}`;
  const datesLabel = checkIn && checkOut
    ? `${format(checkIn, 'd MMM', { locale: fr })} → ${format(checkOut, 'd MMM yyyy', { locale: fr })}`
    : 'Dates à choisir';
  const guestsLabel = `${adults} adulte${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} enfant${children > 1 ? 's' : ''}` : ''}`;

  const contactLinks = (
    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
      <a href={whatsappLink(whatsappText)} target="_blank" rel="noopener noreferrer" className="link-underline text-foreground min-h-11 inline-flex items-center">
        Écrire sur WhatsApp
      </a>
      <a href={`tel:${HOTEL_CONTACT.phones[0].replace(/\s/g, '')}`} className="link-underline text-foreground min-h-11 inline-flex items-center">
        Appeler le {HOTEL_CONTACT.phones[0]}
      </a>
    </div>
  );

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="booking-flow-title" className="h-[100dvh] bg-background flex flex-col">
      {/* En-tête compact : quitter, titre et étapes sur une seule ligne en grand écran */}
      <header className="shrink-0 border-b border-border">
        <div className="mx-auto max-w-7xl px-5 lg:px-10 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <button onClick={onClose} className="inline-flex items-center gap-2 min-h-11 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" aria-hidden="true" /> Quitter
          </button>
          <h1 id="booking-flow-title" className="font-display text-2xl lg:text-3xl leading-none">Demande de réservation</h1>
          <ol className="ml-auto flex items-center gap-2 sm:gap-4" aria-label="Étapes">
            {steps.map((s, i) => {
              const active = i === stepIndex;
              const done = i < stepIndex;
              return (
                <li key={s} className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
                  <div className={`h-8 w-8 grid place-items-center text-xs font-medium border transition-all shrink-0 ${
                    done ? "bg-ink text-white border-ink"
                    : active ? "bg-primary text-white border-primary"
                    : "bg-background text-muted-foreground border-border"
                  }`}>
                    {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                  </div>
                  <span className={`text-sm ${active ? "text-foreground font-medium" : "hidden md:inline text-muted-foreground"}`}>{s}</span>
                  {i < steps.length - 1 && <span className="hidden md:inline-block h-px w-6 bg-border" aria-hidden="true" />}
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto">
      <div className="mx-auto max-w-7xl px-5 lg:px-10 py-5 lg:py-6">
        {/* Étape 1 : le calendrier a déjà son propre résumé (dates, voyageurs, total) et prend toute la largeur. */}
        <div className={`grid grid-cols-1 gap-5 lg:gap-8 items-start ${step === "Dates" ? "" : "lg:grid-cols-[minmax(0,1fr)_19rem]"}`}>
          {/* Contenu de l'étape */}
          <div className="order-2 lg:order-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === "Dates" && (
                  <div className="space-y-3">
                    <div className="space-y-3">
                      <HotelBookingCalendar
                        availability={overlayAvailabilityMap}
                        basePrice={nightlyPrice}
                        currencyLabel={room?.currency === "XOF" ? "FCFA" : room?.currency ?? "FCFA"}
                        monthsToShow={2}
                        defaultMinStay={defaultMinStay}
                        maxGuestsPerRoom={room?.maxGuests ?? 4}
                        initialCheckIn={checkIn ?? null}
                        initialCheckOut={checkOut ?? null}
                        onSelectionChange={(ci, co) => {
                          setCheckIn(ci ?? undefined);
                          setCheckOut(co ?? undefined);
                        }}
                        onGuestsChange={(guests) => {
                          const maxGuests = room?.maxGuests ?? guests.adults + guests.children;
                          const nextAdults = Math.min(guests.adults, maxGuests);
                          setAdults(nextAdults);
                          setChildren(Math.min(guests.children, maxGuests - nextAdults));
                        }}
                      />
                      {errors.dates && <p className="mt-2 text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.dates}</p>}

                      {checkIn && checkOut && checkOut > checkIn && (
                        !rangeFullyAvailable ? (
                          <div className="p-3 bg-destructive/10">
                            <p className="text-sm font-medium text-destructive flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              Cette période contient des nuits déjà réservées. Choisissez une plage entièrement disponible.
                            </p>
                          </div>
                        ) : checkingAvailability ? (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin" />
                            Vérification de la disponibilité…
                          </p>
                        ) : availability === false ? (
                          <div className="p-3 bg-destructive/10">
                            <p className="text-sm font-medium text-destructive flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              {unavailableMessage}
                            </p>
                            {conflictingBookings.length > 0 && (
                              <div className="mt-1">
                                {conflictingBookings.map((booking, idx) => (
                                  <div key={idx} className="text-xs text-muted-foreground">
                                    {new Date(booking.checkIn).toLocaleDateString('fr-FR')} – {new Date(booking.checkOut).toLocaleDateString('fr-FR')}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="text-muted-foreground">{nights} nuit{nights > 1 ? "s" : ""} · {room?.location.city && room.location.city.trim().toLowerCase() !== room.location.name.trim().toLowerCase() ? `${room.location.city}, ${room.location.name}` : room?.location.name}</span>
                        {checkIn && checkOut && checkOut > checkIn && rangeFullyAvailable && !checkingAvailability && availability === true && (
                          <span className="text-foreground flex items-center gap-1 text-xs font-medium">
                            <Check className="h-3.5 w-3.5" />
                            Disponible
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {step === "Détails" && (
                  <div className="border border-border p-6 sm:p-7 bg-card">
                    <h2 className="font-display text-2xl">Vos coordonnées</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{user ? "Vous êtes connecté : nous utilisons vos coordonnées. L\u2019hôtel vous rappelle pour convenir du règlement." : "L\u2019hôtel vous rappelle à ce numéro pour convenir du règlement. Aucun compte à créer."}</p>
                    {showContactFields ? (
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                          <span className="text-sm font-medium">Prénom</span>
                          <input value={guestInfo.firstName} onChange={(e) => setGuestInfo({...guestInfo, firstName: e.target.value})} autoComplete="given-name" className={`mt-1.5 ${inputCls}`} aria-invalid={Boolean(errors.firstName)} />
                          {errors.firstName && <p className="mt-1 text-sm text-destructive">{errors.firstName}</p>}
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium">Nom</span>
                          <input value={guestInfo.lastName} onChange={(e) => setGuestInfo({...guestInfo, lastName: e.target.value})} autoComplete="family-name" className={`mt-1.5 ${inputCls}`} aria-invalid={Boolean(errors.lastName)} />
                          {errors.lastName && <p className="mt-1 text-sm text-destructive">{errors.lastName}</p>}
                        </label>
                      </div>
                      <label className="block">
                        <span className="text-sm font-medium">Téléphone</span>
                        <div className="mt-1.5 flex">
                          <span className="inline-flex items-center px-3 h-12 border border-r-0 border-border bg-muted text-muted-foreground text-sm tabular" aria-hidden="true">+225</span>
                          <input
                            value={guestInfo.phone}
                            onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})}
                            placeholder="07 00 00 00 00"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel-national"
                            aria-label="Téléphone (indicatif +225)"
                            aria-invalid={Boolean(errors.phone)}
                            className={inputCls}
                          />
                        </div>
                        {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone}</p>}
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium">Email</span>
                        <span className="text-sm text-muted-foreground"> · pour recevoir la confirmation</span>
                        <input value={guestInfo.email} onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})} type="email" autoComplete="email" inputMode="email" className={`mt-1.5 ${inputCls}`} aria-invalid={Boolean(errors.email)} />
                        {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
                      </label>
                    </div>
                    ) : (
                      <div className="mt-6 flex items-start justify-between gap-4 border border-border bg-secondary/40 p-4">
                        <div className="min-w-0 text-sm">
                          <div className="font-medium truncate">{guestInfo.firstName} {guestInfo.lastName}</div>
                          <div className="text-muted-foreground truncate">{guestInfo.email}</div>
                          <div className="text-muted-foreground tabular">+225 {guestInfo.phone}</div>
                        </div>
                        <button type="button" onClick={() => setEditContact(true)} className="shrink-0 underline underline-offset-4 text-sm min-h-11">Modifier</button>
                      </div>
                    )}
                    <p className="mt-6 text-sm text-muted-foreground">
                      Vous préférez discuter directement ?{" "}
                      <a href={whatsappLink(whatsappText)} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 text-foreground">Réserver sur WhatsApp</a>
                    </p>
                  </div>
                )}

                {step === "Récapitulatif" && (
                  <div className="border border-border p-6 sm:p-7 bg-card">
                    <h2 className="font-display text-2xl">Vérifiez et envoyez</h2>
                    <dl className="mt-5 text-sm divide-y divide-border">
                      {[
                        ["Dates", `${datesLabel} (${nightsLabel})`],
                        ["Voyageurs", guestsLabel],
                        ["Nom", `${guestInfo.firstName} ${guestInfo.lastName}`],
                        ["Téléphone", fullPhone()],
                        ["Email", guestInfo.email],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-4 py-3">
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="font-medium text-right break-all">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6">
                      <button type="button" onClick={() => setStep("Détails")} className="text-sm underline underline-offset-4 min-h-11">Modifier mes coordonnées</button>
                      <p className="text-sm text-muted-foreground">
                        En envoyant, vous acceptez nos{" "}
                        <a href="/conditions" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 text-foreground">conditions</a>.
                      </p>
                    </div>

                    {sendError && (
                      <div role="alert" className="mt-6 border border-destructive/40 bg-destructive/5 p-4">
                        <p className="text-sm font-medium text-destructive">{sendError}</p>
                        <p className="mt-1 text-sm text-foreground/80">Vous pouvez aussi réserver directement avec l&apos;hôtel :</p>
                        {contactLinks}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Résumé de la chambre, visible à chaque étape */}
          {/* Masqué à l'étape 1 (résumé intégré au calendrier) et, sur mobile, au récapitulatif (déjà détaillé). */}
          <aside className={`order-1 lg:order-2 ${step === "Dates" ? "hidden" : step === "Récapitulatif" ? "hidden lg:block" : ""}`} aria-label="Votre séjour">
            <div className="border border-border p-4 sm:p-5 bg-card">
              <div className="flex gap-3 sm:gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img decoding="async" src={room?.coverImageUrl || '/assets/hero.png'} alt="" className="h-16 w-16 sm:h-24 sm:w-24 object-cover shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm text-muted-foreground">{room?.roomType.name}</div>
                  <div className="font-display text-lg sm:text-xl leading-tight">{room ? displayRoomName(room.name, room.roomNumber) : ""}</div>
                  <div className="text-sm text-muted-foreground">{datesLabel} · {guestsLabel}</div>
                  <div className="mt-1 font-display text-lg tabular lg:hidden">{fcfa(total, room?.currency)}</div>
                </div>
              </div>
              {/* Détail du prix et conditions : sur mobile, la barre du bas porte déjà la réassurance. */}
              <div className="hidden lg:block mt-4 pt-4 border-t border-border space-y-2 text-sm">
                <div className="flex justify-between gap-4"><span className="text-muted-foreground">{averageNightly !== nightlyPrice ? "En moyenne " : ""}{fcfa(averageNightly, room?.currency)} × {nightsLabel}</span><span className="tabular">{fcfa(total, room?.currency)}</span></div>
                <div className="pt-2 border-t border-border flex justify-between font-display text-xl">
                  <span>Total</span><span className="tabular">{fcfa(total, room?.currency)}</span>
                </div>
              </div>
              <p className="hidden lg:block mt-4 text-sm text-foreground/80 leading-relaxed">
                <Shield className="inline h-4 w-4 mr-1 -mt-0.5 text-brand-text" aria-hidden="true" />
                Aucun paiement en ligne : la chambre vous est réservée {holdHours} h, l&apos;hôtel vous contacte pour le règlement puis confirme.
              </p>
              {room?.cancellationPolicy && <p className="hidden lg:block mt-2 text-sm text-muted-foreground">{room.cancellationPolicy}</p>}
            </div>
          </aside>
        </div>

      </div>
      </main>

      <footer className="shrink-0 border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-5 lg:px-10 py-3 flex items-center justify-between gap-4">
          <button onClick={prev} className="text-sm text-muted-foreground hover:text-foreground shrink-0 min-h-11">{step === "Dates" ? "Retour à la chambre" : "Étape précédente"}</button>
          {step === "Récapitulatif" ? (
            <button
              type="button"
              onClick={handleSendRequest}
              disabled={sending}
              className="btn-fill-editorial !min-h-12 !px-6 sm:!px-8 flex-col !gap-0 leading-tight disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? 'Envoi en cours…' : (
                <>
                  <span>Envoyer ma demande</span>
                  <span className="text-xs tabular">{fcfa(total, room?.currency)}</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => next()}
              disabled={!canContinue}
              className="btn-fill-editorial !min-h-12 !px-8 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuer
            </button>
          )}
        </div>
      </footer>

      {/* Confirmation : fenêtre par-dessus le récapitulatif ; la fermer ramène à la fiche chambre. */}
      <BookingConfirmationDialog
        open={confirmed}
        onClose={onClose}
        reference={confirmedRef ?? ''}
        roomName={room ? displayRoomName(room.name, room.roomNumber) : ''}
        roomImage={room?.coverImageUrl}
        datesLabel={datesLabel}
        nightsLabel={nightsLabel}
        guestsLabel={guestsLabel}
        totalLabel={fcfa(total, room?.currency)}
        holdHours={holdHours}
        phone={fullPhone()}
        email={guestInfo.email.trim()}
        whatsappHref={whatsappLink(`Bonjour, je souhaite confirmer ma demande de réservation ${confirmedRef ?? ''} (${room?.name ?? ''}).`)}
        hotelPhone={HOTEL_CONTACT.phones[0]}
        showMyBookings={Boolean(user)}
      />

    </div>
  );
}
