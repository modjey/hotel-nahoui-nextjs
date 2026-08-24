/**
 * Client API générique pour le site Hôtel Nahoui.
 *
 * Caractéristiques :
 * - Méthodes typées : get, post, put, patch, del
 * - Format de réponse standardisé : { success, data, error }
 * - Gestion auto du refresh token sur 401 (une seule tentative)
 * - Cookies HttpOnly côté web (credentials: "include")
 * - Compatible Bearer (mobile) via setAccessToken()
 * - Erreurs typées (`ApiError`) avec code + status + détails Zod éventuels
 * - Annulable via AbortSignal
 *
 * Exemples :
 *   import { api } from "@/lib/api-client";
 *
 *   const { user } = await api.get<{ user: PublicUser }>("/api/auth/me");
 *
 *   await api.post("/api/auth/otp/request", { identifier: "..." });
 *
 *   try { await api.get("/api/admin/users"); }
 *   catch (e) { if (e instanceof ApiError && e.status === 403) ... }
 */

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    issues?: unknown;
  };
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  code: string;
  status: number;
  issues?: unknown;
  constructor(message: string, opts: { code?: string; status?: number; issues?: unknown } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = opts.code ?? "ERROR";
    this.status = opts.status ?? 0;
    this.issues = opts.issues;
  }
}

export interface RequestOptions {
  /** Query string params, encodés automatiquement. */
  params?: Record<string, string | number | boolean | null | undefined>;
  /** Headers additionnels (fusionnés avec les defaults). */
  headers?: HeadersInit;
  /** AbortSignal pour annuler. */
  signal?: AbortSignal;
  /** Désactive la tentative de refresh sur 401. */
  skipRefresh?: boolean;
  /** Désactive l'envoi des cookies (utile pour appels cross-origin publics). */
  noCredentials?: boolean;
  /** Fetch cache mode (Next.js). */
  cache?: RequestCache;
  /** Next.js fetch options (revalidate, tags...). */
  next?: { revalidate?: number | false; tags?: string[] };
}

interface InternalConfig {
  baseUrl: string;
  accessToken: string | null;
  /** Plate-forme cliente, envoyée comme x-client-platform pour le mobile. */
  platform: string | null;
  /** Callback déclenché quand un 401 persiste après refresh (logout côté UI). */
  onUnauthorized: (() => void) | null;
}

const config: InternalConfig = {
  baseUrl: "",
  accessToken: null,
  platform: null,
  onUnauthorized: null,
};

/** Configure le client (URL de base pour env Node/Flutter, token Bearer pour mobile, etc.). */
export function configureApi(opts: Partial<Omit<InternalConfig, "accessToken">> & { accessToken?: string | null }) {
  if (opts.baseUrl !== undefined) config.baseUrl = opts.baseUrl;
  if (opts.accessToken !== undefined) config.accessToken = opts.accessToken;
  if (opts.platform !== undefined) config.platform = opts.platform;
  if (opts.onUnauthorized !== undefined) config.onUnauthorized = opts.onUnauthorized;
}

export function setAccessToken(token: string | null) {
  config.accessToken = token;
}

export function getAccessToken() {
  return config.accessToken;
}

/* ------------------------------- internals -------------------------------- */

function buildUrl(path: string, params?: RequestOptions["params"]) {
  const url = path.startsWith("http") ? path : `${config.baseUrl}${path}`;
  if (!params) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) continue;
    qs.append(k, String(v));
  }
  const s = qs.toString();
  return s ? `${url}${url.includes("?") ? "&" : "?"}${s}` : url;
}

function buildHeaders(custom?: HeadersInit, hasBody?: boolean): HeadersInit {
  const h = new Headers(custom);
  if (hasBody && !h.has("Content-Type")) h.set("Content-Type", "application/json");
  if (!h.has("Accept")) h.set("Accept", "application/json");
  if (config.accessToken && !h.has("Authorization")) {
    h.set("Authorization", `Bearer ${config.accessToken}`);
  }
  if (config.platform && !h.has("x-client-platform")) {
    h.set("x-client-platform", config.platform);
  }
  return h;
}

let refreshing: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetch(`${config.baseUrl}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!res.ok) return false;
      const json = (await res.json()) as ApiEnvelope<{ accessToken?: string }>;
      if (!json.success) return false;
      // Si le mobile utilise Bearer, on met à jour le token en mémoire
      if (json.data.accessToken) config.accessToken = json.data.accessToken;
      return true;
    } catch {
      return false;
    } finally {
      // libérer le verrou après un court délai pour grouper les retries simultanés
      setTimeout(() => { refreshing = null; }, 0);
    }
  })();
  return refreshing;
}

async function request<T>(method: string, path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, opts.params);
  const hasBody = body !== undefined && body !== null;
  const init: RequestInit = {
    method,
    headers: buildHeaders(opts.headers, hasBody),
    credentials: opts.noCredentials ? "omit" : "include",
    signal: opts.signal,
    cache: opts.cache,
    ...(opts.next ? { next: opts.next } : {}),
    body: hasBody ? JSON.stringify(body) : undefined,
  };

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError("Erreur réseau", { code: "NETWORK_ERROR" });
  }

  // Tentative de refresh sur 401 (sauf pour les routes d'auth elles-mêmes)
  if (
    res.status === 401 &&
    !opts.skipRefresh &&
    !path.startsWith("/api/auth/refresh") &&
    !path.startsWith("/api/auth/logout") &&
    !path.startsWith("/api/auth/otp") &&
    !path.startsWith("/api/auth/oauth") &&
    !path.startsWith("/api/auth/password-login")
  ) {
    const ok = await tryRefresh();
    if (ok) {
      return request<T>(method, path, body, { ...opts, skipRefresh: true });
    }
    config.onUnauthorized?.();
  }

  // Pas de body (204 No Content)
  if (res.status === 204) return undefined as T;

  let json: ApiEnvelope<T> | null = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      throw new ApiError("Réponse non JSON", { code: "BAD_RESPONSE", status: res.status });
    }
  }

  if (!res.ok || !json || json.success === false) {
    const err = json && !json.success ? json.error : null;
    throw new ApiError(err?.message ?? `HTTP ${res.status}`, {
      code: err?.code ?? `HTTP_${res.status}`,
      status: res.status,
      issues: err?.issues,
    });
  }

  return (json as ApiSuccess<T>).data;
}

/* --------------------------------- public --------------------------------- */

export const api = {
  get:    <T = unknown>(path: string, opts?: RequestOptions)                 => request<T>("GET",    path, undefined, opts),
  post:   <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("POST",   path, body,      opts),
  put:    <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PUT",    path, body,      opts),
  patch:  <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) => request<T>("PATCH",  path, body,      opts),
  del:    <T = unknown>(path: string, opts?: RequestOptions)                 => request<T>("DELETE", path, undefined, opts),

  /**
   * Variante qui renvoie l'enveloppe complète sans throw, utile dans les formulaires
   * où on veut afficher le message d'erreur sans try/catch.
   */
  async safe<T = unknown>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown, opts?: RequestOptions):
    Promise<{ ok: true; data: T } | { ok: false; error: ApiError }> {
    try {
      const data = await request<T>(method, path, body, opts);
      return { ok: true, data };
    } catch (err) {
      if (err instanceof ApiError) return { ok: false, error: err };
      return { ok: false, error: new ApiError((err as Error).message ?? "Erreur inconnue", { code: "UNKNOWN" }) };
    }
  },
};

export default api;
