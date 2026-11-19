import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, ToComplete } from "@/components/site/LegalPage";
import { HOTEL_CONTACT } from "@/lib/hotel-contact";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site de l'Hôtel Nahoui Balmer, San-Pédro.",
  alternates: { canonical: "/mentions-legales" },
};

export default function Page() {
  return (
    <LegalPage eyebrow="Informations légales" title="Mentions légales" updatedAt="19 novembre 2026">
      <section>
        <h2>Éditeur du site</h2>
        <p>
          Hôtel Nahoui Balmer — 01 BP 1864 San-Pédro 01, Côte d&apos;Ivoire.
          <br />
          Téléphone : {HOTEL_CONTACT.phones.join(" / ")} · Email :{" "}
          <a href={`mailto:${HOTEL_CONTACT.generalEmail}`}>{HOTEL_CONTACT.generalEmail}</a>
        </p>
        <p>
          Forme juridique et capital : <ToComplete>forme juridique et capital social</ToComplete>
          <br />
          RCCM : <ToComplete>numéro RCCM</ToComplete> · Compte contribuable : <ToComplete>numéro CC</ToComplete>
          <br />
          Directeur de la publication : <ToComplete>nom et fonction</ToComplete>
        </p>
      </section>

      <section>
        <h2>Hébergement</h2>
        <p>
          Le site est hébergé par <ToComplete>nom, adresse et téléphone de l&apos;hébergeur</ToComplete>.
        </p>
      </section>

      <section>
        <h2>Réservations et paiement</h2>
        <p>
          Une réservation effectuée sur le site constitue une demande. Le règlement ne se fait pas en ligne :
          l&apos;hôtel contacte le client pour convenir du paiement, puis confirme la réservation par email.
          Une demande non confirmée dans le délai indiqué est annulée automatiquement.
        </p>
      </section>

      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          Les textes, photographies, logos et éléments graphiques du site sont la propriété de l&apos;Hôtel Nahoui
          Balmer ou de leurs auteurs. Toute reproduction sans autorisation écrite est interdite.
        </p>
      </section>

      <section>
        <h2>Données personnelles</h2>
        <p>
          Le traitement de vos données est décrit dans notre{" "}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
