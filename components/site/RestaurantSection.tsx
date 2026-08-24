"use client";
import { motion } from "framer-motion";
import Link from "next/link";

const dishes = [
  {
    img: "https://a0.muscache.com/im/pictures/Mt/MtTemplate-5982667/original/8f29ac13-8777-44c6-ac5e-ea025f22a1d7.jpeg?im_w=960",
    name: "Nos Brochettes",
    kicker: "Spécialités",
  },
  {
    img: "https://a0.muscache.com/im/pictures/Mt/MtTemplate-5982667/original/73ef54ef-e7e7-4829-8a85-b0f31c5f1ee5.jpeg?im_w=960",
    name: "Tradition Ivoirienne",
    kicker: "Local",
  },
  {
    img: "https://a0.muscache.com/im/pictures/Mt/MtTemplate-5982667/original/7f69b39b-7b26-4a30-9a2c-3651ffc4f17f.jpeg?im_w=960",
    name: "Fruits de mer",
    kicker: "Marin",
  },
];

export function RestaurantSection() {
  return (
    <section className="bg-warm">
      <div className="relative h-[60vh] min-h-[440px] w-full overflow-hidden">
        <motion.img
          initial={{ opacity: 0, scale: 1.05 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          src="/assets/resto.png"
          alt="Restaurant de l'Hôtel Nahoui Balmer"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="mx-auto max-w-[720px] px-6 py-20 lg:py-28 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="eyebrow text-primary"
        >
          Restaurant
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="font-display mt-5 text-4xl sm:text-5xl font-light leading-[1.1] text-balance"
        >
          Une cuisine raffinée au cœur de San Pedro.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="mt-6 text-base leading-relaxed text-muted-foreground text-pretty"
        >
          De la tradition ivoirienne aux saveurs marines, notre table célèbre
          des produits choisis avec soin, dans un cadre pensé pour prendre le temps.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="mt-9"
        >
          <Link href="/restaurant" className="link-underline text-foreground">
            Découvrir le restaurant
          </Link>
        </motion.div>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pb-24 lg:pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-10">
          {dishes.map((dish, i) => (
            <motion.a
              key={dish.name}
              href="/restaurant"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
              className="group block"
            >
              <div className="relative overflow-hidden aspect-[4/5]">
                <img
                  src={dish.img}
                  alt={dish.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover img-zoom"
                />
              </div>
              <p className="eyebrow mt-5 text-muted-foreground">{dish.kicker}</p>
              <h3 className="font-display mt-2 text-2xl font-light">{dish.name}</h3>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
