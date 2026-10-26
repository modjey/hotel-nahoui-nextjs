import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Schibsted_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { ORGANIZATION, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/seo";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e00014",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Hôtel à San Pedro, Côte d'Ivoire`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "travel",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_CI",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Hôtel à San Pedro, Côte d'Ivoire`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Hôtel à San Pedro, Côte d'Ivoire`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.webmanifest",
  verification: {
    google: "2zCi5ea5ef5qjWxWmJumVEJBKzUTXPlpRK8UV06MEoo",
    other: {
      "msvalidate.01": "CB0517BA240574E10B2A9D1302270AB4",
    },
  },
};

/** Logo au format ImageObject — format recommandé par Google pour le Logo rich result. */
const logoImageObject = {
  "@type": "ImageObject",
  url: ORGANIZATION.logo,
  width: 624,
  height: 624,
};

/** JSON-LD Hotel/LodgingBusiness — repris sur chaque page via le layout racine. */
const hotelJsonLd = {
  "@context": "https://schema.org",
  "@type": "Hotel",
  name: ORGANIZATION.name,
  description: SITE_DESCRIPTION,
  url: ORGANIZATION.url,
  logo: logoImageObject,
  image: DEFAULT_OG_IMAGE.url,
  telephone: ORGANIZATION.telephone,
  email: ORGANIZATION.email,
  priceRange: ORGANIZATION.priceRange,
  address: {
    "@type": "PostalAddress",
    streetAddress: ORGANIZATION.address.streetAddress,
    addressLocality: ORGANIZATION.address.addressLocality,
    addressCountry: ORGANIZATION.address.addressCountry,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: ORGANIZATION.geo.latitude,
    longitude: ORGANIZATION.geo.longitude,
  },
  sameAs: ORGANIZATION.sameAs,
};

/**
 * JSON-LD Organization dédié — Google ne rattache le "Logo" du résultat de
 * recherche (et le logo du panneau de connaissance) qu'à un type Organization
 * (ou sous-type) présent sur la page d'accueil, avec un logo au format carré.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: ORGANIZATION.name,
  url: ORGANIZATION.url,
  logo: logoImageObject,
  sameAs: ORGANIZATION.sameAs,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <AuthProvider>{children}</AuthProvider>
        <GoogleAnalytics />
        <Toaster richColors position="top-center" toastOptions={{ style: { borderRadius: 0 } }} />
      </body>
    </html>
  );
}
