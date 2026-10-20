"use client";
import Link from "next/link";

const socialLinks = [
  { name: "Instagram", href: "https://www.instagram.com/hotel_nahoui/" },
  { name: "Facebook", href: "https://www.facebook.com/hotelnahouibalmer" },
  { name: "TikTok", href: "https://www.tiktok.com/@nahouihotel?is_from_webapp=1&sender_device=pc" },
  { name: "WhatsApp", href: "https://api.whatsapp.com/send?phone=%2B2250788494979" },
];

const footerSections = [
  {
    title: "Séjourner",
    links: [
      { label: "Hébergements", href: "/stays" },
      { label: "Mes réservations", href: "/bookings" },
      { label: "Avis clients", href: "/avis" },
    ],
  },
  {
    title: "Découvrir",
    links: [
      { label: "Restauration", href: "/restaurant" },
      { label: "Bien-être", href: "/bien-etre" },
      { label: "Expériences", href: "/services" },
      { label: "Événements", href: "/evenements" },
      { label: "Photobook", href: "/photobook" },
      { label: "Journal", href: "/blog" },
    ],
  },
];

const phoneNumbers = ["+225 27 34 71 22 33", "+225 07 87 94 34 49"];

export function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-10 pt-20 lg:pt-24 pb-10">
        {/* Bandeau marque + réservation */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between pb-14 border-b border-white/15">
          <div className="flex items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-16 w-16" />
            <div>
              <p className="font-display text-3xl sm:text-4xl leading-none">Hôtel Nahoui Balmer</p>
              <p className="mt-2 text-[0.9375rem] text-white/70">San Pedro, Côte d&rsquo;Ivoire · depuis 2016</p>
            </div>
          </div>
          <Link href="/stays" className="btn-fill-editorial w-fit">
            Réserver un séjour
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-12 py-14 lg:grid-cols-[1fr_1fr_1.2fr_1fr]">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-[0.8125rem] font-semibold text-white/55">{section.title}</h2>
              <ul className="mt-5 space-y-3 text-[0.9375rem]">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-white/85 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="text-[0.8125rem] font-semibold text-white/55">Contact</h2>
            <div className="mt-5 space-y-3 text-[0.9375rem] text-white/85">
              <p>01 BP 1864 San-Pedro 01</p>
              <p>Côte d&rsquo;Ivoire</p>
              {phoneNumbers.map((phone) => (
                <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`} className="block hover:text-white tabular">
                  {phone}
                </a>
              ))}
              <a href="mailto:hotelnahoui@yahoo.com" className="block hover:text-white break-all">
                hotelnahoui@yahoo.com
              </a>
              <a href="mailto:reservations@nahouihotel.ci" className="block hover:text-white break-all">
                reservations@nahouihotel.ci
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-[0.8125rem] font-semibold text-white/55">Suivre l&rsquo;hôtel</h2>
            <ul className="mt-5 space-y-3 text-[0.9375rem]">
              {socialLinks.map((social) => (
                <li key={social.name}>
                  <a href={social.href} target="_blank" rel="noopener noreferrer" className="text-white/85 hover:text-white">
                    {social.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[0.8125rem] text-white/60">
          <p>© {new Date().getFullYear()} Hôtel Nahoui Balmer. Tous droits réservés.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/contact" className="hover:text-white">Mentions légales</Link>
            <Link href="/contact" className="hover:text-white">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
