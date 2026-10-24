import React from "react";
import type { ForecastPeriod } from "../../lib/api";
import { formatMW, formatDateTimeUTC } from "../../lib/formatters";
import { Clock, Radio } from "lucide-react";

interface ForecastTableProps {
  periods: ForecastPeriod[];
}

export const ForecastTable: React.FC<ForecastTableProps> = ({ periods }) => {
  return (
    <div className="p-5 rounded-2xl bg-[#F2F0E9]/90 backdrop-blur-xs border border-[#D8DDD6] shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 gap-2 border-b border-[#D8DDD6]/60">
        <div>
          <h3 className="text-sm font-bold text-[#26312E] tracking-tight">
            Day-Ahead Forecast Schedule
          </h3>
          <p className="text-xs text-[#76847E]">
            Selected forecast versions frozen at the 10:00 Europe/London day-ahead decision cutoff
          </p>
        </div>
        <span className="text-[11px] font-semibold text-[#506D5B] bg-[#78988A]/15 px-2.5 py-1 rounded-lg border border-[#78988A]/25 self-start sm:self-auto">
          {periods.length} Delivery Periods
        </span>
      </div>

      <div className="mt-4 overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-[#F2F0E9] border-b border-[#D8DDD6] shadow-2xs z-10">
            <tr className="text-[#76847E] uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3 font-semibold">Delivery Time (UTC)</th>
              <th className="py-2.5 px-3 font-semibold">Published At (UTC)</th>
              <th className="py-2.5 px-3 font-semibold text-right">Forecast Generation</th>
              <th className="py-2.5 px-3 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8DDD6]/50">
            {periods.map((period, idx) => (
              <tr
                key={period.startTime}
                className="hover:bg-white/60 transition-colors"
              >
                <td className="py-2.5 px-3 font-medium text-[#26312E] whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-[#76847E] text-[10px]">{idx + 1}</span>
                    <span>{formatDateTimeUTC(period.startTime)}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-[#5B6B63] whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#78988A]" />
                    <span>{formatDateTimeUTC(period.publishTime)}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-[#506D5B] font-['Space_Grotesk'] text-sm">
                  {formatMW(period.generation_mw)} MW
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#839D2D]/15 text-[#506D5B] border border-[#839D2D]/25">
                    <Radio className="w-2.5 h-2.5 text-[#839D2D]" />
                    Day-Ahead
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
