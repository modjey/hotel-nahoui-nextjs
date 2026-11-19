import type { NextRequest } from "next/server";
import { z, ZodError, type AnyZodObject } from "zod";
import { Prisma } from "@prisma/client";
import { ok, fail, withAuth } from "@/lib/auth/api";
import { slugify } from "@/lib/catalog/schemas";

/**
 * Routes CRUD génériques pour les contenus simples de l'admin (offres, événements,
 * espaces, tarifs, fermetures...). Chaque ressource déclare son modèle Prisma, son
 * schéma Zod et, si besoin, un slug généré depuis un champ texte.
 */

/** Sous-ensemble des délégués Prisma utilisé ici (les délégués réels sont génériques). */
type Delegate = {
  findMany(args: object): Promise<unknown[]>;
  findUnique(args: object): Promise<unknown | null>;
  findFirst(args: object): Promise<unknown | null>;
  create(args: object): Promise<unknown>;
  update(args: object): Promise<unknown>;
  delete(args: object): Promise<unknown>;
};

export type CrudConfig = {
  /** Nom lisible pour les logs (ex : "offers"). */
  name: string;
  delegate: () => unknown;
  schema: AnyZodObject;
  /** Champ texte servant à générer un slug unique (le modèle doit avoir `slug`). */
  slugFrom?: string;
  orderBy?: object | object[];
  include?: object;
  /** Validation métier supplémentaire (ex : date de fin après date de début). */
  check?: (data: Record<string, unknown>, id?: string) => string | null | Promise<string | null>;
  /** Complète les données avant création (ex : référence). */
  beforeCreate?: (data: Record<string, unknown>) => void | Promise<void>;
  /** Hook après création/modification (ex : notification). */
  afterSave?: (item: unknown, isCreate: boolean) => Promise<void> | void;
};

const ROLES = { roles: ["ADMIN", "SUPER_ADMIN"] as ("ADMIN" | "SUPER_ADMIN")[] };

// ─── Aides de validation partagées ───────────────────────────────────────────

/** "" / null / undefined → null, sinon chaîne nettoyée. */
export const optionalText = (max = 5000) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().trim().max(max).nullable().optional());

/** Date au format AAAA-MM-JJ ou ISO ; "" → null. */
export const optionalDate = () =>
  z.preprocess((v) => (v === "" || v === undefined ? null : v), z.coerce.date().nullable().optional());

export const requiredDate = () => z.coerce.date({ errorMap: () => ({ message: "Date invalide" }) });

/** Entier optionnel ; "" → null. */
export const optionalInt = (min = 0) =>
  z.preprocess((v) => (v === "" || v === undefined ? null : v), z.coerce.number().int().min(min).nullable().optional());

export const stringList = () =>
  z.preprocess(
    (v) => (typeof v === "string" ? v.split(/\n|,/) : v),
    z.array(z.string().trim()).transform((a) => a.filter(Boolean)).default([]),
  );

// ─── Fabrique de routes ──────────────────────────────────────────────────────

async function uniqueSlug(delegate: Delegate, base: string, excludeId?: string) {
  const root = slugify(base) || "element";
  let candidate = root;
  for (let i = 2; i < 100; i++) {
    const existing = (await delegate.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    })) as { id: string } | null;
    if (!existing) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}

function errorResponse(e: unknown, name: string) {
  if (e instanceof ZodError) {
    const first = e.issues[0];
    return fail(first ? `${first.path.join(".") || "champ"} : ${first.message}` : "Données invalides", 400, "VALIDATION");
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2025") return fail("Élément introuvable", 404, "NOT_FOUND");
    if (e.code === "P2002") return fail("Cette valeur existe déjà", 409, "CONFLICT");
    if (e.code === "P2003") return fail("Élément lié introuvable", 400, "BAD_RELATION");
  }
  console.error(`[admin-crud:${name}]`, e);
  return fail("Erreur serveur", 500, "INTERNAL");
}

async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

/** GET (liste) + POST (création) pour /api/admin/<ressource>. */
export function collectionRoutes(cfg: CrudConfig) {
  const d = () => cfg.delegate() as Delegate;

  const GET = withAuth(async () => {
    try {
      const items = await d().findMany({ orderBy: cfg.orderBy ?? { createdAt: "desc" }, include: cfg.include });
      return ok({ items });
    } catch (e) {
      return errorResponse(e, cfg.name);
    }
  }, ROLES);

  const POST = withAuth(async (req) => {
    try {
      const data = cfg.schema.parse(await readJson(req)) as Record<string, unknown>;
      const problem = await cfg.check?.(data);
      if (problem) return fail(problem, 400, "VALIDATION");
      await cfg.beforeCreate?.(data);
      if (cfg.slugFrom) data.slug = await uniqueSlug(d(), String(data[cfg.slugFrom] ?? ""));
      const item = await d().create({ data, include: cfg.include });
      await cfg.afterSave?.(item, true);
      return ok({ item }, { status: 201 });
    } catch (e) {
      return errorResponse(e, cfg.name);
    }
  }, ROLES);

  return { GET, POST };
}

/** GET / PATCH / DELETE pour /api/admin/<ressource>/[id]. */
export function itemRoutes(cfg: CrudConfig) {
  const d = () => cfg.delegate() as Delegate;
  const idOf = (req: NextRequest) => decodeURIComponent(req.nextUrl.pathname.split("/").pop() ?? "");

  const GET = withAuth(async (req) => {
    try {
      const item = await d().findUnique({ where: { id: idOf(req) }, include: cfg.include });
      if (!item) return fail("Élément introuvable", 404, "NOT_FOUND");
      return ok({ item });
    } catch (e) {
      return errorResponse(e, cfg.name);
    }
  }, ROLES);

  const PATCH = withAuth(async (req) => {
    try {
      const id = idOf(req);
      const data = cfg.schema.partial().parse(await readJson(req)) as Record<string, unknown>;
      if (cfg.check) {
        const current = (await d().findUnique({ where: { id } })) as Record<string, unknown> | null;
        if (!current) return fail("Élément introuvable", 404, "NOT_FOUND");
        const problem = await cfg.check({ ...current, ...data }, id);
        if (problem) return fail(problem, 400, "VALIDATION");
      }
      if (cfg.slugFrom && typeof data[cfg.slugFrom] === "string") {
        data.slug = await uniqueSlug(d(), String(data[cfg.slugFrom]), id);
      }
      const item = await d().update({ where: { id }, data, include: cfg.include });
      await cfg.afterSave?.(item, false);
      return ok({ item });
    } catch (e) {
      return errorResponse(e, cfg.name);
    }
  }, ROLES);

  const DELETE = withAuth(async (req) => {
    try {
      await d().delete({ where: { id: idOf(req) } });
      return ok({ deleted: true });
    } catch (e) {
      return errorResponse(e, cfg.name);
    }
  }, ROLES);

  return { GET, PATCH, DELETE };
}

/** Contrôle courant : la fin doit être après le début. */
export function endAfterStart(startKey: string, endKey: string, label = "La date de fin doit être après la date de début") {
  return (data: Record<string, unknown>) => {
    const s = data[startKey];
    const e = data[endKey];
    if (s instanceof Date && e instanceof Date && e <= s) return label;
    if (s && e && new Date(String(e)) <= new Date(String(s))) return label;
    return null;
  };
}
