import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} - Hôtel à San Pedro, Côte d'Ivoire`,
    short_name: "Nahoui Balmer",
    description:
      "Réservez votre séjour à l'Hôtel Nahoui Balmer : chambres, suites, restaurant, spa et piscine à San Pedro.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1ea",
    theme_color: "#e00014",
    lang: "fr",
    icons: [
      {
        src: "/icon.png",
        sizes: "624x624",
        type: "image/png",
      },
    ],
  };
}
