import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/auth/api";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");

  if (!checkIn || !checkOut) {
    return fail("checkIn et checkOut sont requis", 400, "BAD_REQUEST");
  }

  try {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return fail("Dates invalides", 400, "BAD_REQUEST");
    }

    if (checkInDate >= checkOutDate) {
      return fail("checkIn doit être avant checkOut", 400, "BAD_REQUEST");
    }

    const rooms = await prisma.room.findMany({
      where: { isPublished: true },
      select: { id: true },
    });

    const roomIds = rooms.map((room) => room.id);

    if (roomIds.length === 0) {
      return ok({ availability: {} });
    }

    const overlappingBookings = await prisma.booking.findMany({
      where: {
        roomId: { in: roomIds },
        status: { in: ["PENDING", "CONFIRMED"] },
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
      select: { roomId: true },
    });

    const unavailableRoomIds = new Set(overlappingBookings.map((booking) => booking.roomId));
    const availability = Object.fromEntries(
      roomIds.map((roomId) => [roomId, !unavailableRoomIds.has(roomId)]),
    );

    return ok({ availability });
  } catch (e) {
    console.error("[GET /api/rooms/availability]", e);
    return fail("Erreur serveur", 500, "INTERNAL");
  }
}
