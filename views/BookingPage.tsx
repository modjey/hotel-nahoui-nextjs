"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar as CalendarIcon, Check, ChevronLeft, CreditCard, Lock, Shield, Sparkles, Users, AlertCircle, Phone, Mail, MapPin, CreditCard as CardIcon, Apple, Wallet } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { api } from "@/lib/api-client";
import { AuthModal } from "@/components/auth/AuthModal";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format, addDays, differenceInDays } from "date-fns";

export function BookingPage() {
  const params = useParams<{ id: string }>();
  const slug = params?.id;
  const router = useRouter();
  const navigate = (path: string) => router.push(path);

  const steps = ["Dates", "Guests", "Auth", "Details", "Recap", "Payment"] as const;
  type Step = typeof steps[number];

  const [step, setStep] = useState<Step>("Dates");
  const stepIndex = steps.indexOf(step);

  // Form state
  const [room, setRoom] = useState<{ id: string; name: string; basePrice: number; currency: string; maxGuests: number; location: { city?: string; name: string }; roomType: { name: string }; coverImageUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string; phone?: string } | null>(null);
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const [checkIn, setCheckIn] = useState<Date | undefined>(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14));
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [guestInfo, setGuestInfo] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvc: '' });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'google'>('card');
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch room data
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const data = await api.get<{ room: { id: string; name: string; basePrice: number; currency: string; maxGuests: number; location: { city?: string; name: string }; roomType: { name: string }; coverImageUrl?: string } }>(`/api/rooms/${slug}`);
        setRoom(data.room);
        setCheckOut(addDays(new Date(), 14 + 3));
      } catch (err) {
        console.error("Erreur chargement chambre", err);
        setError("Chambre introuvable");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Check if user is authenticated
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ user: { name?: string; email?: string; phone?: string } }>("/auth/me");
        setUser(data.user);
      } catch {
        setUser(null);
      }
    })();
  }, [authModalOpen]);

  // Pre-fill guest info when user is authenticated
  const guestInfoFromUser = useMemo(() => {
    if (user) {
      return {
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
      };
    }
    return guestInfo;
  }, [user]);

  useEffect(() => {
    if (user) {
      setGuestInfo(guestInfoFromUser);
    }
  }, [user, guestInfoFromUser]);

  // Redirect to confirmation page after booking is confirmed
  useEffect(() => {
    if (confirmed) {
      const timer = setTimeout(() => {
        navigate(`/booking-confirmed/${slug}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [confirmed, navigate, slug]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 3;
    const a = checkIn.getTime();
    const b = checkOut.getTime();
    return Math.max(1, Math.round((b - a) / 86400000));
  }, [checkIn, checkOut]);

  const subtotal = (room?.basePrice ?? 0) * nights;
  const cleaning = 0;
  const service = 0;
  const taxes = 0;
  const total = subtotal + cleaning + service + taxes;

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === 'Dates') {
      if (!checkIn) newErrors.checkIn = 'Check-in date is required';
      if (!checkOut) newErrors.checkOut = 'Check-out date is required';
      if (checkIn && checkOut && checkOut <= checkIn) newErrors.dates = 'Check-out must be after check-in';
    }

    if (step === 'Guests') {
      if (adults < 1) newErrors.adults = 'At least 1 adult is required';
      if (room && adults + children > room.maxGuests) newErrors.guests = `Maximum ${room.maxGuests} guests allowed`;
    }

    if (step === 'Details') {
      if (!guestInfo.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!guestInfo.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!guestInfo.email.trim()) newErrors.email = 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) newErrors.email = 'Invalid email address';
      if (!guestInfo.phone.trim()) newErrors.phone = 'Phone number is required';
    }

    if (step === 'Payment' && paymentMethod === 'card') {
      if (!card.name.trim()) newErrors.cardName = 'Cardholder name is required';
      if (!card.number.replace(/\s/g, '')) newErrors.cardNumber = 'Card number is required';
      if (card.number.replace(/\s/g, '').length < 13) newErrors.cardNumber = 'Invalid card number';
      if (!card.expiry) newErrors.expiry = 'Expiry date is required';
      if (!card.cvc || card.cvc.length < 3) newErrors.cvc = 'CVC is required';
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
    else navigate(`/rooms/${slug}`);
  };

  const canContinue =
    (step === 'Dates' && checkIn && checkOut) ||
    (step === 'Guests' && adults >= 1 && room && adults + children <= room.maxGuests) ||
    (step === 'Auth' && user) ||
    (step === 'Details' && guestInfo.firstName && guestInfo.lastName && guestInfo.email && guestInfo.phone) ||
    (step === 'Recap') ||
    (step === 'Payment' && paymentMethod !== 'card') ||
    (step === 'Payment' && paymentMethod === 'card' && card.name && card.number.replace(/\s/g, '').length >= 12 && card.expiry && card.cvc.length >= 3);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Nav />
        <p>Chargement...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Nav />
        <Link href="/stays" className="text-primary underline">Retour aux séjours</Link>
      </div>
    );
  }

  // Auto-open auth modal on Auth step if user is not authenticated
  const shouldOpenAuthModal = step === 'Auth' && !user;
  useEffect(() => {
    if (shouldOpenAuthModal) {
      setAuthModalOpen(true);
    }
  }, [shouldOpenAuthModal]);

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <div className="mx-auto max-w-6xl px-6 lg:px-10 pt-10 pb-24">
        <button onClick={prev} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> {step === "Dates" ? "Retour à l&apos;annonce" : "Étape précédente"}
        </button>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl mt-6">Confirmer et payer</h1>

        {/* Stepper */}
        <div className="mt-8 flex items-center gap-3 sm:gap-6 flex-wrap">
          {steps.map((s, i) => {
            const active = i === stepIndex;
            const done = i < stepIndex;
            return (
              <div key={s} className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full grid place-items-center text-xs font-medium border transition-all ${
                  done ? "bg-primary text-primary-foreground border-primary"
                  : active ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border"
                }`}>
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-sm ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
                {i < steps.length - 1 && <span className="hidden sm:inline-block h-px w-8 bg-border" />}
              </div>
            );
          })}
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Step content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === "Dates" && (
                  <Section title="Votre voyage" icon={<CalendarIcon className="h-4 w-4" />}>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Arrivée">
                        <input type="date" value={checkIn ? fmt(checkIn) : ''} min={fmt(today)} onChange={(e) => setCheckIn(e.target.value ? new Date(e.target.value) : undefined)} className={inputCls} />
                      </Field>
                      <Field label="Départ">
                        <input type="date" value={checkOut ? fmt(checkOut) : ''} min={checkIn ? fmt(checkIn) : fmt(today)} onChange={(e) => setCheckOut(e.target.value ? new Date(e.target.value) : undefined)} className={inputCls} />
                      </Field>
                    </div>
                    {errors.dates && <p className="mt-2 text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.dates}</p>}
                    <p className="mt-4 text-sm text-muted-foreground">{nights} nuit{nights > 1 ? "s" : ""} · {room.location.city ? `${room.location.city}, ${room.location.name}` : room.location.name}</p>
                  </Section>
                )}

                {step === "Guests" && (
                  <Section title="Qui vient" icon={<Users className="h-4 w-4" />}>
                    <Counter label="Adultes" sub="13 ans et plus" value={adults} setValue={setAdults} min={1} max={room.maxGuests} />
                    <Counter label="Enfants" sub="2–12 ans" value={children} setValue={setChildren} min={0} max={room.maxGuests - adults} />
                    {errors.guests && <p className="mt-2 text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.guests}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">Ce logement accueille jusqu'à {room.maxGuests} voyageurs.</p>
                  </Section>
                )}

                {step === "Auth" && (
                  <Section title="Authentification" icon={<Shield className="h-4 w-4" />}>
                    {user ? (
                      <div className="p-4 rounded-xl bg-secondary/50 text-center">
                        <p className="text-sm text-muted-foreground">Connecté en tant que {user.name || user.email}</p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-secondary/50 text-center">
                        <p className="text-sm text-muted-foreground mb-4">Veuillez vous connecter pour continuer</p>
                        <Button onClick={() => setAuthModalOpen(true)} className="w-full">Se connecter</Button>
                      </div>
                    )}
                  </Section>
                )}

                {step === "Details" && (
                  <Section title="Vos coordonnées" icon={<Users className="h-4 w-4" />}>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Prénom">
                        <input value={guestInfo.firstName} onChange={(e) => setGuestInfo({...guestInfo, firstName: e.target.value})} placeholder="Jean" className={inputCls} />
                        {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>}
                      </Field>
                      <Field label="Nom">
                        <input value={guestInfo.lastName} onChange={(e) => setGuestInfo({...guestInfo, lastName: e.target.value})} placeholder="Adje" className={inputCls} />
                        {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>}
                      </Field>
                    </div>
                    <Field label="Email">
                      <input value={guestInfo.email} onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})} placeholder="email@example.com" type="email" className={inputCls} />
                      {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                    </Field>
                    <Field label="Téléphone">
                      <input value={guestInfo.phone} onChange={(e) => setGuestInfo({...guestInfo, phone: e.target.value})} placeholder="+225 07 00 00 00 00" type="tel" className={inputCls} />
                      {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                    </Field>
                  </Section>
                )}

                {step === "Recap" && (
                  <Section title="Récapitulatif" icon={<Shield className="h-4 w-4" />}>
                    <Row label="Chambre" value={room.name} />
                    <Row label="Dates" value={`${format(checkIn!, 'dd MMM yyyy')} – ${format(checkOut!, 'dd MMM yyyy')} (${nights} nuit${nights > 1 ? 's' : ''})`} />
                    <Row label="Voyageurs" value={`${adults} adulte${adults > 1 ? 's' : ''}${children > 0 ? `, ${children} enfant${children > 1 ? 's' : ''}` : ''}`} />
                    <Row label="Contact" value={`${guestInfo.firstName} ${guestInfo.lastName}`} />
                    <Row label="Email" value={guestInfo.email} />
                    <Row label="Téléphone" value={guestInfo.phone} />
                  </Section>
                )}

                {step === "Payment" && !confirmed && (
                  <Section title="Détails du paiement" icon={<CreditCard className="h-4 w-4" />}>
                    <div className="flex gap-3 mb-6">
                      <button onClick={() => setPaymentMethod('card')} className={`flex-1 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/50'}`}>
                        <CardIcon className="h-6 w-6 mx-auto mb-2" />
                        <div className="text-sm font-medium">Carte bancaire</div>
                      </button>
                      <button onClick={() => setPaymentMethod('apple')} className={`flex-1 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'apple' ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/50'}`}>
                        <Apple className="h-6 w-6 mx-auto mb-2" />
                        <div className="text-sm font-medium">Apple Pay</div>
                      </button>
                      <button onClick={() => setPaymentMethod('google')} className={`flex-1 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'google' ? 'border-primary bg-primary/5' : 'border-border hover:border-foreground/50'}`}>
                        <Wallet className="h-6 w-6 mx-auto mb-2" />
                        <div className="text-sm font-medium">Google Pay</div>
                      </button>
                    </div>

                    {paymentMethod === 'card' && (
                      <>
                        <Field label="Titulaire de la carte">
                          <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="KOUAMÉ ADJE" className={inputCls} />
                          {errors.cardName && <p className="mt-1 text-xs text-destructive">{errors.cardName}</p>}
                        </Field>
                        <Field label="Numéro de carte">
                          <input
                            value={card.number}
                            onChange={(e) => setCard({ ...card, number: e.target.value.replace(/[^\d ]/g, "").slice(0, 19) })}
                            placeholder="4242 4242 4242 4242"
                            className={inputCls}
                          />
                          {errors.cardNumber && <p className="mt-1 text-xs text-destructive">{errors.cardNumber}</p>}
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Expiration">
                            <input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value.slice(0, 5) })} placeholder="MM/YY" className={inputCls} />
                            {errors.expiry && <p className="mt-1 text-xs text-destructive">{errors.expiry}</p>}
                          </Field>
                          <Field label="CVC">
                            <input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="123" className={inputCls} />
                            {errors.cvc && <p className="mt-1 text-xs text-destructive">{errors.cvc}</p>}
                          </Field>
                        </div>
                      </>
                    )}

                    {paymentMethod !== 'card' && (
                      <div className="p-6 rounded-xl bg-secondary/50 text-center">
                        <p className="text-sm text-muted-foreground">You will be redirected to {paymentMethod === 'apple' ? 'Apple Pay' : 'Google Pay'} to complete your payment securely.</p>
                      </div>
                    )}

                    <p className="flex items-center gap-2 text-xs text-muted-foreground mt-4"><Lock className="h-3 w-3" /> Encrypted end-to-end. Demo only - no real payment.</p>
                  </Section>
                )}

                {step === "Payment" && confirmed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="border border-border rounded-3xl p-10 text-center bg-card"
                  >
                    <div className="mx-auto h-14 w-14 rounded-full bg-primary text-primary-foreground grid place-items-center">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h2 className="font-display text-3xl mt-6">Traitement de votre réservation...</h2>
                    <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                      Veuillez patienter pendant que nous confirmons votre réservation.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {!confirmed && (
              <div className="mt-10 flex items-center justify-between">
                <button onClick={prev} className="text-sm text-muted-foreground hover:text-foreground">Retour</button>
                <button
                  onClick={() => {
                    if (step === "Payment") setConfirmed(true);
                    else next();
                  }}
                  disabled={!canContinue}
                  className="h-12 px-8 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {step === "Payment" ? `Confirmer et payer ${new Intl.NumberFormat('fr-FR').format(total)} ${room.currency}` : "Continuer"}
                </button>
              </div>
            )}
          </div>

          {/* Summary */}
          <aside className="lg:col-span-2">
            <div className="lg:sticky lg:top-28 border border-border rounded-3xl p-6 bg-card shadow-[var(--shadow-card)]">
              <div className="flex gap-4">
                <img src={room.coverImageUrl || '/placeholder.jpg'} alt={room.name} className="h-24 w-24 rounded-xl object-cover" />
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{room.roomType.name}</div>
                  <div className="font-display text-lg truncate">{room.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{room.location.city ? `${room.location.city}, ${room.location.name}` : room.location.name}</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border space-y-3 text-sm">
                <Line label={`${new Intl.NumberFormat('fr-FR').format(room.basePrice)} ${room.currency} × ${nights} nuits`} value={`${new Intl.NumberFormat('fr-FR').format(subtotal)} ${room.currency}`} />
                <div className="pt-3 border-t border-border flex justify-between font-display text-lg">
                  <span>Total ({room.currency})</span><span>{new Intl.NumberFormat('fr-FR').format(total)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-secondary/50 text-xs text-muted-foreground">
                Annulation gratuite avant {checkIn ? format(addDays(checkIn, -7), 'dd MMM yyyy') : '-'}.
              </div>
            </div>
          </aside>
        </div>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}

const inputCls = "h-12 w-full rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-foreground transition-all";

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-3xl p-7 bg-card">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{icon}{title}</div>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
function Counter({ label, sub, value, setValue, min, max }: { label: string; sub: string; value: number; setValue: (n: number) => void; min: number; max: number }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setValue(Math.max(min, value - 1))} disabled={value <= min} className="h-9 w-9 rounded-full border border-border grid place-items-center hover:border-foreground disabled:opacity-30">−</button>
        <span className="w-6 text-center">{value}</span>
        <button onClick={() => setValue(Math.min(max, value + 1))} disabled={value >= max} className="h-9 w-9 rounded-full border border-border grid place-items-center hover:border-foreground disabled:opacity-30">+</button>
      </div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 border-b border-border last:border-b-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}
