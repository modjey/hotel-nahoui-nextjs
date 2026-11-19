import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/LegalPage";
import { getSetting } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Conditions de réservation",
  description: "Conditions de réservation de l'Hôtel Nahoui Balmer : demande, règlement, arrivée, départ et annulation.",
  alternates: { canonical: "/conditions" },
};

export const revalidate = 300;

export default async function Page() {
  const { conditions } = await getSetting("booking");
  const paragraphs = conditions.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  return (
    <LegalPage eyebrow="Réserver" title="Conditions de réservation">
      <section>
        <ul>
          {paragraphs.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
        <p className="mt-6">
          Les conditions d&apos;annulation propres à chaque chambre sont indiquées sur sa fiche. Une question ?{" "}
          <Link href="/contact">Contactez-nous</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
