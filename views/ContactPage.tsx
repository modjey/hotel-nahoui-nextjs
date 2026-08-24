"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

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
    { icon: MapPin, title: "Adresse", content: ["Hôtel Nahoui Balmer", "San Pedro", "Côte d'Ivoire"] },
    { icon: Clock, title: "Horaires", content: ["Réception : 24h/24", "Restaurant : 6h – 23h", "Spa : 9h – 20h"] },
  ];

  const inputClass = "w-full px-0 py-3 border-b border-border bg-transparent focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground";

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 pt-16 pb-16 text-center">
          <span className="eyebrow text-primary">Contact</span>
          <h1 className="font-display mt-5 text-4xl sm:text-5xl lg:text-6xl font-light">
            Nous sommes à votre écoute.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 lg:px-10 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 border-b border-border pb-20 mb-20">
          {contactInfo.map((info, index) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: index * 0.08 }}
              className="text-center sm:text-left"
            >
              <info.icon className="h-6 w-6 text-primary mb-4 mx-auto sm:mx-0" />
              <h3 className="font-display text-xl font-light">{info.title}</h3>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {info.content.map((line) => <p key={line}>{line}</p>)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-14">
            <span className="eyebrow text-primary">Message</span>
            <h2 className="font-display mt-5 text-3xl sm:text-4xl font-light">Envoyez-nous un message</h2>
          </div>

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
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  className={`mt-2 resize-none ${inputClass}`}
                />
              </div>
              <button type="submit" disabled={submitting} className="btn-fill-editorial w-full disabled:opacity-60">
                {submitting ? "Envoi en cours..." : (<><Send className="h-3.5 w-3.5" /> Envoyer le message</>)}
              </button>
            </form>
          )}
        </motion.div>

        {/* Social */}
        <div className="mt-24 text-center border-t border-border pt-16">
          <span className="eyebrow text-primary">Réseaux</span>
          <h2 className="font-display mt-5 text-3xl sm:text-4xl font-light mb-8">Suivez-nous</h2>
          <div className="flex justify-center gap-10">
            <a href="https://www.facebook.com/hotelnahouibalmer" target="_blank" rel="noopener noreferrer" className="link-underline text-foreground">
              Facebook
            </a>
            <a href="https://www.instagram.com/hotel_nahoui/" target="_blank" rel="noopener noreferrer" className="link-underline text-foreground">
              Instagram
            </a>
          </div>
        </div>

        {/* Map */}
        <div className="mt-24">
          <div className="text-center mb-8">
            <span className="eyebrow text-primary">Localisation</span>
            <h2 className="font-display mt-5 text-3xl sm:text-4xl font-light">Nous trouver</h2>
          </div>
          <div className="h-[420px] border border-border overflow-hidden">
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
          <div className="text-center mt-6">
            <a
              href="https://www.google.com/maps/place/H%C3%B4tel+Nahoui+Sp/@4.7239875,-6.6443927,17z/data=!4m9!3m8!1s0xf961312d9e1df9d:0x7ba51b79fb1fd8ea!5m2!4m1!1i2!8m2!3d4.7239875!4d-6.6418178!16s%2Fg%2F11c2pjqlkp?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline text-foreground"
            >
              Ouvrir dans Google Maps
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
