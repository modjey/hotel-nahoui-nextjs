import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { locationDetailSelect } from "@/lib/catalog/select";

type LocationWithRooms = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  coverImageUrl: string | null;
  amenities: string[];
  rooms: Array<{
    id: string;
    slug: string;
    name: string;
    roomNumber: string | null;
    shortDescription: string | null;
    basePrice: number;
    currency: string;
    maxGuests: number;
    beds: number;
    bathrooms: number;
    coverImageUrl: string | null;
    roomType: { id: string; slug: string; name: string };
  }>;
};

async function getLocation(slug: string): Promise<LocationWithRooms | null> {
  return prisma.location.findFirst({
    where: {
      isPublished: true,
      OR: [{ slug }, { id: slug }],
    },
    select: locationDetailSelect as any,
  }) as Promise<LocationWithRooms | null>;
}

async function getRoomSlug(idOrSlug: string) {
  const room = await prisma.room.findFirst({
    where: {
      isPublished: true,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    select: { slug: true },
  });

  return room?.slug ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const loc = await getLocation(slug);
  if (!loc) {
    return {
      title: "Localisation introuvable — Hôtel Nahoui",
    };
  }
  return {
    title: `${loc.name} — Hôtel Nahoui`,
    description: loc.shortDescription ?? loc.description ?? undefined,
  };
}

export default async function LocationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const location = await getLocation(slug);
  if (!location) {
    const roomSlug = await getRoomSlug(slug);
    if (roomSlug) redirect(`/rooms/${roomSlug}`);
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero avec image de couverture */}
      <section className="relative h-[400px] md:h-[500px]">
        {location.coverImageUrl ? (
          <Image
            src={location.coverImageUrl}
            alt={location.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
          <div className="max-w-7xl mx-auto">
            <p className="text-white/90 mb-2">{location.city}, {location.country}</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{location.name}</h1>
            {location.shortDescription && (
              <p className="text-lg text-white/90 max-w-2xl">{location.shortDescription}</p>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Colonne gauche : info + description */}
          <div className="lg:col-span-2 space-y-8">
            {location.description && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">À propos</h2>
                <div className="prose prose-slate max-w-none text-muted-foreground">
                  {location.description.split("\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            )}

            {location.amenities.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Équipements</h2>
                <div className="flex flex-wrap gap-2">
                  {location.amenities.map((a) => (
                    <span key={a} className="px-3 py-1.5 bg-secondary rounded-full text-sm">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Informations de contact */}
            {(location.phone || location.email || location.address) && (
              <div className="bg-card rounded-2xl p-6 border">
                <h2 className="text-xl font-semibold mb-4">Contact</h2>
                <div className="space-y-2 text-sm">
                  {location.address && <p className="flex items-center gap-2"><span className="text-muted-foreground">Adresse :</span> {location.address}</p>}
                  {location.phone && <p className="flex items-center gap-2"><span className="text-muted-foreground">Téléphone :</span> {location.phone}</p>}
                  {location.email && <p className="flex items-center gap-2"><span className="text-muted-foreground">Email :</span> {location.email}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Colonne droite : liste des chambres */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-semibold mb-6">Nos Chambres ({location.rooms.length})</h2>
            <div className="space-y-6">
              {location.rooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/rooms/${room.slug}`}
                  className="block bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-[4/3]">
                    {room.coverImageUrl ? (
                      <Image src={room.coverImageUrl} alt={room.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                        Aucune image
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-medium">
                      {room.roomType.name}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-1">
                      {room.name}
                      {room.roomNumber && <span className="text-xs text-muted-foreground ml-2">N° {room.roomNumber}</span>}
                    </h3>
                    {room.shortDescription && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{room.shortDescription}</p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {room.maxGuests} pers. · {room.beds} lit{room.beds > 1 ? "s" : ""}
                      </span>
                      <span className="font-semibold text-primary">
                        {room.basePrice.toLocaleString()} {room.currency}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {location.rooms.length === 0 && (
              <p className="text-muted-foreground text-center py-8">Aucune chambre disponible.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
