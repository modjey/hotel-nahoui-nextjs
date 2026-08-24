"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { PropertyCard } from "./PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";

type Room = {
  id: string;
  slug: string;
  name: string;
  roomNumber: string | null;
  shortDescription: string | null;
  basePrice: number;
  currency: string;
  maxGuests: number;
  beds: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  coverImageUrl: string | null;
  isFeatured: boolean;
  roomType: { id: string; slug: string; name: string } | null;
  location: { id: string; slug: string; name: string; city: string | null } | null;
};

export function FeaturedStays({ selectedCategory }: { selectedCategory: string | null }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ rooms: Room[] }>("/api/rooms");
        setRooms(data.rooms);
      } catch (err) {
        console.error("Erreur chargement chambres", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredRooms = useMemo(() => {
    if (!selectedCategory) return rooms.slice(0, 8);
    return rooms.filter((r) => r.roomType?.name === selectedCategory).slice(0, 8);
  }, [rooms, selectedCategory]);

  const publishedRoomCount = rooms.length;

  if (loading) {
    return (
      <section id="stays" className="mx-auto max-w-[1440px] px-6 lg:px-10 py-24 lg:py-32">
        <div className="flex items-end justify-between gap-6 mb-14">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-96" />
          </div>
          <Skeleton className="h-6 w-32 hidden sm:block" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-14">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="stays" className="mx-auto max-w-[1440px] px-6 lg:px-10 py-24 lg:py-32">
      <div className="flex items-end justify-between gap-6 mb-14">
        <div>
          <span className="eyebrow text-primary">Sélectionné</span>
          <h2 className="font-display mt-5 text-4xl sm:text-5xl font-light text-balance">
            {publishedRoomCount} chambres au style unique.
          </h2>
        </div>
        <Link href="/stays" className="hidden sm:inline-block link-underline text-foreground">
          Voir tous les séjours
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-14">
        {filteredRooms.map((room, i) => (
          <PropertyCard
            key={room.id}
            p={{
              id: room.id,
              title: room.name,
              roomNumber: room.roomNumber ?? undefined,
              location: room.location ? (room.location.city ? `${room.location.city}, ${room.location.name}` : room.location.name) : "Non spécifié",
              country: room.location?.city ?? "",
              image: room.coverImageUrl ?? "",
              gallery: [],
              rating: 4.5,
              reviews: 0,
              nights: 1,
              beds: room.beds ?? 2,
              baths: room.bathrooms ?? 1,
              guests: room.maxGuests,
              category: room.roomType?.name ?? "Non spécifié",
              host: { name: "Hôtel Nahoui", since: "2025", superhost: true },
              description: room.shortDescription ?? "",
              amenities: [],
              coords: { lat: 5.35, lng: -4 },
              price: room.basePrice,
            }}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}
