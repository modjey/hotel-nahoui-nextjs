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
    <section className="border-y border-border">
      <div className="mx-auto max-w-[640px] px-6 py-20 lg:py-28 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="eyebrow text-primary"
        >
          Restons en contact
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="font-display mt-5 text-3xl sm:text-4xl font-light"
        >
          Recevez nos actualités et offres.
        </motion.h2>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          onSubmit={handleSubmit}
          className="mt-10 flex flex-col sm:flex-row items-stretch gap-4 sm:gap-0"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre adresse email"
            className="flex-1 bg-transparent border-b border-border sm:border-b sm:border-r-0 py-3 px-1 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
          />
          <button type="submit" disabled={submitting} className="btn-fill-editorial sm:ml-6 disabled:opacity-60">
            S&rsquo;inscrire
          </button>
        </motion.form>
      </div>
    </section>
  );
}
