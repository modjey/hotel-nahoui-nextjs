import type { Metadata } from "next";
import SwaggerClient from "./SwaggerClient";

export const metadata: Metadata = {
  title: "API Docs — Hôtel Nahoui",
  robots: { index: false, follow: false },
};

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-white">
      <SwaggerClient />
    </main>
  );
}
