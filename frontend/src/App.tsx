import { useState } from "react";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import type { NavTab } from "./components/layout/TopNavigation";
import { OverviewPage } from "./pages/OverviewPage";
import { ForecastExplorer } from "./components/explorer/ForecastExplorer";
import { AccuracyAnalysis } from "./components/accuracy/AccuracyAnalysis";

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [targetDate, setTargetDate] = useState<string>("2026-01-15");

  const handleInspectDate = (dateStr: string) => {
    setTargetDate(dateStr);
    setActiveTab("accuracy");
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "overview" && (
        <OverviewPage onInspectDate={handleInspectDate} />
      )}
      {activeTab === "explorer" && (
        <ForecastExplorer initialDate={targetDate} />
      )}
      {activeTab === "accuracy" && (
        <AccuracyAnalysis initialDate={targetDate} />
      )}
    </DashboardLayout>
  );
}

export default App;
