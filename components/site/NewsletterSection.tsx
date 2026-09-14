"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Merci, vous êtes bien inscrit(e) à notre newsletter.");
      setEmail("");
      setSubmitting(false);
    }, 600);
  };

  return (
    <section className="border-y border-border bg-red-700 text-white">
      <div className="mx-auto max-w-[520px] px-6 py-12 lg:py-16 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="eyebrow text-white"
        >
          Restons en contact
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="font-display mt-3 text-2xl sm:text-3xl font-light"
        >
          Recevez nos actualités et offres.
        </motion.h2>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col sm:flex-row items-stretch gap-3 sm:gap-0"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre adresse email"
            className="flex-1 bg-transparent border-b border-white/40 sm:border-b sm:border-r-0 py-3 px-1 text-sm text-white placeholder:text-white/70 focus:outline-none focus:border-white transition-colors"
          />
          <button type="submit" disabled={submitting} className="btn-fill-editorial sm:ml-6 bg-white text-red-700 disabled:opacity-60">
            S&rsquo;inscrire
          </button>
        </motion.form>
      </div>
    </section>
  );
}
