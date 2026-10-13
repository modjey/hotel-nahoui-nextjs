import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" className="h-14 w-14 mb-8" />
      <p className="eyebrow text-primary">Erreur 404</p>
      <h1 className="font-display mt-5 text-5xl sm:text-7xl leading-[0.98]">Page introuvable</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        La page que vous recherchez n&rsquo;existe pas ou a été déplacée.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="btn-fill-editorial"
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
