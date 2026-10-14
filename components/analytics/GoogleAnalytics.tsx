"use client";

import { Suspense, useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Google Analytics 4.
 *
 * Pour activer : définir NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX" dans .env.
 * Sans clé, aucun script n'est chargé et aucun événement n'est envoyé.
 *
 * - page_view envoyé à chaque navigation (App Router)
 * - les pages /admin sont ignorées
 * - trackEvent() disponible pour les événements personnalisés
 */

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-C2NZVR5F83";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Envoie un événement personnalisé : trackEvent("booking_started", { room_id: "..." }) */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!GA_ID) return;
  window.gtag?.("event", name, params);
}

/** Chemins exclus du suivi (back-office). */
const isExcludedPath = (pathname: string) => pathname.startsWith("/admin");

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID || isExcludedPath(pathname)) return;
    const query = searchParams?.toString();
    window.gtag?.("event", "page_view", {
      page_path: query ? `${pathname}?${query}` : pathname,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [pathname, searchParams]);

  return null;
}

export function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
