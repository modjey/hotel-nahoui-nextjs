"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { OFFER_LABELS, day, fcfa } from "@/components/site/content/cards";
import type { PublicOffer } from "@/lib/public-content";

const STORAGE_KEY = "flashOffers:seen";
const REPEAT_MS = 24 * 60 * 60 * 1000;
const OPEN_DELAY_MS = 2500;
// Espaces sans pop-up : back-office et documentation.
const EXCLUDED = ["/admin", "/docs"];

type Seen = { at: number; ids: string[] };

function readSeen(): Seen | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Seen) : null;
  } catch {
    return null;
  }
}

/**
 * Pop-up des offres cochées « pop-up flash » dans l'admin.
 * Affiché au plus une fois par 24 h, sauf si une nouvelle offre flash apparaît entre-temps.
 */
export function FlashOfferPopup() {
  const pathname = usePathname();
  const excluded = EXCLUDED.some((p) => pathname?.startsWith(p));
  const [offers, setOffers] = useState<PublicOffer[]>([]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const checked = useRef(false);

  useEffect(() => {
    if (excluded || checked.current) return;
    checked.current = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/offers/flash", { signal: ctrl.signal });
        const json = await res.json();
        const list: PublicOffer[] = json?.data?.offers ?? [];
        if (!list.length) return;
        const seen = readSeen();
        const due = !seen || Date.now() - seen.at > REPEAT_MS || list.some((o) => !seen.ids.includes(o.id));
        if (!due) return;
        setOffers(list);
        timer = setTimeout(() => {
          // Ne pas interrompre une réservation en cours.
          if (document.body.dataset.bookingFlow === "open") return;
          setOpen(true);
        }, OPEN_DELAY_MS);
      } catch {
        // Pop-up facultatif : on ignore silencieusement les erreurs réseau.
      }
    })();
    return () => {
      ctrl.abort();
      if (timer) clearTimeout(timer);
      checked.current = false;
    };
  }, [excluded]);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ at: Date.now(), ids: offers.map((o) => o.id) } satisfies Seen));
    } catch {
      // Stockage indisponible (navigation privée) : le pop-up reviendra, sans gravité.
    }
  };

  if (excluded || !offers.length) return null;
  const offer = offers[Math.min(index, offers.length - 1)];
  const many = offers.length > 1;
  const go = (delta: number) => setIndex((i) => (i + delta + offers.length) % offers.length);

  const href = offer.ctaUrl || "/contact";
  const ctaLabel = offer.ctaLabel || "Profiter de l'offre";
  const ctaCls = "btn-fill-editorial";
  const cta = /^https?:\/\//.test(href) ? (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={dismiss} className={ctaCls}>{ctaLabel} <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>
  ) : href.startsWith("/") ? (
    <Link href={href} onClick={dismiss} className={ctaCls}>{ctaLabel} <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
  ) : (
    <a href={href} onClick={dismiss} className={ctaCls}>{ctaLabel}</a>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent
        className="max-w-3xl gap-0 overflow-hidden rounded-none sm:rounded-none border-0 border-t-4 border-t-primary bg-card p-0 max-h-[90vh] overflow-y-auto [&>button:last-child]:z-10 [&>button:last-child]:bg-background/90 [&>button:last-child]:p-2 [&>button:last-child]:opacity-100"
        onKeyDown={(e) => {
          if (!many) return;
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
      >
        <div className="grid sm:grid-cols-[1fr_1.1fr]">
          <div className="relative aspect-[4/3] sm:aspect-auto sm:min-h-[22rem] bg-muted">
            {offer.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={offer.id} src={offer.imageUrl} alt="" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <span className="absolute left-0 top-0 bg-primary px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-white">
              Offre flash · {OFFER_LABELS[offer.category]}
            </span>
          </div>

          <div className="flex flex-col p-6 sm:p-8" aria-live="polite">
            <DialogTitle className="font-display text-3xl sm:text-4xl font-normal leading-tight tracking-normal text-balance pr-6">
              {offer.title}
            </DialogTitle>
            {offer.summary ? (
              <DialogDescription className="mt-3 text-[0.95rem] text-foreground/80 text-pretty">{offer.summary}</DialogDescription>
            ) : (
              <DialogDescription className="sr-only">Offre spéciale de l&apos;hôtel</DialogDescription>
            )}
            {offer.price != null && (
              <p className="mt-5 text-sm">
                <strong className="font-display text-2xl font-normal tabular">{fcfa(offer.price)}</strong>
                {offer.priceLabel && <span className="text-muted-foreground"> {offer.priceLabel}</span>}
              </p>
            )}
            {offer.validUntil && (
              <p className="mt-2 text-sm text-brand-text">Jusqu&apos;au {day(offer.validUntil, true)}</p>
            )}

            <div className="mt-auto pt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              {cta}
              <button type="button" onClick={dismiss} className="link-underline text-muted-foreground hover:text-foreground min-h-11">
                Plus tard
              </button>
            </div>

            {many && (
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs text-muted-foreground tabular">{index + 1} / {offers.length}</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => go(-1)} aria-label="Offre précédente" className="h-11 w-11 grid place-items-center hover:bg-secondary transition-colors">
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => go(1)} aria-label="Offre suivante" className="h-11 w-11 grid place-items-center hover:bg-secondary transition-colors">
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
