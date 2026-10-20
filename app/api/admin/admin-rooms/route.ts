import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { roomCreateSchema } from "@/lib/catalog/schemas";
import { roomSlugBase, ensureUniqueRoomSlug } from "@/lib/catalog/slug";

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  if (req.method === "GET") {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const roomTypeId = searchParams.get("roomTypeId");
    const search = searchParams.get("search")?.trim();
    const isPublished = searchParams.get("isPublished");
    const promo = searchParams.get("promo");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 100);
    const where: Record<string, unknown> = {};
    if (locationId) where.locationId = locationId;
    if (roomTypeId) where.roomTypeId = roomTypeId;
    if (isPublished === "true" || isPublished === "false") {
      where.isPublished = isPublished === "true";
    }
    if (promo === "true") where.discountPercent = { gt: 0 };
    if (promo === "false") where.discountPercent = { lte: 0 };
    if (search) {
      const contains = { contains: search, mode: "insensitive" as const };
      where.AND = [
        { OR: [{ name: contains }, { roomNumber: contains }, { shortDescription: contains }] },
      ];
    }

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        orderBy: [{ isPublished: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          location: { select: { id: true, name: true, city: true } },
          roomType: { select: { id: true, name: true } },
          bookings: {
            select: {
              id: true,
              reference: true,
              checkIn: true,
              checkOut: true,
              adults: true,
              children: true,
              guestFirstName: true,
              guestLastName: true,
              guestEmail: true,
              guestPhone: true,
              status: true,
              expiresAt: true,
              payments: { select: { status: true } },
              userId: true,
            },
            orderBy: { checkIn: "desc" },
          },
        },
      }),
      prisma.room.count({ where }),
    ]);

    return ok({ rooms, total, page, limit, totalPages: Math.ceil(total / limit) });
  }

  if (req.method === "POST") {
    const parsed = await parseBody(req, roomCreateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    // Vérifier existence des FK
    const [location, roomType] = await Promise.all([
      prisma.location.findUnique({ where: { id: body.locationId } }),
      prisma.roomType.findUnique({ where: { id: body.roomTypeId } }),
    ]);
    if (!location) return fail("Localisation introuvable", 400, "INVALID_LOCATION");
    if (!roomType) return fail("Type de chambre introuvable", 400, "INVALID_ROOM_TYPE");

    // Contraintes d'unicité sur le nom et le numéro
    const [nameTaken, numTaken] = await Promise.all([
      prisma.room.findFirst({ where: { name: body.name }, select: { id: true } }),
      body.roomNumber
        ? prisma.room.findFirst({ where: { roomNumber: body.roomNumber }, select: { id: true } })
        : Promise.resolve(null),
    ]);
    if (nameTaken) return fail(`Une chambre porte déjà le nom « ${body.name} »`, 409, "NAME_TAKEN");
    if (numTaken) return fail(`Une chambre porte déjà le numéro « ${body.roomNumber} »`, 409, "ROOM_NUMBER_TAKEN");

    let slug: string;
    if (body.slug) {
      const existing = await prisma.room.findUnique({ where: { slug: body.slug }, select: { id: true } });
      if (existing) return fail(`Le slug « ${body.slug} » est déjà utilisé`, 409, "SLUG_TAKEN");
      slug = body.slug;
    } else {
      // nom + numéro, suffixe aléatoire à 6 chiffres si déjà pris
      slug = await ensureUniqueRoomSlug(roomSlugBase(body.name, body.roomNumber));
    }

    const room = await prisma.room.create({ data: { ...body, slug } });
    return ok({ room }, { status: 201 });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET, handler as POST };
