import { useState } from 'react';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProblemSection } from './components/ProblemSection';
import { SolutionTimeline } from './components/SolutionTimeline';
import { FeaturesSection } from './components/FeaturesSection';
import { AiCopilotSection, type LiveScanContextItem } from './components/AiCopilotSection';
import { ReadinessScoreSection } from './components/ReadinessScoreSection';
import { PlatformModulesSection } from './components/PlatformModulesSection';
import { NationalThreatDashboard } from './components/NationalThreatDashboard';
import { BusinessModelSection } from './components/BusinessModelSection';
import { ImpactAndSdgSection } from './components/ImpactAndSdgSection';
import { ContactAndFooter } from './components/ContactAndFooter';
import type { PricingTierId, RequestMode } from './utils/quantumReadiness';

export default function App() {
  const [selectedPlanLabel, setSelectedPlanLabel] = useState<string>('Professional');
  const [requestMode, setRequestMode] = useState<RequestMode>('demo');
  const [selectedSector, setSelectedSector] = useState<string>('Healthcare');
  const [requestRevision, setRequestRevision] = useState<number>(0);
  const [liveScans, setLiveScans] = useState<LiveScanContextItem[]>([]);

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBookDemo = () => {
    setRequestMode('demo');
    setRequestRevision((prev) => prev + 1);
    scrollToSection('contact');
  };

  const handleExplorePlatform = () => {
    scrollToSection('solution');
  };

  const handleSelectPlan = (_tierId: PricingTierId, planTitle: string) => {
    setSelectedPlanLabel(planTitle);
    setRequestMode('assessment');
    setRequestRevision((prev) => prev + 1);
    scrollToSection('contact');
  };

  const handleAssessSector = (sectorLabel: string) => {
    setSelectedSector(sectorLabel);
    setRequestMode('assessment');
    setRequestRevision((prev) => prev + 1);
    scrollToSection('contact');
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#05070E] text-slate-100">
      <ScrollProgressBar />
      <Navbar onBookDemo={handleBookDemo} />

      <main>
        <HeroSection
          onBookDemo={handleBookDemo}
          onExplorePlatform={handleExplorePlatform}
        />
        <ProblemSection />
        <SolutionTimeline />
        <FeaturesSection />
        <AiCopilotSection liveScans={liveScans} />
        <ReadinessScoreSection />
        <PlatformModulesSection onAssessSector={handleAssessSector} />
        <NationalThreatDashboard onScansChange={setLiveScans} />
        <BusinessModelSection onSelectPlan={handleSelectPlan} />
        <ImpactAndSdgSection />
        <ContactAndFooter
          selectedPlanLabel={selectedPlanLabel}
          initialMode={requestMode}
          initialSector={selectedSector}
          requestRevision={requestRevision}
        />
      </main>
    </div>
  );
}
