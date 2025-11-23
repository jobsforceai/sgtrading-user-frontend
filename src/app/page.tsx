import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { Hero } from '@/components/landing/Hero';
import { FeaturesSection } from '@/components/landing/Features';
import { BotsSliderSection } from '@/components/landing/Slider';
import { PortfolioSection } from '@/components/landing/portfolio';
import { Footer } from '@/components/landing/Footer';

export default function Home() {
  return (
    <div className="relative bg-black">
      <LandingNavbar />
      <Hero />
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 -top-20 z-0 h-[400px] rounded-[40px] bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.55),_transparent_70%)] blur-3xl" />
        <FeaturesSection />
      </div>
      <BotsSliderSection />
      <PortfolioSection />
      <Footer />
    </div>

  );
}
