import type { Metadata } from "next";
import { StayDetailPage } from "@/views/StayDetailPage";
import { prisma } from "@/lib/prisma";
import { getDiscountedPrice } from "@/lib/pricing";

async function getRoom(slug: string) {
  return prisma.room.findFirst({
    where: { isPublished: true, OR: [{ slug }, { id: slug }] },
    select: {
      slug: true,
      name: true,
      roomNumber: true,
      shortDescription: true,
      description: true,
      basePrice: true,
      currency: true,
      discountPercent: true,
      coverImageUrl: true,
      location: { select: { name: true, city: true } },
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const room = await getRoom(slug);
  if (!room) {
    return { title: "Chambre introuvable", robots: { index: false, follow: false } };
  }
  const title = room.roomNumber ? `${room.name} (N° ${room.roomNumber})` : room.name;
  const description =
    room.shortDescription ??
    room.description?.slice(0, 160) ??
    `Découvrez ${room.name} à l'Hôtel Nahoui Balmer${room.location ? `, ${room.location.city ?? room.location.name}` : ""}.`;
  const price = getDiscountedPrice(room.basePrice, room.discountPercent);

  return {
    title,
    description,
    alternates: { canonical: `/rooms/${room.slug}` },
    openGraph: {
      url: `/rooms/${room.slug}`,
      title,
      description,
      type: "website",
      images: room.coverImageUrl ? [{ url: room.coverImageUrl }] : undefined,
    },
    other: {
      "product:price:amount": String(price),
      "product:price:currency": room.currency,
    },
  };
}

export default function RoomPage() {
  return <StayDetailPage />;
}
