import LandingNavbar from "../components/landing/LandingNavbar";
import LandingHero from "../components/landing/LandingHero";
import LandingRolesSection from "../components/landing/LandingRolesSection";
import LandingEngineSection from "../components/landing/LandingEngineSection";
import LandingImpactSection from "../components/landing/LandingImpactSection";
import LandingCTAFooter from "../components/landing/LandingCTAFooter";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingRolesSection />
        <LandingEngineSection />
        <LandingImpactSection />
        <LandingCTAFooter />
      </main>
    </div>
  );
}
