"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <p className="eyebrow text-primary">Une erreur est survenue</p>
      <h1 className="font-display mt-4 text-4xl sm:text-5xl font-light">Cette page n&rsquo;a pas pu se charger</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Un problème inattendu est survenu de notre côté. Réessayez ou revenez à l&rsquo;accueil.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={reset}
          className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Réessayer
        </button>
        <Link href="/" className="link-underline text-foreground">
          Retour à l&rsquo;accueil
        </Link>
      </div>
    </div>
  );
}
