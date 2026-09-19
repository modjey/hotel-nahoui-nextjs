"use client";

import { useMemo } from "react";
import HotelBookingCalendar, {
  type AvailabilityMap,
  type GuestCount,
} from "@/components/HotelBookingCalendar";

/**
 * Génère une disponibilité de démonstration sur `days` jours à partir d'aujourd'hui.
 * Remplacez cette fonction par un appel à votre API (Prisma, etc.) qui renvoie
 * une AvailabilityMap construite depuis vos réservations et votre grille tarifaire.
 */
function generateMockAvailability(days = 120): AvailabilityMap {
  const map: AvailabilityMap = {};
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const key = date.toISOString().slice(0, 10);
    const weekend = date.getDay() === 5 || date.getDay() === 6;

    // Quelques dates fermées pour illustrer le rendu "complet"
    const soldOut = i % 17 === 0 && i > 2;

    map[key] = {
      available: !soldOut,
      price: weekend ? 68000 : 45000,
      minStay: weekend ? 2 : 1,
      // Exemple de fermeture au départ un dimanche sur deux
      closedToDeparture: date.getDay() === 0 && i % 2 === 0,
    };
  }

  return map;
}

export default function BookingPage() {
  const availability = useMemo(() => generateMockAvailability(), []);

  function handleSelect(checkIn: Date, checkOut: Date, guests: GuestCount, total: number) {
    // Ex: rediriger vers l'étape suivante du tunnel de réservation (OTP, coordonnées, paiement)
    console.log({ checkIn, checkOut, guests, total });
  }

  return (
    <main className="min-h-screen bg-[#FBFAF7] py-10">
      <HotelBookingCalendar
        hotelName="Hôtel Lagune Bleue"
        availability={availability}
        basePrice={45000}
        currencyLabel="FCFA"
        monthsToShow={2}
        defaultMinStay={1}
        maxGuestsPerRoom={4}
        onDateRangeSelect={handleSelect}
      />
    </main>
  );
}
