"use client";
import { displayRoomName } from "@/lib/room-display";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Shield, X, Check, AlertCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { HOTEL_CONTACT, whatsappLink } from "@/lib/hotel-contact";
import { useAuth } from "@/components/auth/AuthProvider";
import HotelBookingCalendar, { type AvailabilityMap, buildAvailabilityMap, isRangeAvailable, mergeAvailability, stayTotalFromMap } from "@/components/site/HotelBookingCalendar";
import { getDiscountedPrice } from "@/lib/pricing";
import { type Room, fcfa } from "@/components/site/booking/room";
import { BookingOtpDialog } from "@/components/site/booking/BookingOtpDialog";
import { toast } from "sonner";

// Aucun fournisseur SMS n'est branché pour l'instant : la vérification passe par email.
// Passer NEXT_PUBLIC_SMS_OTP_ENABLED=true pour proposer à nouveau le choix SMS / email.
const SMS_OTP_ENABLED = process.env.NEXT_PUBLIC_SMS_OTP_ENABLED === 'true';

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
    // Dates déjà choisies sur la fiche chambre : on passe directement aux coordonnées.
    const preset = initialCheckIn && initialCheckOut && initialCheckOut > initialCheckIn;
    return preset ? 'Détails' : 'Dates';
  });
  const stepIndex = steps.indexOf(step);
  // Demande envoyée : référence affichée sur l'écran de confirmation (null tant que rien n'est envoyé).
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);
  const confirmed = confirmedRef !== null;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  // Erreur d'envoi affichée dans le tunnel, toujours avec un recours (WhatsApp, téléphone).
  const [sendError, setSendError] = useState<string | null>(null);
  // Vérification du visiteur non connecté : code reçu par SMS ou email au moment d'envoyer.
  const [verifyChannel, setVerifyChannel] = useState<'SMS' | 'EMAIL'>(SMS_OTP_ENABLED ? 'SMS' : 'EMAIL');
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpMeta, setOtpMeta] = useState({ codeLength: 6, ttlMinutes: 10 });
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

  // Bloque le défilement de la page derrière le tunnel ; Échap ferme le tunnel.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    // Signale le tunnel ouvert : le pop-up des offres flash ne doit pas l'interrompre.
    document.body.dataset.bookingFlow = 'open';
    const onKey = (e: KeyboardEvent) => {
      // Avec le modal du code ouvert, Échap ne ferme que le modal.
      if (e.key === 'Escape' && !sending && !otpOpen) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      delete document.body.dataset.bookingFlow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, sending, otpOpen]);

  // Sync guest info when user changes, but only if guestInfo is empty and not already synced
  useEffect(() => {
    if (user && !hasSyncedUserInfo.current && !guestInfo.firstName && !guestInfo.lastName && !guestInfo.email) {
      setGuestInfo({
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      hasSyncedUserInfo.current = true;
    }
  }, [user, guestInfo.firstName, guestInfo.lastName, guestInfo.email]);

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

  /** Envoie la demande (le visiteur est connecté : session existante ou code vérifié). */
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

    const bookingResponse = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: room.id,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        adults,
        children,
        guestFirstName: guestInfo.firstName.trim(),
        guestLastName: guestInfo.lastName.trim(),
        guestEmail: guestInfo.email.trim(),
        guestPhone: fullPhone(),
      }),
    });
    const bookingResult = await bookingResponse.json();
    if (bookingResult.success && bookingResult.data?.booking) {
      setConfirmedRef(bookingResult.data.booking.reference ?? '');
      refresh();
    } else {
      setSendError(bookingResult.error?.message || 'La demande n\'a pas pu être envoyée.');
    }
  };

  /** Envoie un code de vérification ; renvoie le message d'erreur, ou null si le code est parti. */
  const verifyIdentifier = verifyChannel === 'SMS' ? fullPhone() : guestInfo.email.trim();
  const requestCode = async (): Promise<string | null> => {
    const identifier = verifyIdentifier;
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const json = await res.json();
      if (!json.success) return json.error?.message || 'Le code n\'a pas pu être envoyé.';
      setCodeSentTo(identifier);
      setOtpMeta({ codeLength: json.data?.codeLength ?? 6, ttlMinutes: json.data?.ttlMinutes ?? 10 });
      if (json.data?.debugCode) toast.message(`(dev) Code OTP : ${json.data.debugCode}`);
      return null;
    } catch {
      return 'Connexion impossible pour le moment.';
    }
  };

  /** Bouton principal du récapitulatif : connecté → envoi ; sinon → code de vérification saisi dans un modal. */
  const handleSendRequest = async () => {
    setSendError(null);
    // Code déjà envoyé à ces mêmes coordonnées : on rouvre simplement le modal.
    if (!user && codeSentTo === verifyIdentifier) {
      setOtpOpen(true);
      return;
    }
    setSending(true);
    try {
      if (user) {
        await submitRequest();
        return;
      }
      const err = await requestCode();
      if (err) setSendError(err);
      else setOtpOpen(true);
    } catch {
      setSendError('Connexion impossible pour le moment.');
    } finally {
      setSending(false);
    }
  };

  /** Vérifie le code saisi dans le modal, ouvre la session puis envoie la demande dans la foulée. */
  const handleVerifyAndSend = async (code: string): Promise<string | null> => {
    if (!codeSentTo) return 'Demandez d\'abord un code.';
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          identifier: codeSentTo,
          code,
          name: `${guestInfo.firstName.trim()} ${guestInfo.lastName.trim()}`.trim(),
        }),
      });
      const json = await res.json();
      if (!json.success) return json.error?.message || 'Code incorrect ou expiré.';
    } catch {
      return 'Connexion impossible pour le moment.';
    }
    // Code validé : la session est ouverte, le modal se ferme et la demande part.
    setOtpOpen(false);
    setCodeSentTo(null);
    setSendError(null);
    setSending(true);
    try {
      await submitRequest();
    } catch {
      setSendError('Connexion impossible pour le moment.');
    } finally {
      setSending(false);
    }
    return null;
  };

  const nightsLabel = `${nights} nuit${nights > 1 ? 's' : ''}`;
  const datesLabel = checkIn && checkOut
    ? `${format(checkIn, 'd MMM', { locale: fr })} → ${format(checkOut, 'd MMM yyyy', { locale: fr })}`
    : 'Dates à choisir';
  const guestsLabel = `${adults} adulte${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} enfant${children > 1 ? 's' : ''}` : ''}`;
  const reassurance = `Sans paiement en ligne · chambre bloquée ${holdHours} h · l'hôtel vous rappelle`;

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

  // ─── Écran final : la demande est partie ─────────────────────────────────
  if (confirmed) {
    return (
      <div role="dialog" aria-modal="true" aria-labelledby="booking-flow-title" className="h-screen bg-background overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-16 lg:py-24">
          <div className="h-14 w-14 bg-primary text-primary-foreground grid place-items-center frame-inset" aria-hidden="true">
            <Check className="h-6 w-6" />
          </div>
          <h1 id="booking-flow-title" className="font-display text-4xl sm:text-5xl mt-8 leading-none text-balance">Votre demande est envoyée</h1>
          <p className="mt-5 text-lg text-foreground/85 text-pretty">
            {room ? displayRoomName(room.name, room.roomNumber) : ''}, {datesLabel} ({nightsLabel}), {guestsLabel}.
            {confirmedRef ? <> Référence <span className="font-mono text-foreground">{confirmedRef}</span>.</> : null}
          </p>

          <ol className="mt-10 space-y-5 border-t border-border pt-8">
            <li className="grid grid-cols-[2rem_1fr] gap-3">
              <span className="font-display text-2xl text-brand-text tabular">1</span>
              <p><strong>La chambre vous est réservée {holdHours} h.</strong> Aucun paiement n&apos;a été demandé.</p>
            </li>
            <li className="grid grid-cols-[2rem_1fr] gap-3">
              <span className="font-display text-2xl text-brand-text tabular">2</span>
              <p><strong>L&apos;hôtel vous contacte</strong> au {fullPhone()} pour convenir du règlement (espèces, Mobile Money, virement).</p>
            </li>
            <li className="grid grid-cols-[2rem_1fr] gap-3">
              <span className="font-display text-2xl text-brand-text tabular">3</span>
              <p><strong>Vous recevez la confirmation</strong> par email à {guestInfo.email.trim()}.</p>
            </li>
          </ol>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href="/bookings" className="btn-fill-editorial">Voir ma demande</a>
            <button type="button" onClick={onClose} className="link-underline text-foreground min-h-11">Revenir à la chambre</button>
          </div>
          <div className="mt-8 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">Une question ou pressé de confirmer ?</p>
            {contactLinks}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="booking-flow-title" className="h-screen bg-background overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 lg:px-10 pt-8 pb-6">
        <button onClick={onClose} className="inline-flex items-center gap-2 min-h-11 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" aria-hidden="true" /> Quitter
        </button>

        <h1 id="booking-flow-title" className="font-display text-4xl sm:text-5xl lg:text-6xl mt-4 leading-none">Demande de réservation</h1>

        {/* Étapes */}
        <ol className="mt-6 flex items-center gap-3 sm:gap-6 flex-wrap" aria-label="Étapes">
          {steps.map((s, i) => {
            const active = i === stepIndex;
            const done = i < stepIndex;
            return (
              <li key={s} className="flex items-center gap-2 sm:gap-3" aria-current={active ? "step" : undefined}>
                <div className={`h-8 w-8 grid place-items-center text-xs font-medium border transition-all shrink-0 ${
                  done ? "bg-ink text-white border-ink"
                  : active ? "bg-primary text-white border-primary"
                  : "bg-background text-muted-foreground border-border"
                }`}>
                  {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                </div>
                <span className={`text-sm hidden sm:inline ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
                {active && <span className="text-sm sm:hidden font-medium text-foreground">{s}</span>}
                {i < steps.length - 1 && <span className="hidden sm:inline-block h-px w-8 bg-border" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Contenu de l'étape */}
          <div className="order-2 lg:order-1 lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === "Dates" && (
                  <div className="border border-border p-5 bg-card">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-4 w-4" />Votre voyage</div>
                    <div className="mt-3 space-y-3">
                      <HotelBookingCalendar
                        availability={overlayAvailabilityMap}
                        basePrice={nightlyPrice}
                        currencyLabel={room?.currency === "XOF" ? "FCFA" : room?.currency ?? "FCFA"}
                        monthsToShow={1}
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
                        <span className="text-muted-foreground">{nights} nuit{nights > 1 ? "s" : ""} · {room?.location.city ? `${room.location.city}, ${room.location.name}` : room?.location.name}</span>
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
                    <p className="mt-1 text-sm text-muted-foreground">L&apos;hôtel vous rappelle à ce numéro pour convenir du règlement. Aucun compte à créer.</p>
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
                    <button type="button" onClick={() => setStep("Détails")} className="mt-2 text-sm underline underline-offset-4 min-h-11">Modifier mes coordonnées</button>

                    {/* Vérification sans compte : code envoyé au moment de l'envoi */}
                    {!user && (
                      <div className="mt-6 border-t border-border pt-6">
                        {codeSentTo === verifyIdentifier ? (
                          <p className="text-sm text-foreground/85">
                            Code envoyé à <span className="font-medium text-foreground break-all">{codeSentTo}</span>.{" "}
                            <button type="button" onClick={() => setOtpOpen(true)} className="underline underline-offset-4 min-h-11">Saisir mon code</button>
                          </p>
                        ) : !SMS_OTP_ENABLED ? (
                          <p className="text-sm text-foreground/85">
                            Pour vérifier vos coordonnées, nous envoyons un code à <span className="font-medium text-foreground break-all">{guestInfo.email.trim()}</span>.
                          </p>
                        ) : (
                          <fieldset>
                            <legend className="text-sm font-medium">Pour vérifier vos coordonnées, recevez un code par</legend>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {([['SMS', 'SMS'], ['EMAIL', 'Email']] as const).map(([value, label]) => (
                                <label key={value} className={`cursor-pointer border px-4 min-h-11 inline-flex items-center text-sm ${verifyChannel === value ? 'border-foreground bg-secondary/60 font-medium' : 'border-border'}`}>
                                  <input type="radio" name="verify-channel" value={value} checked={verifyChannel === value} onChange={() => setVerifyChannel(value)} className="sr-only" />
                                  {label}
                                </label>
                              ))}
                            </div>
                          </fieldset>
                        )}
                      </div>
                    )}

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
          <aside className="lg:col-span-2 order-1 lg:order-2" aria-label="Votre séjour">
            <div className="lg:sticky lg:top-8 border border-border p-4 sm:p-6 bg-card">
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

        <div className="sticky bottom-0 -mx-6 lg:-mx-10 mt-8 border-t border-border bg-background/95 backdrop-blur px-6 lg:px-10 py-4">
          <div className="flex items-center justify-between gap-4">
            <button onClick={prev} className="text-sm text-muted-foreground hover:text-foreground shrink-0 min-h-11">{step === "Dates" ? "Retour à la chambre" : "Étape précédente"}</button>
            {step === "Récapitulatif" ? (
              <button
                type="button"
                onClick={handleSendRequest}
                disabled={sending}
                className="btn-fill-editorial !min-h-14 !px-6 sm:!px-8 flex-col !gap-0 leading-tight disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? 'Envoi en cours…' : (
                  <>
                    <span>{user ? 'Envoyer ma demande' : codeSentTo === verifyIdentifier ? 'Saisir mon code' : 'Recevoir mon code'}</span>
                    <span className="text-xs tabular">{fcfa(total, room?.currency)}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => next()}
                disabled={!canContinue}
                className="btn-fill-editorial !px-8 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuer
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground sm:text-right">{reassurance}</p>
          {step === "Récapitulatif" && (
            <p className="mt-1 text-xs text-muted-foreground sm:text-right">
              En envoyant votre demande, vous acceptez nos{" "}
              <a href="/conditions" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">conditions de réservation</a>.
            </p>
          )}
        </div>
      </div>

      {!user && codeSentTo && (
        <BookingOtpDialog
          open={otpOpen}
          onOpenChange={setOtpOpen}
          destination={codeSentTo}
          codeLength={otpMeta.codeLength}
          ttlMinutes={otpMeta.ttlMinutes}
          onVerify={handleVerifyAndSend}
          onResend={requestCode}
          onEditContact={() => {
            setOtpOpen(false);
            setCodeSentTo(null);
            setStep('Détails');
          }}
        />
      )}
    </div>
  );
}
