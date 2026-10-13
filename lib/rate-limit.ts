/**
 * Rate limiting en mémoire, best-effort.
 *
 * Suffisant pour un déploiement mono-instance et pour freiner les abus
 * évidents (spam de formulaires, bursts OTP). Derrière plusieurs instances,
 * chaque instance possède son propre compteur : ce n'est pas une garantie
 * stricte, mais cela reste une protection utile.
 */

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();
const MAX_BUCKETS = 5000;

function purgeExpired(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, entry] of buckets) {
    if (entry.resetAt < now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  purgeExpired(now);

  const entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { ok: true, remaining: limit - entry.count, retryAfterSeconds: 0 };
}

/** Extrait une clé d'identification client à partir des en-têtes proxy. */
export function clientKey(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || headers.get("x-real-ip") || "unknown";
}
