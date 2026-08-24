import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { roomUpdateSchema, slugify } from "@/lib/catalog/schemas";

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  const slug = req.nextUrl.pathname.split("/").pop()!;
  if (req.method === "GET") {
    const room = await prisma.room.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        roomNumber: true,
        shortDescription: true,
        description: true,
        basePrice: true,
        currency: true,
        maxGuests: true,
        beds: true,
        bathrooms: true,
        sizeSqm: true,
        amenities: true,
        coverImageUrl: true,
        isPublished: true,
        order: true,
        checkInStart: true,
        checkInEnd: true,
        checkOutTime: true,
        checkInMethod: true,
        cancellationPolicy: true,
        location: { select: { id: true, name: true, city: true } },
        roomType: { select: { id: true, name: true } },
        media: { orderBy: { order: "asc" } },
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
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { checkIn: "desc" },
        },
      },
    });
    if (!room) return fail("Chambre introuvable", 404, "NOT_FOUND");
    return ok({ room });
  }

  if (req.method === "PATCH") {
    const parsed = await parseBody(req, roomUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const room = await prisma.room.findUnique({ where: { slug } });
    if (!room) return fail("Chambre introuvable", 404, "NOT_FOUND");

    // Vérifier FK si changées
    if (body.locationId) {
      const loc = await prisma.location.findUnique({ where: { id: body.locationId } });
      if (!loc) return fail("Localisation introuvable", 400, "INVALID_LOCATION");
    }
    if (body.roomTypeId) {
      const rt = await prisma.roomType.findUnique({ where: { id: body.roomTypeId } });
      if (!rt) return fail("Type de chambre introuvable", 400, "INVALID_ROOM_TYPE");
    }

    if (body.slug && body.slug !== slug) {
      const existing = await prisma.room.findFirst({ where: { slug: body.slug, id: { not: room.id } } });
      if (existing) return fail("Slug déjà utilisé", 409, "SLUG_TAKEN");
    }

    const updated = await prisma.room.update({
      where: { slug },
      data: body.slug ? body : { ...body, slug: body.name ? slugify(body.name) : undefined },
    });
    return ok({ room: updated });
  }

  if (req.method === "DELETE") {
    await prisma.room.delete({ where: { slug } });
    return ok({ deleted: true });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET, handler as PATCH, handler as DELETE };
