import React from "react";
import type { LargestErrorItem } from "../../lib/api";
import { formatMW, formatDateTimeUTC } from "../../lib/formatters";
import { AlertCircle, ExternalLink } from "lucide-react";

interface LargestErrorsTableProps {
  errors: LargestErrorItem[];
  onInspectDate?: (dateStr: string) => void;
}

export const LargestErrorsTable: React.FC<LargestErrorsTableProps> = ({
  errors,
  onInspectDate,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-[#F2F0E9]/90 backdrop-blur-xs border border-[#D8DDD6] shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 gap-2 border-b border-[#D8DDD6]/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#26312E] tracking-tight">
              Largest Forecast Errors
            </h3>
            <p className="text-xs text-[#76847E]">
              Peak hourly discrepancies across January 2026 sorted by absolute deviation
            </p>
          </div>
        </div>
        <span className="text-[11px] font-medium text-[#76847E] bg-white/70 px-2.5 py-1 rounded-lg border border-[#D8DDD6] self-start sm:self-auto">
          Top 15 Discrepancies
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#D8DDD6] text-[#76847E] uppercase text-[10px] tracking-wider">
              <th className="py-2.5 px-3 font-semibold w-12 text-center">Rank</th>
              <th className="py-2.5 px-3 font-semibold">Delivery Time (UTC)</th>
              <th className="py-2.5 px-3 font-semibold text-right">Forecast</th>
              <th className="py-2.5 px-3 font-semibold text-right">Actual</th>
              <th className="py-2.5 px-3 font-semibold text-right">Error (F − A)</th>
              <th className="py-2.5 px-3 font-semibold text-right">Abs Error</th>
              <th className="py-2.5 px-3 font-semibold text-center w-16">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8DDD6]/50">
            {errors.map((item) => {
              const isOver = item.error_mw > 0;
              const datePart = item.startTime.split("T")[0];

              return (
                <tr
                  key={`${item.rank}-${item.startTime}`}
                  className="hover:bg-white/60 transition-colors group"
                >
                  <td className="py-2.5 px-3 text-center font-bold text-[#506D5B]">
                    #{item.rank}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-[#26312E] whitespace-nowrap">
                    {formatDateTimeUTC(item.startTime)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-[#506D5B] font-['Space_Grotesk']">
                    {formatMW(item.forecast_mw)} MW
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-[#2563EB] font-['Space_Grotesk']">
                    {formatMW(item.actual_mw)} MW
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold font-['Space_Grotesk'] whitespace-nowrap">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded-sm ${
                        isOver
                          ? "text-amber-800 bg-amber-50"
                          : "text-blue-800 bg-blue-50"
                      }`}
                    >
                      {isOver ? `+${formatMW(item.error_mw)}` : formatMW(item.error_mw)} MW
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#8B3A3A] font-['Space_Grotesk'] whitespace-nowrap">
                    {formatMW(item.absolute_error_mw)} MW
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {onInspectDate && (
                      <button
                        onClick={() => onInspectDate(datePart)}
                        title={`Inspect day ${datePart}`}
                        className="inline-flex items-center justify-center p-1 rounded-md text-[#78988A] hover:text-[#506D5B] hover:bg-white transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
