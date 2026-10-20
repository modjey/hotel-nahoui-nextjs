"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      await api.post("/api/newsletter", { email });
      toast.success("Merci, vous êtes bien inscrit(e) à notre newsletter.");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Une erreur est survenue, réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-primary p-2 sm:p-3">
      <div className="border border-white/80 text-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-[1440px] px-5 lg:px-10 py-14 lg:py-20 grid gap-10 lg:grid-cols-2 lg:items-end"
        >
          <div>
            <span className="eyebrow text-white/90">Restons en contact</span>
            <h2 className="font-display mt-4 text-4xl sm:text-5xl leading-[1.04] text-balance">
              Recevez nos actualités et offres.
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="w-full">
            <label htmlFor="newsletter-email" className="eyebrow block text-white/90">
              Votre adresse e-mail
            </label>
            <div className="mt-3 flex flex-col sm:flex-row gap-3 sm:gap-0">
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@exemple.com"
                className="flex-1 min-w-0 h-14 bg-transparent border border-white/60 sm:border-r-0 px-4 text-base text-white placeholder:text-white/65 focus:outline-none focus:border-white focus:bg-white/10 transition-colors"
              />
              <button type="submit" disabled={submitting} className="btn-on-brand h-14 disabled:opacity-60">
                {submitting ? "Inscription…" : "S’inscrire"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-xs text-white/80">Un e-mail de temps en temps, jamais de spam. Désinscription en un clic.</p>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
