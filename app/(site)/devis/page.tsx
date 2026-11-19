import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { QuotePage } from "@/views/QuotePage";

export const metadata: Metadata = {
  title: "Devis groupes, séminaires et événements",
  description: "Demandez un devis à l'Hôtel Nahoui Balmer pour un séjour de groupe, un séminaire ou un événement privé à San-Pédro.",
  alternates: { canonical: "/devis" },
};

export const revalidate = 300;

export default async function Page() {
  const seminarRooms = await prisma.facility
    .findMany({
      where: { isPublished: true, category: "SEMINAIRE" },
      orderBy: { order: "asc" },
      select: { name: true, capacity: true },
    })
    .catch(() => []);
  return (
    <Suspense>
      <QuotePage seminarRooms={seminarRooms} />
    </Suspense>
  );
}
