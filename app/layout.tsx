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
  },
};

/** JSON-LD Hotel/LodgingBusiness — repris sur chaque page via le layout racine. */
const hotelJsonLd = {
  "@context": "https://schema.org",
  "@type": "Hotel",
  name: ORGANIZATION.name,
  description: SITE_DESCRIPTION,
  url: ORGANIZATION.url,
  logo: ORGANIZATION.logo,
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
        <AuthProvider>{children}</AuthProvider>
        <GoogleAnalytics />
        <Toaster richColors position="top-center" toastOptions={{ style: { borderRadius: 0 } }} />
      </body>
    </html>
  );
}
