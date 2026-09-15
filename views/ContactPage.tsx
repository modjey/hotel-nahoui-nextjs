"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Facebook, Instagram } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { SocialSection } from "@/components/site/SocialSection";

export function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setFormData({ firstName: "", lastName: "", email: "", phone: "", subject: "", message: "" });
      } else {
        alert("Erreur: " + (data.error || "Erreur lors de l'envoi"));
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Erreur lors de l'envoi du message");
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: Phone, title: "Téléphone", content: ["+225 27 34 71 22 33", "+225 07 87 94 34 49", "+225 01 01 40 84 00", "+225 07 88 49 49 79"] },
    { icon: Mail, title: "Email", content: ["hotelnahoui@yahoo.com"] },
    { icon: MapPin, title: "Adresse", content: ["Hôtel Nahoui Balmer", "San Pedro, Côte d'Ivoire"] },
    { icon: Clock, title: "Horaires", content: ["Réception : 24h/24", "Restaurant : 6h – 23h", "Spa : 9h – 20h"] },
  ];

  const getContactHref = (title: string, line: string): string | null => {
    if (title === "Téléphone") return `tel:${line.replace(/[^+\d]/g, "")}`;
    if (title === "Email") return `mailto:${line}`;
    return null;
  };

  const inputClass = "h-12 w-full rounded-xl border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-foreground transition-all";
  const textareaClass = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-foreground transition-all";

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-14 pb-10 text-center">
          <span className="eyebrow text-primary">Contact</span>
          <h1 className="font-display mt-3 text-3xl sm:text-4xl lg:text-5xl font-light">
            Nous sommes à votre écoute.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 lg:px-10 py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10 items-start">
          {/* Left column: info + map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-2 flex flex-col gap-6"
          >
            <div className="rounded-sm bg-white shadow-[var(--shadow-elevated)] p-7 lg:p-8">
              <h2 className="font-display text-xl lg:text-2xl font-light mb-6">Informations</h2>
              <div className="space-y-5">
                {contactInfo.map((info) => (
                  <div key={info.title} className="flex items-start gap-4">
                    <span className="shrink-0 h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center">
                      <info.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="eyebrow text-muted-foreground">{info.title}</h3>
                      <div className="mt-1 space-y-0.5 text-sm text-foreground">
                        {info.content.map((line) => {
                          const href = getContactHref(info.title, line);
                          return href ? (
                            <a key={line} href={href} className="block hover:text-primary transition-colors">
                              {line}
                            </a>
                          ) : (
                            <p key={line}>{line}</p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 pt-6 border-t border-border flex items-center gap-3">
                <a
                  href="https://www.facebook.com/hotelnahouibalmer"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="h-10 w-10 rounded-full bg-[#1877F2] text-white grid place-items-center transition-transform hover:scale-110"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="https://www.instagram.com/hotel_nahoui/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white grid place-items-center transition-transform hover:scale-110"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="rounded-sm overflow-hidden shadow-[var(--shadow-elevated)] h-[280px] lg:h-[320px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3981.7777777777778!2d-6.6443927!3d4.7239875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xf961312d9e1df9d:0x7ba51b79fb1fd8ea!2sH%C3%B4tel+Nahoui+Sp!5e0!3m2!1sfr!2sci!4v1620000000000!5m2!1sfr!2sci"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href="https://www.google.com/maps/place/H%C3%B4tel+Nahoui+Sp/@4.7239875,-6.6443927,17z/data=!4m9!3m8!1s0xf961312d9e1df9d:0x7ba51b79fb1fd8ea!5m2!4m1!1i2!8m2!3d4.7239875!4d-6.6418178!16s%2Fg%2F11c2pjqlkp?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline self-start text-foreground -mt-2"
            >
              Ouvrir dans Google Maps
            </a>
          </motion.div>

          {/* Right column: form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="rounded-sm bg-white shadow-[var(--shadow-elevated)] p-7 lg:p-10">
              <span className="eyebrow text-primary">Message</span>
              <h2 className="font-display mt-2 text-2xl lg:text-3xl font-light">Envoyez-nous un message</h2>

              {submitted ? (
                <div className="text-center py-16">
                  <CheckCircle className="h-8 w-8 mx-auto mb-4 text-primary" />
                  <h3 className="font-display text-2xl font-light mb-2">Message envoyé</h3>
                  <p className="text-muted-foreground mb-8">Nous vous répondrons dans les plus brefs délais.</p>
                  <button onClick={() => setSubmitted(false)} className="link-underline text-foreground">
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="eyebrow text-muted-foreground">Nom</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="Votre nom"
                        required
                        className={`mt-2 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="eyebrow text-muted-foreground">Prénom</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Votre prénom"
                        required
                        className={`mt-2 ${inputClass}`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="eyebrow text-muted-foreground">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="votre@email.com"
                        required
                        className={`mt-2 ${inputClass}`}
                      />
                    </div>
                    <div>
                      <label className="eyebrow text-muted-foreground">Téléphone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+225 XX XX XX XX XX"
                        className={`mt-2 ${inputClass}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="eyebrow text-muted-foreground">Sujet</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className={`mt-2 ${inputClass}`}
                    >
                      <option value="">Sélectionnez un sujet</option>
                      <option value="reservation">Réservation</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="spa">Spa & Bien-être</option>
                      <option value="evenements">Événements</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="eyebrow text-muted-foreground">Message</label>
                    <textarea
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Votre message..."
                      required
                      className={`mt-2 ${textareaClass}`}
                    />
                  </div>
                  <button type="submit" disabled={submitting} className="btn-fill-editorial w-full disabled:opacity-60">
                    {submitting ? "Envoi en cours..." : (<><Send className="h-3.5 w-3.5" /> Envoyer le message</>)}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <SocialSection />

      <Footer />
    </div>
  );
}
