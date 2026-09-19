import { prisma } from "@/lib/prisma";
import { ok, fail, withAuth } from "@/lib/auth/api";

export const runtime = "nodejs";

const handler = withAuth(async (req) => {
  if (req.method === "GET") {
    const { searchParams } = new URL(req.url);
    const take = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    const [notifications, unreadCount, total] = await Promise.all([
      prisma.adminNotification.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * take,
        take,
      }),
      prisma.adminNotification.count({ where: { read: false } }),
      prisma.adminNotification.count(),
    ]);
    return ok({ notifications, unreadCount, total, hasMore: page * take < total });
  }

  if (req.method === "PATCH") {
    let body: { id?: string; all?: boolean };
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    if (body.all) {
      await prisma.adminNotification.updateMany({
        where: { read: false },
        data: { read: true },
      });
      return ok({ updated: true });
    }

    if (!body.id) return fail("id requis", 400, "BAD_REQUEST");
    await prisma.adminNotification.update({
      where: { id: body.id },
      data: { read: true },
    });
    return ok({ updated: true });
  }

  return fail("Méthode non autorisée", 405, "METHOD_NOT_ALLOWED");
}, { roles: ["ADMIN", "SUPER_ADMIN"] });

export { handler as GET, handler as PATCH };
