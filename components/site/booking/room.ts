/** Types et formatage partagés par la fiche chambre et le tunnel de réservation. */

export type Room = {
  id: string;
  slug: string;
  name: string;
  roomNumber: string | null;
  description: string | null;
  shortDescription: string | null;
  basePrice: number;
  currency: string;
  discountPercent: number;
  maxGuests: number;
  beds: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  coverImageUrl: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  amenities: string[];
  checkInStart: string | null;
  checkInEnd: string | null;
  checkOutTime: string | null;
  checkInMethod: string | null;
  cancellationPolicy: string | null;
  roomType: { id: string; slug: string; name: string };
  location: { id: string; slug: string; name: string; city: string | null; mapLink: string | null };
  media: {
    id: string;
    type: string;
    url: string;
    thumbnailUrl: string | null;
    title: string | null;
    alt: string | null;
    order: number;
  }[];
};

export function fcfa(value: number, currency = "XOF") {
  if (currency !== "XOF") {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  }
  return `${new Intl.NumberFormat("fr-FR").format(value).replace(/\u202f|\u00a0/g, " ")} FCFA`;
}
