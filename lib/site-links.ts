import { HOTEL_CONTACT } from "@/lib/hotel-contact";

/** Destinations proposées dans l'admin pour les boutons (offres, événements...). */
export const SITE_LINK_OPTIONS = [
  { value: "/stays", label: "Chambres & réservation" },
  { value: "/suites", label: "Suites" },
  { value: "/offres", label: "Offres" },
  { value: "/evenements", label: "Événements" },
  { value: "/restaurant", label: "Restaurant" },
  { value: "/bien-etre", label: "Bien-être" },
  { value: "/services", label: "Services" },
  { value: "/devis", label: "Demande de devis" },
  { value: "/contact", label: "Contact" },
  { value: "/photobook", label: "Photobook" },
  { value: "/avis", label: "Avis clients" },
  { value: "/blog", label: "Blog" },
  { value: HOTEL_CONTACT.whatsappUrl, label: "WhatsApp de l'hôtel" },
  { value: `tel:${HOTEL_CONTACT.phones[0].replace(/\s/g, "")}`, label: `Appeler le ${HOTEL_CONTACT.phones[0]}` },
];
