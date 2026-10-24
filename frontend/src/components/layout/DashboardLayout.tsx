import type { ReactNode } from "react";
import landscapeBg from "../../assets/landscape_bg.jpg";
import { HeroPanel } from "./HeroPanel";
import { TopNavigation } from "./TopNavigation";
import type { NavTab } from "./TopNavigation";

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden font-sans text-[#26312E] bg-[#E7E8E0]">
      {/* 1. Full-viewport Landscape Background Layer */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
      >
        {/* Soft landscape photo anchor at the bottom */}
        <div
          className="absolute inset-0 bg-cover bg-bottom opacity-35 filter blur-xs scale-105 transition-all duration-700"
          style={{ backgroundImage: `url(${landscapeBg})` }}
        />

        {/* Layered atmospheric gradients: pale blue sky at top transitioning to earthy sage at bottom */}
        <div className="absolute inset-0 bg-linear-to-b from-[#DCE7EB]/85 via-[#E6EDE7]/70 to-[#DCE3DA]/90 mix-blend-multiply" />

        {/* Soft vignette & surface tone overlay */}
        <div className="absolute inset-0 bg-radial from-transparent via-[#E7E8E0]/40 to-[#CAD4C9]/70" />
      </div>

      {/* 2. Main Dashboard Application Container */}
      <main className="relative z-10 flex flex-col lg:flex-row min-h-screen p-3 sm:p-5 lg:p-6 gap-5 lg:gap-6 max-w-[1780px] mx-auto">
        {/* Left Hero Region (Turbine + Brand) */}
        <HeroPanel />

        {/* Right Analytics Region */}
        <section className="flex-1 flex flex-col min-w-0">
          <TopNavigation activeTab={activeTab} onTabChange={onTabChange} />

          {/* Active Tab Page Content */}
          <div className="flex-1 transition-opacity duration-300">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};
