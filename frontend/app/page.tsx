import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import StudioShowcaseSection from "@/components/home/StudioShowcaseSection";
import CTASection from "@/components/home/CTASection";
import Footer from "@/components/home/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <StudioShowcaseSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </main>
  );
}
