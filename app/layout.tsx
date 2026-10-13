import type { Metadata } from "next";
import { Bodoni_Moda, Schibsted_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

// Titres — Bodoni Moda (contraste élevé, écho au « N » calligraphié du monogramme)
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

// Texte & interface — Schibsted Grotesk
const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hôtel Nahoui Balmer — Hôtel à San Pedro, Côte d'Ivoire",
  description:
    "L'Hôtel Nahoui Balmer, à San Pedro depuis 1998 : 28 chambres et suites, piscine, restaurant de cuisine ivoirienne et italienne, salles de réunion. Réservation en ligne en FCFA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${bodoni.variable} ${schibsted.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="top-center" toastOptions={{ style: { borderRadius: 0 } }} />
      </body>
    </html>
  );
}
