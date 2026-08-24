import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/session";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session || !isAdmin(session)) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }

    const submissions = await prisma.contactSubmission.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({
      success: true,
      data: { submissions },
    });
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la récupération des messages" },
      { status: 500 }
    );
  }
}
