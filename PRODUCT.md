# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Voyageurs d'affaires** : missions liées au port et à l'activité économique de San-Pédro, entreprises qui organisent réunions et séminaires.
- **Familles et loisirs** : week-ends et vacances, notamment Ivoiriens d'Abidjan et de la région.
- **Touristes internationaux** : expatriés, diaspora, étrangers qui découvrent le littoral ivoirien.
- **Clientèle locale** : restaurant, bars (Aqua Bar, Bar VIP), piscine et événements, sans forcément dormir à l'hôtel.

Les visiteurs consultent le site surtout sur mobile, souvent avec une connexion variable.

## Product Purpose

Site vitrine et de réservation de l'Hôtel Nahoui Balmer (San-Pédro, Côte d'Ivoire, ouvert en 2016), avec un back-office d'administration.

**Objectif n°1 : générer plus de demandes de réservation de chambres en direct.** Les objectifs secondaires sont les demandes de devis (groupes, séminaires, événements) et la fréquentation du restaurant et des bars.

## Positioning

Hôtel de 28 chambres et suites entre jardin tropical et océan Atlantique, à San-Pédro : piscine, spa, salle de sport, restaurant de cuisine ivoirienne, deux bars, salles de réception, espace jeux pour enfants. Prix affichés en FCFA.

## Operating Context

- Une réservation en ligne est une **demande** : aucun paiement sur le site. L'hôtel contacte le client (téléphone, WhatsApp, email), encaisse hors ligne (espèces, Mobile Money, virement) puis confirme. La chambre est bloquée 24 h par défaut.
- Connexion client par code à usage unique (email/SMS) ou Google/Facebook.
- WhatsApp est un canal de contact majeur.
- L'équipe gère le contenu dans l'admin (`/admin`) : chambres, tarifs saisonniers, fermetures, offres, événements, espaces, plats, actualités, photos, devis, messages.

## Capabilities and Constraints

- Next.js 16 (App Router), React 19, Tailwind CSS 4, Prisma/PostgreSQL, framer-motion.
- Site en français uniquement (pas d'anglais pour le moment).
- Pas de paiement en ligne pour l'instant (intégrations FineoPay/CentralAPIs conservées pour plus tard).
- Images servies depuis `/uploads` (admin) et `public/assets` ; certaines encore chargées depuis l'ancien site hotelnahoui.net.

## Brand Commitments

- Nom : **Hôtel Nahoui Balmer** (« Nahoui » seul dans les usages courts).
- **Rouge Nahoui** comme couleur primaire, à conserver.
- Identité actuelle à **perfectionner, pas à remplacer** (décision du 19/11/2026) : on affine l'existant.
- Logo : `public/logo.png`. Vidéo d'accueil : `public/assets/banner.mp4`.
- Le propriétaire du projet veut un rendu premium et non générique, des interfaces légères qui vont droit à l'information, sans surcharge de filtres, badges et texte.

## Evidence on Hand

- Photos : `public/assets/` (hero, piscine, spa, sport, restaurant, cocktails, salle de conférence, espace jeux) et photos des chambres envoyées depuis l'admin.
- Avis clients réels modérés dans l'admin (avis réservés aux clients ayant séjourné).
- Faits vérifiables : 28 chambres et suites, ouverture en 2016, arrivée 15h, départ avant 12h.
- Aucune presse, aucun label ni récompense : ne pas en inventer. Pas de témoignages fictifs.

## Product Principles

1. Chaque page rapproche le visiteur d'une demande de réservation ou d'un contact.
2. Dire clairement que le règlement se fait avec l'hôtel, sans paiement en ligne.
3. Montrer l'hôtel tel qu'il est : vraies photos, vrais prix en FCFA, vraies conditions.
4. Mobile d'abord, légèreté, aller droit à l'information.
5. L'équipe de l'hôtel doit pouvoir tout mettre à jour seule.

## Accessibility & Inclusion

Cibler WCAG 2.2 AA : contrastes du rouge sur fond clair, cibles tactiles d'au moins 44 px, navigation au clavier, textes alternatifs des photos.
