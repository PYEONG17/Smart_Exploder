import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import StudioShowcaseSection from "@/components/home/StudioShowcaseSection";
import CoursesSection from "@/components/home/CoursesSection";
import AISection from "@/components/home/AISection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/home/Footer";

/**
 * Homepage: Redesigned with authentic NoraClass aesthetic.
 * All-in-One Interactive K-9 STEM Learning Canvas.
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <FeaturesSection />
      <StudioShowcaseSection />
      <CoursesSection />
      <AISection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
