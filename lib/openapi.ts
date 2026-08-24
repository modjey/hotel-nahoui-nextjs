/**
 * OpenAPI 3.1 spec — Hôtel Nahoui REST API.
 * Sert de doc Swagger pour le web et de contrat pour le futur client Flutter.
 *
 * Pour ajouter une nouvelle route, rajouter ici une entrée dans `paths`
 * et, si nécessaire, un schéma dans `components.schemas`.
 */

import { authConfig } from "./auth/config";

const ENVELOPE_REF = "#/components/schemas/Envelope";
const ERROR_REF = "#/components/schemas/ErrorEnvelope";

const tokensSchema = {
  type: "object",
  properties: {
    user: { $ref: "#/components/schemas/PublicUser" },
    accessToken: { type: "string", description: "JWT access token (~15 min)" },
    refreshToken: { type: "string", description: "JWT refresh token (~30 j)" },
    expiresIn: { type: "integer", example: 900, description: "Durée de vie de l'access token en secondes" },
    refreshExpiresAt: { type: "string", format: "date-time" },
  },
  required: ["user", "accessToken", "refreshToken", "expiresIn"],
};

export function buildOpenApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Hôtel Nahoui — API",
      version: "1.0.0",
      description:
        "API REST de l'Hôtel Nahoui. Consommée par le site Next.js et la future application mobile Flutter.\n\n" +
        "**Auth** : cookies HttpOnly côté web (`nh_access`, `nh_refresh`) ou `Authorization: Bearer <accessToken>` côté mobile.\n\n" +
        "**Format de réponse** : toutes les routes renvoient `{ success: true, data }` ou `{ success: false, error: { code, message } }`.",
      contact: { name: "Hôtel Nahoui" },
    },
    servers: [
      { url: authConfig.appUrl, description: "Environnement courant" },
      { url: "http://localhost:3000", description: "Local dev" },
    ],
    tags: [
      { name: "Auth — OTP", description: "Connexion par code à usage unique (email ou SMS Côte d'Ivoire)" },
      { name: "Auth — OAuth", description: "Connexion via Google / Facebook" },
      { name: "Auth — Password", description: "Connexion email + mot de passe (admins)" },
      { name: "Auth — Session", description: "Refresh, logout, profil courant" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Access token JWT envoyé en header `Authorization: Bearer <token>` (mobile).",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "nh_access",
          description: "Cookie HttpOnly posé automatiquement après login (web).",
        },
      },
      schemas: {
        Role: {
          type: "string",
          enum: ["USER", "MODERATOR", "ADMIN", "SUPER_ADMIN"],
        },
        PublicUser: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string", nullable: true, format: "email" },
            phone: { type: "string", nullable: true, example: "+22507000000000" },
            name: { type: "string", nullable: true },
            image: { type: "string", nullable: true },
            role: { $ref: "#/components/schemas/Role" },
            emailVerified: { type: "string", format: "date-time", nullable: true },
            phoneVerified: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Envelope: {
          type: "object",
          properties: {
            success: { type: "boolean", const: true },
            data: {},
          },
          required: ["success", "data"],
        },
        ErrorEnvelope: {
          type: "object",
          properties: {
            success: { type: "boolean", const: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "VALIDATION_ERROR" },
                message: { type: "string", example: "Données invalides" },
                issues: { type: "object", nullable: true, description: "Détails Zod pour les erreurs 422." },
              },
              required: ["code", "message"],
            },
          },
          required: ["success", "error"],
        },
        TokensResponse: tokensSchema,
        OtpRequestBody: {
          type: "object",
          required: ["identifier"],
          properties: {
            identifier: {
              type: "string",
              description: "Email OU numéro Côte d'Ivoire (formats acceptés : `+225XXXXXXXXXX`, `07 00 00 00 00`, `0022507...`).",
              example: "+22507000000000",
            },
          },
        },
        OtpVerifyBody: {
          type: "object",
          required: ["identifier", "code"],
          properties: {
            identifier: { type: "string", example: "+22507000000000" },
            code: { type: "string", pattern: "^\\d{4,8}$", example: "123456" },
            name: { type: "string", nullable: true, description: "Prénom (création de compte)." },
          },
        },
        PasswordLoginBody: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "admin@hotelnahoui.ci" },
            password: { type: "string", minLength: 8, example: "ChangeMe!2025" },
          },
        },
        OAuthCodeBody: {
          type: "object",
          required: ["code"],
          properties: {
            code: { type: "string", description: "Code d'autorisation OAuth retourné par le provider." },
            redirectUri: {
              type: "string",
              format: "uri",
              description: "Doit correspondre exactement au redirect_uri utilisé lors de l'autorisation.",
            },
          },
        },
        RefreshBody: {
          type: "object",
          properties: {
            refreshToken: {
              type: "string",
              description: "Obligatoire pour les clients mobiles ; ignoré côté web (cookie utilisé).",
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: "Non authentifié",
          content: { "application/json": { schema: { $ref: ERROR_REF } } },
        },
        Forbidden: {
          description: "Permissions insuffisantes",
          content: { "application/json": { schema: { $ref: ERROR_REF } } },
        },
        Validation: {
          description: "Erreur de validation (Zod)",
          content: { "application/json": { schema: { $ref: ERROR_REF } } },
        },
      },
    },
    paths: {
      "/api/auth/otp/request": {
        post: {
          tags: ["Auth — OTP"],
          summary: "Demander un code OTP",
          description: "Envoie un code à 6 chiffres par email (Resend) ou SMS Côte d'Ivoire (TPECloud) selon le type d'identifiant.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/OtpRequestBody" } } },
          },
          responses: {
            "200": {
              description: "Code envoyé",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: ENVELOPE_REF },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              identifier: { type: "string", description: "Identifiant normalisé (E.164 pour téléphone)." },
                              channel: { type: "string", enum: ["EMAIL", "SMS"] },
                              ttlMinutes: { type: "integer", example: 10 },
                              debugCode: { type: "string", description: "Présent uniquement si OTP_DEBUG=true." },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "422": { $ref: "#/components/responses/Validation" },
          },
        },
      },
      "/api/auth/otp/verify": {
        post: {
          tags: ["Auth — OTP"],
          summary: "Vérifier l'OTP et se connecter",
          description: "Crée le compte au premier login. Renvoie tokens + cookies.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/OtpVerifyBody" } } },
          },
          responses: {
            "200": {
              description: "Connecté",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: ENVELOPE_REF },
                      { type: "object", properties: { data: { $ref: "#/components/schemas/TokensResponse" } } },
                    ],
                  },
                },
              },
            },
            "400": { description: "Code invalide / expiré", content: { "application/json": { schema: { $ref: ERROR_REF } } } },
            "422": { $ref: "#/components/responses/Validation" },
          },
        },
      },
      "/api/auth/password-login": {
        post: {
          tags: ["Auth — Password"],
          summary: "Connexion email + mot de passe (admins)",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/PasswordLoginBody" } } },
          },
          responses: {
            "200": {
              description: "Connecté",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: ENVELOPE_REF },
                      { type: "object", properties: { data: { $ref: "#/components/schemas/TokensResponse" } } },
                    ],
                  },
                },
              },
            },
            "401": { description: "Identifiants invalides", content: { "application/json": { schema: { $ref: ERROR_REF } } } },
            "422": { $ref: "#/components/responses/Validation" },
          },
        },
      },
      "/api/auth/oauth/google": {
        get: {
          tags: ["Auth — OAuth"],
          summary: "(Web) Démarre la connexion Google",
          description: "Redirige vers Google. Le callback `/api/auth/oauth/google/callback` finalise la session.",
          responses: { "302": { description: "Redirection vers Google" } },
        },
        post: {
          tags: ["Auth — OAuth"],
          summary: "(Mobile) Échanger le code Google",
          description: "Le client Flutter récupère un code via `google_sign_in` puis l'envoie ici.",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/OAuthCodeBody" } } },
          },
          responses: {
            "200": {
              description: "Connecté",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: ENVELOPE_REF },
                      { type: "object", properties: { data: { $ref: "#/components/schemas/TokensResponse" } } },
                    ],
                  },
                },
              },
            },
            "400": { description: "Échec OAuth", content: { "application/json": { schema: { $ref: ERROR_REF } } } },
          },
        },
      },
      "/api/auth/oauth/google/callback": {
        get: {
          tags: ["Auth — OAuth"],
          summary: "(Web) Callback Google",
          parameters: [
            { name: "code", in: "query", required: true, schema: { type: "string" } },
            { name: "state", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: { "302": { description: "Redirection vers /" } },
        },
      },
      "/api/auth/oauth/facebook": {
        get: {
          tags: ["Auth — OAuth"],
          summary: "(Web) Démarre la connexion Facebook",
          responses: { "302": { description: "Redirection vers Facebook" } },
        },
        post: {
          tags: ["Auth — OAuth"],
          summary: "(Mobile) Échanger le code Facebook",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/OAuthCodeBody" } } },
          },
          responses: {
            "200": {
              description: "Connecté",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: ENVELOPE_REF },
                      { type: "object", properties: { data: { $ref: "#/components/schemas/TokensResponse" } } },
                    ],
                  },
                },
              },
            },
            "400": { description: "Échec OAuth", content: { "application/json": { schema: { $ref: ERROR_REF } } } },
          },
        },
      },
      "/api/auth/oauth/facebook/callback": {
        get: {
          tags: ["Auth — OAuth"],
          summary: "(Web) Callback Facebook",
          parameters: [
            { name: "code", in: "query", required: true, schema: { type: "string" } },
            { name: "state", in: "query", required: true, schema: { type: "string" } },
          ],
          responses: { "302": { description: "Redirection vers /" } },
        },
      },
      "/api/auth/refresh": {
        post: {
          tags: ["Auth — Session"],
          summary: "Rafraîchir l'access token (rotation)",
          requestBody: {
            required: false,
            content: { "application/json": { schema: { $ref: "#/components/schemas/RefreshBody" } } },
          },
          responses: {
            "200": {
              description: "Nouveaux tokens",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: ENVELOPE_REF },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              accessToken: { type: "string" },
                              refreshToken: { type: "string" },
                              expiresIn: { type: "integer" },
                              refreshExpiresAt: { type: "string", format: "date-time" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "401": { description: "Refresh token invalide", content: { "application/json": { schema: { $ref: ERROR_REF } } } },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Auth — Session"],
          summary: "Déconnexion (révoque la session)",
          responses: {
            "200": {
              description: "Déconnecté",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: ENVELOPE_REF },
                      { type: "object", properties: { data: { type: "object", properties: { loggedOut: { type: "boolean" } } } } },
                    ],
                  },
                },
              },
            },
          },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth — Session"],
          summary: "Profil utilisateur courant",
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          responses: {
            "200": {
              description: "Profil",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: ENVELOPE_REF },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: { user: { $ref: "#/components/schemas/PublicUser" } },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
    },
  } as const;
}
