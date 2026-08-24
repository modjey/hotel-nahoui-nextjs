"use client";
import { motion } from "framer-motion";

const d1 = "/assets/dest-1.jpg";
const d2 = "/assets/dest-2.jpg";
const d3 = "/assets/dest-3.jpg";

const items = [
  { img: d2, name: "Assinie", count: "284 séjours", kicker: "Côte d'Ivoire" },
  { img: d3, name: "Yamoussoukro", count: "162 séjours", kicker: "Côte d'Ivoire" },
  { img: d1, name: "Grand-Bassam", count: "97 séjours", kicker: "Côte d'Ivoire" },
];

export function Destinations() {
  return (
    <section id="destinations" className="bg-warm py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl mb-14">
          <span className="text-xs uppercase tracking-[0.22em] text-primary">Destinations</span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl mt-3 text-balance">
            Les lieux <span className="italic font-light">où nous revenons toujours.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((d, i) => (
            <motion.a
              key={d.name}
              href="#"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
              className="group relative block overflow-hidden rounded-3xl aspect-[3/4] hover-lift"
            >
              <img
                src={d.img}
                alt={d.name}
                loading="lazy"
                width={1024}
                height={1280}
                className="absolute inset-0 h-full w-full object-cover img-zoom"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                <p className="text-xs uppercase tracking-[0.22em] opacity-80">{d.kicker}</p>
                <h3 className="font-display text-3xl mt-2">{d.name}</h3>
                <p className="text-sm opacity-90 mt-1">{d.count}</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
