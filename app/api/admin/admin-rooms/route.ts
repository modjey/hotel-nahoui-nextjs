import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { roomCreateSchema, slugify } from "@/lib/catalog/schemas";

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  if (req.method === "GET") {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const roomTypeId = searchParams.get("roomTypeId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const where: Record<string, string> = {};
    if (locationId) where.locationId = locationId;
    if (roomTypeId) where.roomTypeId = roomTypeId;

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
              payment: { select: { status: true } },
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

    const slug = slugify(body.slug || body.name);
    const existing = await prisma.room.findUnique({ where: { slug } });
    if (existing) return fail("Slug déjà utilisé", 409, "SLUG_TAKEN");

    const room = await prisma.room.create({ data: { ...body, slug } });
    return ok({ room }, { status: 201 });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET, handler as POST };
