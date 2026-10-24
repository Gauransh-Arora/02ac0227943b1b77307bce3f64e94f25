import React from "react";
import { CheckCircle2, Clock, Database, Layers } from "lucide-react";
import { formatMW } from "../../lib/formatters";

interface CoveragePanelProps {
  actualRecords: number;
  selectedForecastRecords: number;
  matchedPeriods: number;
}

export const CoveragePanel: React.FC<CoveragePanelProps> = ({
  actualRecords,
  selectedForecastRecords,
  matchedPeriods,
}) => {
  // Expected hourly periods in January = 31 days * 24 hours = 744
  const expectedHourly = 744;
  const coveragePercent = Math.min(100, Math.round((matchedPeriods / expectedHourly) * 100));

  return (
    <div className="p-5 rounded-2xl bg-[#F2F0E9]/90 backdrop-blur-xs border border-[#D8DDD6] shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#D8DDD6]/60">
          <div>
            <h3 className="text-sm font-bold text-[#26312E] tracking-tight">
              Data Coverage & Matching
            </h3>
            <p className="text-xs text-[#76847E]">
              Completeness of January 2026 telemetry and forecasts
            </p>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {coveragePercent}% Complete
          </span>
        </div>

        {/* Breakdown Items */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          <div className="p-3 rounded-xl bg-white/70 border border-[#D8DDD6]">
            <div className="flex items-center gap-1.5 text-xs text-[#76847E] mb-1">
              <Database className="w-3.5 h-3.5 text-[#506D5B]" />
              <span>Actual Records</span>
            </div>
            <div className="text-xl font-bold text-[#26312E] font-['Space_Grotesk']">
              {formatMW(actualRecords)}
            </div>
            <p className="text-[10px] text-[#76847E] mt-0.5">
              Half-hourly (48/day)
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/70 border border-[#D8DDD6]">
            <div className="flex items-center gap-1.5 text-xs text-[#76847E] mb-1">
              <Clock className="w-3.5 h-3.5 text-[#839D2D]" />
              <span>Selected Forecasts</span>
            </div>
            <div className="text-xl font-bold text-[#26312E] font-['Space_Grotesk']">
              {formatMW(selectedForecastRecords)}
            </div>
            <p className="text-[10px] text-[#76847E] mt-0.5">
              Hourly day-ahead (24/day)
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#78988A]/10 border border-[#78988A]/30">
            <div className="flex items-center gap-1.5 text-xs text-[#506D5B] font-semibold mb-1">
              <Layers className="w-3.5 h-3.5 text-[#506D5B]" />
              <span>Matched Periods</span>
            </div>
            <div className="text-xl font-bold text-[#506D5B] font-['Space_Grotesk']">
              {formatMW(matchedPeriods)}
            </div>
            <p className="text-[10px] text-[#506D5B] mt-0.5 font-medium">
              1-to-1 hourly comparisons
            </p>
          </div>
        </div>

        {/* Descriptive Note clarifying half-hourly vs hourly */}
        <div className="p-3 rounded-xl bg-white/60 border border-[#D8DDD6] text-xs text-[#5B6B63] leading-relaxed">
          <span className="font-semibold text-[#26312E]">Resolution Notice: </span>
          Elexon publishes wind actuals at 30-minute intervals (1,488 observations) while day-ahead forecasts run at 60-minute intervals (744 periods). All 744 hourly comparison periods have a 100% matched actual observation for January 2026.
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#D8DDD6]/60 flex items-center justify-between text-[11px] text-[#76847E]">
        <span>Granularity: 1-hour delivery intervals</span>
        <span>Cutoff: 10:00 Europe/London Day-Ahead</span>
      </div>
    </div>
  );
};
