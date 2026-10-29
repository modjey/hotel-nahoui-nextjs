import { IndexPage } from '@/views/IndexPage';
import { prisma } from '@/lib/prisma';

const DEFAULT_FACTS = [
  { value: "28", label: "chambres et suites, de 23 à 80 m²" },
  { value: "10", label: "catégories, de la Standard à la Suite Présidentielle" },
  { value: "15h", label: "arrivée - départ avant 12h" },
  { value: "2016", label: "l'année où l'hotel a ouvert ses portes" },
];

export default async function Page() {
  let facts = DEFAULT_FACTS;
  try {
    const [roomCount, roomTypeCount, surfaceStats] = await Promise.all([
      prisma.room.count({ where: { isPublished: true } }),
      prisma.roomType.count({ where: { isPublished: true } }),
      prisma.room.aggregate({
        where: { isPublished: true, sizeSqm: { not: null } },
        _min: { sizeSqm: true },
        _max: { sizeSqm: true },
      }),
    ]);

    facts = [
      {
        value: roomCount.toString(),
        label: `chambres et suites, de ${surfaceStats._min.sizeSqm ?? "23"} à ${surfaceStats._max.sizeSqm ?? "80"} m²`,
      },
      {
        value: roomTypeCount.toString(),
        label: "catégories, de la Standard à la Suite Présidentielle",
      },
      { value: "15h", label: "arrivée - départ avant 12h" },
      { value: "2016", label: "l'année où l'hotel a ouvert ses portes" },
    ];
  } catch (e) {
    console.error("[home] stats indisponibles, valeurs par défaut utilisées", e);
  }

  return <IndexPage facts={facts} />;
}
