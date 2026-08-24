"use client";
import Link from "next/link";

const footerSections = [
  {
    title: "Navigation",
    links: [
      { label: "L'Hôtel", href: "/" },
      { label: "Chambres & Suites", href: "/stays" },
      { label: "Restaurant", href: "/restaurant" },
      { label: "Expériences", href: "/services" },
      { label: "Événements", href: "/evenements" },
    ],
  },
  {
    title: "Informations",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Avis clients", href: "/avis" },
      { label: "Photobook", href: "/photobook" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

const phoneNumbers = [
  "+225 27 34 71 22 33",
  "+225 07 87 94 34 49",
];

export function Footer() {
  return (
    <footer className="bg-[var(--footer-bg)] text-foreground border-t border-[var(--footer-border)]">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_1fr_1fr] gap-14 lg:gap-10">
          <div>
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Hôtel Nahoui Balmer" className="h-9 w-9" />
              <span className="font-display text-2xl tracking-[0.14em] uppercase">
                Nahoui Balmer
              </span>
            </Link>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground max-w-xs">
              Établissement de caractère à San Pedro, où raffinement et sens de
              l&rsquo;hospitalité se conjuguent depuis 1998.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h2 className="eyebrow text-primary">{section.title}</h2>
              <ul className="mt-6 space-y-3.5 text-sm">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-foreground/80 hover:text-primary transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="eyebrow text-primary">Contact</h2>
            <div className="mt-6 space-y-3.5 text-sm text-foreground/80">
              <p>San Pedro, Côte d&rsquo;Ivoire</p>
              <a href="mailto:hotelnahoui@yahoo.com" className="block hover:text-primary transition-colors">
                hotelnahoui@yahoo.com
              </a>
              {phoneNumbers.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`} className="block hover:text-primary transition-colors">
                  {phone}
                </a>
              ))}
            </div>
            <div className="mt-6 flex gap-5 eyebrow text-muted-foreground">
              <a href="https://www.facebook.com/hotelnahouibalmer" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                Facebook
              </a>
              <a href="https://www.instagram.com/hotel_nahoui/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 lg:mt-24 pt-8 border-t border-[var(--footer-border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Hôtel Nahoui Balmer. Tous droits réservés.</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/contact" className="hover:text-primary transition-colors">Mentions légales</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
