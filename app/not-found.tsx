import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <p className="eyebrow text-primary">Erreur 404</p>
      <h1 className="font-display mt-4 text-4xl sm:text-5xl font-light">Page introuvable</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        La page que vous recherchez n&rsquo;existe pas ou a été déplacée.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Retour à l&rsquo;accueil
        </Link>
        <Link href="/stays" className="link-underline text-foreground">
          Voir les chambres &amp; suites
        </Link>
      </div>
    </div>
  );
}
