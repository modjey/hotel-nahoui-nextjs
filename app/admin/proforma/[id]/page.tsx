import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildBookingProforma } from "@/lib/proforma";
import { proformaHtml } from "@/lib/email-templates";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Facture proforma", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Proforma imprimable d'une réservation (accès admin, protégé par le middleware /admin).
 * Le navigateur permet de l'imprimer ou de l'enregistrer en PDF.
 */
export default async function ProformaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proforma = await buildBookingProforma(id);
  if (!proforma) notFound();

  const h = proforma.hotel;
  return (
    <main className="min-h-screen bg-neutral-100 py-10 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl bg-white p-10 shadow-sm print:shadow-none print:p-0 text-[#1E1B16]">
        <div className="flex items-start justify-between gap-6 border-b border-neutral-200 pb-6">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-14 w-14 mb-3" />
            <div className="text-lg font-semibold">{h.companyName}</div>
            <div className="text-sm text-neutral-600 whitespace-pre-line">{h.address}</div>
            <div className="text-sm text-neutral-600">{h.phone}</div>
            <div className="text-sm text-neutral-600">{h.email}</div>
            {h.legalIds && <div className="text-xs text-neutral-500 mt-1">{h.legalIds}</div>}
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold tracking-tight">FACTURE PROFORMA</div>
            <div className="text-sm text-neutral-600 mt-1">{proforma.number}</div>
            <div className="mt-4"><PrintButton /></div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Client</div>
            <div className="font-medium">{proforma.guest.name}</div>
            {proforma.guest.email && <div>{proforma.guest.email}</div>}
            {proforma.guest.phone && <div>{proforma.guest.phone}</div>}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">Hébergement</div>
            <div className="font-medium">{proforma.room.name}</div>
            {proforma.room.type && <div>{proforma.room.type}</div>}
            {proforma.booking.reference && <div>Réservation {proforma.booking.reference}</div>}
          </div>
        </div>

        <div className="mt-6" dangerouslySetInnerHTML={{ __html: proformaHtml(proforma) }} />

        {proforma.cancellationPolicy && (
          <p className="mt-6 text-xs text-neutral-600"><strong>Annulation :</strong> {proforma.cancellationPolicy}</p>
        )}
        <div className="mt-6 border-t border-neutral-200 pt-4 text-xs text-neutral-600 whitespace-pre-line">
          <strong className="block mb-1 text-neutral-800">Conditions de réservation</strong>
          {proforma.conditions}
        </div>
      </div>
    </main>
  );
}
