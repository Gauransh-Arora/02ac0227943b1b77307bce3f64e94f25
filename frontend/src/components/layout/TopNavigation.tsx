import React from "react";
import { LayoutDashboard, Compass, Activity } from "lucide-react";

export type NavTab = "overview" | "explorer" | "accuracy";

interface TopNavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    { id: "overview" as NavTab, label: "Overview", icon: LayoutDashboard },
    { id: "explorer" as NavTab, label: "Forecast Explorer", icon: Compass },
    { id: "accuracy" as NavTab, label: "Accuracy Analysis", icon: Activity },
  ];

  return (
    <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 select-none">
      {/* Tab Navigation Pill Bar */}
      <nav
        aria-label="Dashboard Navigation"
        className="flex items-center p-1.5 rounded-2xl bg-white/80 backdrop-blur-md border border-[#D8DDD6] shadow-xs overflow-x-auto"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 whitespace-nowrap focus:outline-hidden focus:ring-2 focus:ring-[#78988A] ${
                isActive
                  ? "bg-[#839D2D] text-white shadow-sm"
                  : "text-[#5B6B63] hover:text-[#26312E] hover:bg-black/5"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-[#78988A]"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Top Status & Metadata Pill */}
      <div className="flex items-center justify-between sm:justify-end gap-3 px-3.5 py-1.5 rounded-2xl bg-white/70 backdrop-blur-md border border-[#D8DDD6] shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#839D2D] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#839D2D]"></span>
          </span>
          <span className="text-[#5B6B63] font-medium hidden md:inline">Elexon BMRS Verified</span>
          <span className="text-[#26312E] font-semibold text-[11px] bg-[#E7E8E0] px-2 py-0.5 rounded-md border border-[#D8DDD6]">
            Jan 2026
          </span>
        </div>

        <div className="h-4 w-px bg-[#D8DDD6] hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#506D5B] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            GB
          </div>
          <div className="text-left hidden lg:block leading-tight">
            <p className="text-[11px] font-bold text-[#26312E]">Fleet Analytics</p>
            <p className="text-[9px] text-[#76847E]">Great Britain</p>
          </div>
        </div>
      </div>
    </header>
  );
};
