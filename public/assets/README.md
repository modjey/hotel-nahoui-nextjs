# HotelBookingCalendar — composant Next.js

Calendrier de réservation hôtelière à deux mois, dans l'esprit des widgets de réservation
haut de gamme (type Beau Rivage Geneva) : disponibilité par date, séjour minimum,
fermeture au départ, tarifs affichés jour par jour, sélecteur de chambres/voyageurs et
récapitulatif de séjour.

## Installation

1. Copiez `HotelBookingCalendar.tsx` dans `components/` (ou l'emplacement de votre choix).
2. Le composant n'a aucune dépendance externe (pas de date-fns, pas de librairie de calendrier) —
   il utilise uniquement `Date` natif et Tailwind CSS pour le style.
3. Tailwind doit être configuré dans le projet. Aucune modification de `tailwind.config` n'est
   nécessaire : toutes les couleurs sont passées en valeurs arbitraires (`#2F4538`, etc.).
4. Optionnel : chargez la police **Fraunces** (Google Fonts) via `next/font` dans votre layout
   pour le rendu des titres. Sans elle, le composant retombe proprement sur `Georgia/serif`.

## Utilisation

Voir `app/booking/page.tsx` pour un exemple complet avec génération de disponibilité factice.

```tsx
<HotelBookingCalendar
  hotelName="Hôtel Lagune Bleue"
  availability={availability}   // AvailabilityMap — voir ci-dessous
  basePrice={45000}             // prix par nuit par défaut, en FCFA
  currencyLabel="FCFA"
  monthsToShow={2}
  defaultMinStay={1}
  maxGuestsPerRoom={4}
  onDateRangeSelect={(checkIn, checkOut, guests, total) => {
    // brancher ici sur votre tunnel de réservation (hold de chambre, OTP, paiement)
  }}
/>
```

### Format de `AvailabilityMap`

```ts
{
  "2026-10-24": { available: true, price: 68000, minStay: 2 },
  "2026-10-25": { available: false },
  "2026-10-26": { available: true, closedToDeparture: true },
}
```

- Toute date absente de la map est traitée comme disponible, au prix `basePrice`.
- `minStay` s'applique quand la date est choisie comme **arrivée**.
- `closedToDeparture` empêche de choisir cette date comme **départ**, sans bloquer les nuits
  qui la précèdent (utile pour les règles "pas de départ le dimanche" par exemple).

## Fonctionnalités incluses

- Vue 2 mois sur desktop, 1 mois sur mobile (breakpoint `768px`)
- Sélection arrivée/départ avec prévisualisation de la plage au survol
- Le départ ne peut être placé qu'après une suite de nuits réellement disponibles
  (la sélection s'arrête automatiquement à la première nuit complète)
- Application du séjour minimum par date d'arrivée
- Prix par nuit affiché dans chaque case du calendrier
- Sélecteur chambres / adultes / enfants avec capacité maximale par chambre
- Récapitulatif : nuits, chambres, total estimé, avec devise personnalisable (FCFA par défaut)
- Dates passées et complètes non cliquables, avec état visuel distinct
- Navigation clavier de base (focus visible, `aria-label`, `aria-pressed`)

## Brancher sur une vraie source de données

Remplacez `generateMockAvailability()` par un appel à votre API interne
(`/api/rooms/availability?roomId=...&from=...&to=...`) qui interroge votre base
(Prisma, comme mentionné dans vos notes de projet) et renvoie la même forme d'objet.
Le composant est entièrement contrôlé par la prop `availability` : aucune requête réseau
n'est faite à l'intérieur du composant lui-même, ce qui le garde réutilisable pour
plusieurs types de chambres sur la même page (un `AvailabilityMap` par type de chambre).
