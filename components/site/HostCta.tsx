"use client";
import { motion } from "framer-motion";

const heroImg = "/assets/env.png";

export function HostCta() {
  return (
    <section id="host" className="mx-auto max-w-[1440px] px-6 lg:px-10 py-24 lg:py-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[5/6] overflow-hidden"
        >
          <img src={heroImg} alt="Hôtel Nahoui Balmer" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        </motion.div>

        <div>
          <span className="eyebrow text-primary">Pour les hôtes</span>
          <h2 className="font-display mt-5 text-4xl sm:text-5xl font-light leading-[1.1] text-balance">
            Votre maison, entre bonnes mains.
          </h2>
          <p className="mt-6 text-base text-muted-foreground max-w-md leading-relaxed text-pretty">
            Un accompagnement personnalisé, une présentation soignée et une gestion
            attentive — pensés pour celles et ceux qui tiennent à la présentation
            de leur maison.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-8">
            <button className="btn-fill-editorial">Devenir hôte</button>
            <button className="link-underline text-foreground">Comment ça marche</button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-md">
            {[
              { v: "12k+", l: "Séjours sélectionnés" },
              { v: "98%", l: "Satisfaction client" },
              { v: "47", l: "Pays" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-3xl font-light">{s.v}</div>
                <div className="eyebrow text-muted-foreground mt-2">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
