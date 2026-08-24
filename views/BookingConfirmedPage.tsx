"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Calendar, Users, MapPin, Phone, Mail, Download, Share2, Home, ArrowRight, QrCode, Shield, Clock } from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { getProperty } from "@/data/properties";
import { Button } from "@/components/ui/button";

export function BookingConfirmedPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const p = id ? getProperty(id) : null;
  
  if (!p) return null;
  
  // Mock booking data - in a real app this would come from URL params or state
  const bookingData = {
    confirmationNumber: "MNS-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
    checkIn: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    checkOut: new Date(Date.now() + (14 + p.nights) * 24 * 60 * 60 * 1000),
    guests: { adults: 2, children: 0 },
    total: (p.price * p.nights + 120 + Math.round(p.price * p.nights * 0.12)) * 600,
    guest: {
      firstName: "Kouamé",
      lastName: "Adje",
      email: "email@example.com",
      phone: "+225 07 00 00 00 00",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <div className="mx-auto max-w-4xl px-6 lg:px-10 pt-10 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Success header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 grid place-items-center mb-6"
            >
              <CheckCircle2 className="h-10 w-10" />
            </motion.div>
            <h1 className="font-display text-4xl sm:text-5xl mb-4">Réservation confirmée !</h1>
            <p className="text-lg text-muted-foreground">
              Numéro de confirmation : <span className="font-mono font-medium text-foreground">{bookingData.confirmationNumber}</span>
            </p>
          </div>

          {/* Booking details card */}
          <div className="border border-border rounded-3xl p-8 bg-card shadow-[var(--shadow-card)] mb-8">
            <div className="flex gap-6 mb-8 pb-8 border-b border-border">
              <img src={p!.image} alt={p!.title} className="h-32 w-32 rounded-2xl object-cover" />
              <div className="flex-1">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{p!.category}</div>
                <h2 className="font-display text-2xl mb-2">{p!.title}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {p!.location}, {p!.country}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Dates</div>
                    <div className="font-medium">
                      {bookingData.checkIn.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {" → "}
                      {bookingData.checkOut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-sm text-muted-foreground">{p!.nights} nuit{p!.nights > 1 ? "s" : ""}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Voyageurs</div>
                    <div className="font-medium">
                      {bookingData.guests.adults} adulte{bookingData.guests.adults > 1 ? 's' : ''}
                      {bookingData.guests.children > 0 && `, ${bookingData.guests.children} enfant${bookingData.guests.children > 1 ? 's' : ''}`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email</div>
                    <div className="font-medium">{bookingData.guest.email}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Téléphone</div>
                    <div className="font-medium">{bookingData.guest.phone}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-secondary/50 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{(p!.price * 600).toLocaleString()} FCFA × {p!.nights} nuits</span>
                <span>{(p!.price * p!.nights * 600).toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frais de ménage</span>
                <span>{(120 * 600).toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frais de service</span>
                <span>{(Math.round(p!.price * p!.nights * 0.12) * 600).toLocaleString()} FCFA</span>
              </div>
              <div className="pt-3 border-t border-border flex justify-between font-display text-lg">
                <span>Total payé</span>
                <span>{bookingData.total.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          {/* Important information */}
          <div className="border border-border rounded-3xl p-8 bg-card shadow-[var(--shadow-card)] mb-8">
            <h3 className="font-display text-xl mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Informations importantes
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  Arrivée
                </div>
                <div className="text-sm text-muted-foreground space-y-1 pl-6">
                  <div>• 15:00 – 22:00</div>
                  <div>• Arrivée autonome avec clavier</div>
                  <div>• Code envoyé à {bookingData.guest.email}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4" />
                  Départ
                </div>
                <div className="text-sm text-muted-foreground space-y-1 pl-6">
                  <div>• 11:00</div>
                  <div>• Laissez les clés dans le coffre</div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Politique d'annulation :</strong> Annulation gratuite avant 7 jours. 50% de remboursement avant 3 jours.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg" className="gap-2">
              <Download className="h-4 w-4" />
              Télécharger la confirmation
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <Share2 className="h-4 w-4" />
              Partager la réservation
            </Button>
            <Button size="lg" className="gap-2" asChild>
              <Link href="/guest-stays">
                <Home className="h-4 w-4" />
                Retour aux séjours
              </Link>
            </Button>
          </div>

          {/* Host contact */}
          <div className="mt-12 text-center p-6 rounded-2xl bg-secondary/50">
            <p className="text-sm text-muted-foreground mb-2">
              Votre hôte <span className="font-medium text-foreground">{p!.host.name}</span> vous contactera bientôt avec les instructions d'arrivée.
            </p>
            <p className="text-xs text-muted-foreground">
              Besoin d'aide ? Contactez-nous à <a href="mailto:contact@maison.ci" className="text-primary hover:underline">contact@maison.ci</a>
            </p>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
