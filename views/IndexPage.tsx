"use client";
import { Nav } from "@/components/site/Nav";
import { Hero, type HeroContent } from "@/components/site/Hero";
import { HighlightsSection } from "@/components/site/HighlightsSection";
import type { PublicEvent, PublicOffer } from "@/lib/public-content";
import { SearchBar } from "@/components/site/SearchBar";
import { IntroSection } from "@/components/site/IntroSection";
import { QuickLinksSection } from "@/components/site/QuickLinksSection";
import { HotelHistorySection } from "@/components/site/HotelHistorySection";
import { BeHotelSection } from "@/components/site/BeHotelSection";
import { RoomsShowcaseSection } from "@/components/site/RoomsShowcaseSection";
import { AvisSection } from "@/components/site/AvisSection";
import { ContactSection } from "@/components/site/ContactSection";
import { NewsletterSection } from "@/components/site/NewsletterSection";
import { InstagramSection } from "@/components/site/InstagramSection";
import { SocialSection } from "@/components/site/SocialSection";
import { Footer } from "@/components/site/Footer";

export function IndexPage({
  facts,
  hero,
  offers = [],
  events = [],
}: {
  facts: Array<{ value: string; label: string }>;
  hero: HeroContent;
  offers?: PublicOffer[];
  events?: PublicEvent[];
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero content={hero} />

        {/* Barre de réservation à cheval sur le hero */}
        <div className="relative z-20 -mt-24 sm:-mt-[4.25rem] lg:-mt-[4.75rem]">
          <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
            <SearchBar />
          </div>
        </div>

        <IntroSection facts={facts} />
        {/* Les chambres d'abord : l'objectif n°1 du site est la demande de réservation. */}
        <RoomsShowcaseSection />
        <HighlightsSection offers={offers} events={events} />
        <QuickLinksSection />
        <HotelHistorySection />
        <BeHotelSection />
        <AvisSection />
        <ContactSection />
        <NewsletterSection />
        <InstagramSection />
        <SocialSection />
      </main>
      <Footer />
    </div>
  );
}
