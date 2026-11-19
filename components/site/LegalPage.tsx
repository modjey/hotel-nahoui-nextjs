import type { ReactNode } from "react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

/** Gabarit sobre et lisible pour les pages légales (mentions légales, confidentialité). */
export function LegalPage({ eyebrow, title, updatedAt, children }: { eyebrow: string; title: string; updatedAt?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-5 lg:px-10 pt-16 pb-12">
          <span className="eyebrow text-primary">{eyebrow}</span>
          <h1 className="font-display mt-5 text-4xl sm:text-5xl font-light text-balance">{title}</h1>
          {updatedAt && <p className="mt-4 text-sm text-muted-foreground">Dernière mise à jour : {updatedAt}</p>}
        </div>
      </section>
      <main className="mx-auto max-w-3xl px-5 lg:px-10 py-14 space-y-10 text-[0.98rem] leading-relaxed text-foreground/90 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-foreground [&_h2]:mb-3 [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li+li]:mt-1.5 [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </main>
      <Footer />
    </div>
  );
}

/** Valeur à fournir par l'hôtel avant mise en ligne : bien visible pour ne pas l'oublier. */
export function ToComplete({ children }: { children: ReactNode }) {
  return <mark className="bg-primary/10 text-primary px-1">[À compléter : {children}]</mark>;
}
