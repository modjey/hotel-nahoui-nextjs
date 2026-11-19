import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, ToComplete } from "@/components/site/LegalPage";
import { HOTEL_CONTACT } from "@/lib/hotel-contact";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment l'Hôtel Nahoui Balmer collecte, utilise et protège vos données personnelles.",
  alternates: { canonical: "/confidentialite" },
};

export default function Page() {
  return (
    <LegalPage eyebrow="Vos données" title="Politique de confidentialité" updatedAt="19 novembre 2026">
      <section>
        <h2>Responsable du traitement</h2>
        <p>
          Hôtel Nahoui Balmer, 01 BP 1864 San-Pédro 01, Côte d&apos;Ivoire. Pour toute question sur vos données :{" "}
          <a href={`mailto:${HOTEL_CONTACT.reservationsEmail}`}>{HOTEL_CONTACT.reservationsEmail}</a>.
        </p>
        <p>
          Les traitements sont réalisés dans le cadre de la loi n° 2013-450 du 19 juin 2013 relative à la protection
          des données à caractère personnel. Déclaration ou autorisation auprès de l&apos;ARTCI :{" "}
          <ToComplete>numéro de récépissé ARTCI</ToComplete>.
        </p>
      </section>

      <section>
        <h2>Données collectées et finalités</h2>
        <ul>
          <li><strong>Compte client</strong> (nom, email, téléphone) : connexion par code à usage unique ou via Google / Facebook.</li>
          <li><strong>Réservations</strong> (dates, nombre de voyageurs, coordonnées) : traiter votre demande, vous contacter pour le règlement et confirmer votre séjour.</li>
          <li><strong>Formulaire de contact</strong> : répondre à votre message.</li>
          <li><strong>Newsletter</strong> (email) : vous envoyer nos actualités, uniquement si vous vous êtes inscrit.</li>
          <li><strong>Photobook</strong> (photos envoyées, nom) : publication après validation par l&apos;hôtel.</li>
          <li><strong>Avis</strong> (note, commentaire, nom) : publication après modération.</li>
          <li><strong>Mesure d&apos;audience</strong> (Google Analytics) : statistiques de fréquentation anonymisées.</li>
        </ul>
      </section>

      <section>
        <h2>Destinataires</h2>
        <p>
          Vos données sont destinées à l&apos;équipe de l&apos;hôtel. Elles sont transmises à nos prestataires techniques
          uniquement pour ce qui est nécessaire : hébergement du site, envoi d&apos;emails (Resend), envoi de SMS,
          mesure d&apos;audience (Google). Elles ne sont jamais vendues.
        </p>
      </section>

      <section>
        <h2>Durée de conservation</h2>
        <p>
          Les données de réservation sont conservées <ToComplete>durée, par exemple 5 ans pour les obligations comptables</ToComplete>.
          Les messages de contact et inscriptions à la newsletter sont conservés jusqu&apos;à votre demande de suppression.
        </p>
      </section>

      <section>
        <h2>Vos droits</h2>
        <p>
          Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données, et vous opposer à leur
          utilisation, en écrivant à{" "}
          <a href={`mailto:${HOTEL_CONTACT.reservationsEmail}`}>{HOTEL_CONTACT.reservationsEmail}</a>. Vous pouvez aussi
          saisir l&apos;ARTCI (Autorité de Régulation des Télécommunications/TIC de Côte d&apos;Ivoire).
        </p>
        <p>
          Voir aussi les <Link href="/mentions-legales">mentions légales</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
