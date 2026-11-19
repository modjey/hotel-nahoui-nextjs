/** Coordonnées de l'hôtel, partagées par le site (pied de page, réservations, pages légales). */
export const HOTEL_CONTACT = {
  name: "Hôtel Nahoui",
  phones: ["+225 27 34 71 22 33", "+225 07 87 94 34 49"],
  whatsappNumber: "+2250788494979",
  whatsappUrl: "https://api.whatsapp.com/send?phone=%2B2250788494979",
  generalEmail: "hotelnahoui@yahoo.com",
  reservationsEmail: "reservations@nahouihotel.ci",
} as const;

export function whatsappLink(message?: string) {
  const base = HOTEL_CONTACT.whatsappUrl;
  return message ? `${base}&text=${encodeURIComponent(message)}` : base;
}
