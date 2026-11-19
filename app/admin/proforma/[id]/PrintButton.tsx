"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="h-10 px-5 bg-[#2F4538] text-white text-sm print:hidden"
    >
      Imprimer / Enregistrer en PDF
    </button>
  );
}
