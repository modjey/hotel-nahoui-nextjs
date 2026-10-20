import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, withAuth } from "@/lib/auth/api";
import { roomUpdateSchema } from "@/lib/catalog/schemas";
import { roomSlugBase, ensureUniqueRoomSlug } from "@/lib/catalog/slug";

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
        discountPercent: true,
        maxGuests: true,
        beds: true,
        bathrooms: true,
        sizeSqm: true,
        amenities: true,
        coverImageUrl: true,
        isPublished: true,
        isFeatured: true,
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
            expiresAt: true,
            payments: { select: { status: true } },
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

    // Contraintes d'unicité sur le nom et le numéro (si modifiés)
    if (body.name && body.name !== room.name) {
      const nameTaken = await prisma.room.findFirst({ where: { name: body.name, id: { not: room.id } } });
      if (nameTaken) return fail(`Une chambre porte déjà le nom « ${body.name} »`, 409, "NAME_TAKEN");
    }
    if (body.roomNumber && body.roomNumber !== room.roomNumber) {
      const numTaken = await prisma.room.findFirst({ where: { roomNumber: body.roomNumber, id: { not: room.id } } });
      if (numTaken) return fail(`Une chambre porte déjà le numéro « ${body.roomNumber} »`, 409, "ROOM_NUMBER_TAKEN");
    }

    // Le slug ne change que s'il est fourni explicitement ou si le nom a
    // réellement changé — sinon il est conservé tel quel. Un slug dérivé est
    // rendu unique automatiquement (suffixe à 6 chiffres si besoin) ; un slug
    // explicite déjà pris est refusé.
    let nextSlug: string | undefined;
    if (body.slug) {
      nextSlug = body.slug;
      if (nextSlug !== slug) {
        const existing = await prisma.room.findFirst({ where: { slug: nextSlug, id: { not: room.id } } });
        if (existing) return fail(`Le slug « ${nextSlug} » est déjà utilisé`, 409, "SLUG_TAKEN");
      }
    } else if (body.name && body.name !== room.name) {
      const derived = await ensureUniqueRoomSlug(
        roomSlugBase(body.name, body.roomNumber === undefined ? room.roomNumber : body.roomNumber),
        room.id,
      );
      if (derived !== slug) nextSlug = derived;
    }

    const updated = await prisma.room.update({
      where: { slug },
      data: nextSlug ? { ...body, slug: nextSlug } : body,
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
