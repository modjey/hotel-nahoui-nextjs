"use client";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { SearchBar } from "@/components/site/SearchBar";
import { IntroSection } from "@/components/site/IntroSection";
import { EditorialSplit } from "@/components/site/EditorialSplit";
import { RestaurantSection } from "@/components/site/RestaurantSection";
import { ServicesHighlightSection } from "@/components/site/ServicesHighlightSection";
import { HotelHistorySection } from "@/components/site/HotelHistorySection";
import { RoomsShowcaseSection } from "@/components/site/RoomsShowcaseSection";
import { EventsSection } from "@/components/site/EventsSection";
import { AvisSection } from "@/components/site/AvisSection";
import { NewsletterSection } from "@/components/site/NewsletterSection";
import { InstagramSection } from "@/components/site/InstagramSection";
import { Footer } from "@/components/site/Footer";

export function IndexPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />

        <div className="relative z-20 flex justify-center px-6 -mt-24 sm:-mt-32 lg:-mt-40">
          <SearchBar />
        </div>

        <IntroSection />

        <EditorialSplit
          eyebrow="Destination"
          title={<>Vivez San&nbsp;Pedro <span className="italic">autrement.</span></>}
          text="Entre océan et lagune, San Pedro se découvre à son rythme : plages sauvages, marchés vivants et lumières changeantes composent le décor d'un séjour hors du temps."
          cta={{ label: "Découvrir la destination", href: "/services" }}
          image="/assets/env.png"
          imageAlt="Vue de San Pedro"
        />

        <EditorialSplit
          eyebrow="Bien-être"
          title={<>Une parenthèse <span className="italic">de détente.</span></>}
          text="Piscine extérieure, spa en chambre sur demande et espaces pensés pour le repos : chaque instant du séjour invite à ralentir."
          cta={{ label: "Découvrir le bien-être", href: "/bien-etre" }}
          image="/assets/spa.png"
          imageAlt="Espace bien-être de l'Hôtel Nahoui Balmer"
          reverse
        />

        <RestaurantSection />
        <ServicesHighlightSection />
        <HotelHistorySection />
        <RoomsShowcaseSection />
        <EventsSection />
        <AvisSection />
        <NewsletterSection />
        <InstagramSection />
      </main>
      <Footer />
    </div>
  );
}
