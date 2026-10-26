import type { Metadata } from "next";
import type { ReactNode } from "react";

// Pages de réservation privées (tableau de bord client, confirmation,
// annulation) — aucun intérêt pour le référencement, à exclure de l'index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function BookingsLayout({ children }: { children: ReactNode }) {
  return children;
}
