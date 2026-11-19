# Hôtel Nahoui — site & back-office (Next.js)

Site public de l'Hôtel Nahoui (chambres, restauration, bien-être, événements, photobook, actualité)
et back-office d'administration (`/admin`).

## Démarrage

```bash
npm install
cp env.example.txt .env   # puis renseigner les valeurs
npm run db:push           # ou npm run db:migrate
npm run db:seed
npm run dev
```

Ouvrir http://localhost:3000.

## Variables d'environnement

Toutes les variables sont listées dans `env.example.txt`. **Ne jamais écrire de vraie clé
dans ce README ni dans un fichier suivi par git** : elles vont uniquement dans `.env`
(ignoré par git) ou dans les variables du serveur d'hébergement.

Variables indispensables en production :

- `DATABASE_URL`
- `AUTH_JWT_SECRET` — chaîne aléatoire longue ; le serveur refuse de démarrer les sessions sans elle
- `CRON_SECRET` — protège les routes `/api/cron/*`
- `NEXT_PUBLIC_BASE_URL` / `NEXT_PUBLIC_APP_URL`

## Réservations

Le paiement **ne se fait pas en ligne** pour le moment :

1. le client envoie une demande de réservation (statut `PENDING`) ;
2. la chambre reste bloquée pendant `PENDING_BOOKING_TTL_HOURS` heures (24 h par défaut) ;
3. l'équipe contacte le client, encaisse le règlement hors plateforme puis confirme la
   réservation depuis `/admin/bookings` (ou enregistre le paiement) ;
4. sans confirmation dans le délai, le cron `cleanup-expired-bookings` annule la demande.

Le client peut annuler lui-même une demande encore en attente depuis « Mes réservations ».

L'intégration FineoPay / CentralAPIs (`/api/payments/*`) est conservée pour une activation
ultérieure du paiement en ligne.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run lint` | ESLint |
| `npm run test:unit` | tests unitaires |
| `npm run test:e2e` | tests de bout en bout (serveur requis) |
