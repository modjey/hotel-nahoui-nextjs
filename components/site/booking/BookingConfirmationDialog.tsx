"use client";
import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { Check, Clock, Copy, Mail, PhoneCall, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  reference: string;
  roomName: string;
  roomImage?: string | null;
  datesLabel: string;
  nightsLabel: string;
  guestsLabel: string;
  totalLabel: string;
  holdHours: number;
  phone: string;
  email: string;
  whatsappHref: string;
  hotelPhone: string;
  /** Lien « Voir ma demande » : seulement si le client est connecté. */
  showMyBookings?: boolean;
};

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Confirmation d'une demande de réservation : fenêtre par-dessus le tunnel, aux couleurs
 * Nahoui (bandeau rouge à double filet comme le monogramme), qui dit ce qui va se passer.
 */
export function BookingConfirmationDialog({
  open,
  onClose,
  reference,
  roomName,
  roomImage,
  datesLabel,
  nightsLabel,
  guestsLabel,
  totalLabel,
  holdHours,
  phone,
  email,
  whatsappHref,
  hotelPhone,
  showMyBookings = false,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copie refusée par le navigateur : la référence reste lisible à l'écran.
    }
  };

  const steps = [
    { icon: Clock, title: `Chambre réservée ${holdHours} h`, text: "Aucun paiement ne vous a été demandé." },
    { icon: PhoneCall, title: "L'hôtel vous appelle", text: `Au ${phone}, pour convenir du règlement : espèces, Mobile Money ou virement.` },
    { icon: Mail, title: "Confirmation par email", text: `Envoyée à ${email} dès que le séjour est confirmé.` },
  ];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-[rgb(42_23_18/0.55)] backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby="booking-confirmation-summary"
          className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-[30rem] max-h-[calc(100dvh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-background shadow-[0_24px_60px_-12px_rgb(42_23_18/0.45)] focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {/* Bandeau : le double filet blanc reprend le cadre du monogramme Nahoui */}
          <div className="frame-inset relative px-7 pt-8 pb-7 text-center">
            <DialogPrimitive.Close className="absolute right-3 top-3 grid h-11 w-11 place-items-center text-white/90 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" aria-label="Fermer">
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease, delay: 0.1 }}
              className="mx-auto grid h-14 w-14 place-items-center bg-white text-brand-text"
              aria-hidden="true"
            >
              <Check className="h-7 w-7" strokeWidth={2.5} />
            </motion.div>
            <DialogPrimitive.Title className="font-display mt-5 text-[2rem] leading-none text-white">
              Demande envoyée
            </DialogPrimitive.Title>
            <div className="mt-4 inline-flex items-center gap-2 bg-white/15 pl-3 text-sm text-white">
              <span>Référence</span>
              <span className="font-mono tracking-wide">{reference}</span>
              <button
                type="button"
                onClick={copyReference}
                className="grid h-9 w-9 place-items-center hover:bg-white/15"
                aria-label={copied ? "Référence copiée" : "Copier la référence"}
              >
                {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className="px-7 py-6">
            {/* Le séjour demandé */}
            <div id="booking-confirmation-summary" className="flex items-center gap-4 border-b border-border pb-5">
              {roomImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={roomImage} alt="" className="h-16 w-16 shrink-0 object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl leading-tight">{roomName}</p>
                <p className="text-sm text-muted-foreground">{datesLabel} · {nightsLabel} · {guestsLabel}</p>
              </div>
              <p className="font-display text-xl tabular whitespace-nowrap">{totalLabel}</p>
            </div>

            {/* Ce qui va se passer */}
            <ol className="mt-5 space-y-4">
              {steps.map((step, i) => (
                <motion.li
                  key={step.title}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease, delay: 0.25 + i * 0.08 }}
                  className="grid grid-cols-[2.25rem_1fr] gap-3"
                >
                  <span className="grid h-9 w-9 place-items-center border border-border text-brand-text" aria-hidden="true">
                    <step.icon className="h-4 w-4" />
                  </span>
                  <p className="text-sm leading-snug">
                    <strong className="block font-semibold text-foreground">{step.title}</strong>
                    <span className="text-muted-foreground">{step.text}</span>
                  </p>
                </motion.li>
              ))}
            </ol>

            <div className={`mt-7 grid grid-cols-1 gap-3 ${showMyBookings ? "sm:grid-cols-2" : ""}`}>
              {showMyBookings && <a href="/bookings" className="btn-fill-editorial w-full">Voir ma demande</a>}
              <DialogPrimitive.Close className="min-h-12 w-full border border-border text-sm font-medium hover:border-foreground transition-colors">
                Fermer
              </DialogPrimitive.Close>
            </div>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Pressé de confirmer ?{" "}
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4">WhatsApp</a>
              {" · "}
              <a href={`tel:${hotelPhone.replace(/\s/g, "")}`} className="text-foreground underline underline-offset-4">{hotelPhone}</a>
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
