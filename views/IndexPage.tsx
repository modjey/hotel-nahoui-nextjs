"use client";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { SearchBar } from "@/components/site/SearchBar";
import { IntroSection } from "@/components/site/IntroSection";
import { QuickLinksSection } from "@/components/site/QuickLinksSection";
import { HotelHistorySection } from "@/components/site/HotelHistorySection";
import { BeHotelSection } from "@/components/site/BeHotelSection";
import { RoomsShowcaseSection } from "@/components/site/RoomsShowcaseSection";
import { AvisSection } from "@/components/site/AvisSection";
import { NewsletterSection } from "@/components/site/NewsletterSection";
import { InstagramSection } from "@/components/site/InstagramSection";
import { SocialSection } from "@/components/site/SocialSection";
import { Footer } from "@/components/site/Footer";

export function IndexPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />

        <div className="relative z-20 flex justify-center px-6 -mt-64 sm:-mt-32 lg:-mt-40">
          <SearchBar />
        </div>

        <IntroSection />
        <QuickLinksSection />
        <HotelHistorySection />
        <BeHotelSection />
        <RoomsShowcaseSection />
        <AvisSection />
        <NewsletterSection />
        <InstagramSection />
        <SocialSection />
      </main>
      <Footer />
    </div>
  );
}
