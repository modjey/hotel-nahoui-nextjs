# Auth — Hôtel Nahoui

Système d'authentification pour le site web Next.js **et** la future app mobile Flutter
(API REST avec Bearer token).

## Stack

- **Prisma** + **PostgreSQL Neon**
- **JWT** (`jose`) — access (15 min) + refresh (30 j) avec rotation
- **OTP** email (Resend) ou SMS Côte d'Ivoire (TPECloud)
- **OAuth** Google + Facebook
- **Mot de passe** (bcryptjs) pour les admins
- **Zod** pour la validation
- **Rôles** : `USER`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`

## Setup initial

```bash
# 1. Installer les nouvelles deps
npm install

# 2. Copier env.example.txt en .env (à la racine) et remplir
#    DATABASE_URL, AUTH_JWT_SECRET, RESEND_API_KEY, TPECLOUD_API_KEY,
#    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FACEBOOK_*

# 3. Pousser le schéma vers Neon
npm run db:push

# 4. Créer le 1er Super Admin
npx tsx prisma/seed.ts
# (par défaut : admin@hotelnahoui.ci / ChangeMe!2025)

# 5. Lancer l'app
npm run dev
```

## API REST

Toutes les routes renvoient `{ success: boolean, data?, error? }`.

| Méthode | Route                                | Auth | Description |
| ------- | ------------------------------------ | ---- | ----------- |
| POST    | `/api/auth/otp/request`              | non  | Envoie un OTP par email ou SMS |
| POST    | `/api/auth/otp/verify`               | non  | Vérifie l'OTP, crée/loggue l'utilisateur |
| POST    | `/api/auth/password-login`           | non  | Login email + mot de passe (admins) |
| GET     | `/api/auth/oauth/google`             | non  | (web) Redirige vers Google |
| POST    | `/api/auth/oauth/google`             | non  | (mobile) `{ code, redirectUri }` → tokens |
| GET     | `/api/auth/oauth/google/callback`    | non  | Callback web Google |
| GET/POST| `/api/auth/oauth/facebook[/callback]`| non  | Idem Facebook |
| POST    | `/api/auth/refresh`                  | non  | Rafraîchit l'access token |
| POST    | `/api/auth/logout`                   | non  | Révoque la session |
| GET     | `/api/auth/me`                       | oui  | Renvoie l'utilisateur courant |

### Web (cookies HttpOnly)

Le navigateur reçoit automatiquement `nh_access` et `nh_refresh` en cookies HttpOnly.
Aucune manipulation côté client n'est nécessaire — utilisez `useAuth()` du `AuthProvider`.

### Mobile (Flutter — Bearer)

```dart
// 1. Demander un OTP
POST /api/auth/otp/request
{ "identifier": "+225 07 00 00 00 00" }

// 2. Vérifier
POST /api/auth/otp/verify
{ "identifier": "+22507000000000", "code": "123456", "name": "Aïcha" }
// → { data: { accessToken, refreshToken, expiresIn, user } }

// 3. Appels authentifiés
GET /api/auth/me
Headers: { Authorization: "Bearer <accessToken>",
           "x-client-platform": "android" }

// 4. Quand expiresIn approche, rafraîchir
POST /api/auth/refresh  { "refreshToken": "<...>" }
```

## OAuth — Configuration

### Google
- Console : https://console.cloud.google.com/apis/credentials
- **Authorized redirect URIs** (web) : `https://hotelnahoui.ci/api/auth/oauth/google/callback`
- **Mobile** : utilisez le SDK Flutter `google_sign_in`, récupérez le `serverAuthCode`,
  envoyez-le à `POST /api/auth/oauth/google` avec le `redirectUri` correspondant.

### Facebook
- https://developers.facebook.com/apps
- **Valid OAuth Redirect URIs** : `https://hotelnahoui.ci/api/auth/oauth/facebook/callback`

## SMS — TPECloud

Le wrapper `lib/auth/sms.ts` envoie un POST JSON :
```json
{ "sender": "NAHOUI", "to": "+22507000000000", "message": "..." }
```
Avec `Authorization: Bearer <TPECLOUD_API_KEY>`.
Adaptez le contenu si le contrat TPECloud diffère.

En dev, si `OTP_DEBUG=true`, le code est loggé dans la console et renvoyé dans
la réponse pour faciliter les tests.

## Rôles & sécurité

- **`middleware.ts`** protège tout `/admin/**` (sauf `/admin/login`) — seul
  `MODERATOR`, `ADMIN`, `SUPER_ADMIN` peut entrer.
- Pour protéger une route API : `withAuth(handler, { roles: ["ADMIN"] })`.
- Refresh-token rotation + détection de réutilisation (révoque la session).

## Modèles Prisma

`User`, `Account` (OAuth), `Session` (refresh), `OtpCode`. Les enums `Role`,
`AuthProvider`, `OtpChannel`, `OtpPurpose` sont exportés depuis `@prisma/client`.
