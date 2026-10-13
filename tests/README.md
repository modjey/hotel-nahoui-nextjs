# Tests

Suite de tests couvrant le cœur du système : le cycle de vie d'une réservation
et l'idempotence des paiements.

## Lancer

```bash
npm test              # unitaires + e2e (serveur + base requis)
npm run test:unit     # rapides, sans base ni serveur
npm run test:e2e      # cycle de réservation + paiements
npm run test:integration  # build puis e2e (garantit de tester le code courant)
```

## Prérequis

- `DATABASE_URL` joignable (les tests écrivent puis suppriment leurs données).
- `AUTH_JWT_SECRET` défini (les jetons de test sont signés avec).
- Pour l'e2e : soit un build de production existant, soit `next dev` est utilisé
  automatiquement. Sinon `npm run test:integration` construit avant de tester.

Variables optionnelles :

| Variable | Effet |
| --- | --- |
| `TEST_BASE_URL` | Réutilise un serveur déjà démarré au lieu d'en lancer un. |
| `TEST_PORT` | Port du serveur lancé (défaut `3987`). |
| `TEST_READY_TIMEOUT_MS` | Délai d'attente du démarrage (défaut `120000`). |
| `TEST_VERBOSE=1` | Affiche les logs du serveur Next. |

## Ce qui est couvert

**Unitaires** (`tests/unit`) — sans infrastructure :
- calcul des nuits, validation des dates (passé, durée maximale, ordre) ;
- unicité et format des références de réservation ;
- filtre des réservations bloquantes (PENDING expirés exclus) ;
- calendrier de disponibilité (nuits, jour de départ libre, PENDING expiré) ;
- normalisation des statuts de paiement des fournisseurs.

**E2E** (`tests/e2e`) — serveur HTTP + base réelle :
- création d'une réservation PENDING avec paiement et expiration ;
- refus des doublons et des chevauchements partiels (409) ;
- libération de la chambre dès l'expiration, cron de nettoyage, protection du cron ;
- contrôle d'accès : un `USER` reçoit 403 sur les routes admin, un `ADMIN` passe ;
- confirmation admin refusée en cas de conflit de dates ;
- **concurrence** : 6 réservations simultanées → exactement 1 créée, 5 refusées ;
- **paiements** : réussite → confirmation, un échec tardif ne rétrograde rien,
  rejeu neutre, paiement après annulation signalé sans reconfirmation.

## Données de test

Les utilisateurs créés portent l'email `e2e-*@example.com` et sont supprimés en
fin de suite (la suppression en cascade nettoie réservations et paiements).
Un filet de sécurité supprime aussi les réservations créées par les tests sans
utilisateur rattaché (création via l'admin), que la cascade ne nettoierait pas.

Chaque test réserve un créneau de dates **disjoint** des autres (espacement de
14 jours, base dérivée de l'horloge) : deux tests d'une même exécution ne
peuvent pas se chevaucher. Le test de concurrence vérifie en plus explicitement
qu'aucune réservation ne traîne déjà sur sa plage, et échoue avec le détail des
réservations fautives le cas échéant — plutôt que de produire un faux résultat.

Les tests s'appuient sur l'auth par jeton Bearer plutôt que sur l'OTP, afin de
ne pas consommer le quota anti-abus des codes et de rester déterministes.

## Dépannage

- `EPERM ... query_engine-windows.dll.node` pendant `prisma generate` : un autre
  processus Node (serveur dev) verrouille le moteur. Fermez-le, ou lancez
  directement `npx next build` si le schéma Prisma n'a pas changé.
- Le serveur Next démarre puis le premier appel échoue : la base serverless
  (Neon) était en veille. `waitForDatabase` retente 10 fois ; augmentez
  `TEST_READY_TIMEOUT_MS` si votre réseau est lent.
