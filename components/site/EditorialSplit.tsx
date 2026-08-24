"use client";
import { motion } from "framer-motion";
import Link from "next/link";

type EditorialSplitProps = {
  eyebrow: string;
  title: React.ReactNode;
  text: string;
  cta: { label: string; href: string };
  image: string;
  imageAlt: string;
  reverse?: boolean;
};

export function EditorialSplit({ eyebrow, title, text, cta, image, imageAlt, reverse }: EditorialSplitProps) {
  return (
    <section className="mx-auto max-w-[1440px] px-6 lg:px-10 py-16 lg:py-24">
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-0 items-stretch ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[4/3] lg:aspect-auto overflow-hidden"
        >
          <img src={image} alt={imageAlt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        </motion.div>

        <div className="flex items-center">
          <div className="px-0 lg:px-16 py-10 lg:py-0 max-w-lg">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="eyebrow text-primary"
            >
              {eyebrow}
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="font-display mt-5 text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.1] text-balance"
            >
              {title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="mt-6 text-base leading-relaxed text-muted-foreground text-pretty"
            >
              {text}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className="mt-8"
            >
              <Link href={cta.href} className="btn-fill-editorial">
                {cta.label}
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
