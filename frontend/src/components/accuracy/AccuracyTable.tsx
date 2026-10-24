import React, { useState } from "react";
import type { AccuracyPeriod } from "../../lib/api";
import { formatMW, formatDateTimeUTC } from "../../lib/formatters";
import { ArrowUpDown, AlertCircle, Clock } from "lucide-react";

interface AccuracyTableProps {
  periods: AccuracyPeriod[];
}

type SortField = "startTime" | "error_mw" | "absolute_error_mw" | "forecast_mw" | "actual_mw";

export const AccuracyTable: React.FC<AccuracyTableProps> = ({ periods }) => {
  const [sortField, setSortField] = useState<SortField>("startTime");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === "startTime");
    }
  };

  const sortedPeriods = [...periods].sort((a, b) => {
    const comparison =
      sortField === "startTime"
        ? a.startTime.localeCompare(b.startTime)
        : a[sortField] - b[sortField];
    return sortAsc ? comparison : -comparison;
  });

  const maxAbsError = Math.max(...periods.map((p) => p.absolute_error_mw), 0);

  return (
    <div className="p-5 rounded-2xl bg-[#F2F0E9]/90 backdrop-blur-xs border border-[#D8DDD6] shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 gap-2 border-b border-[#D8DDD6]/60">
        <div>
          <h3 className="text-sm font-bold text-[#26312E] tracking-tight">
            Hourly Error Decomposition
          </h3>
          <p className="text-xs text-[#76847E]">
            Sign convention: <code className="px-1.5 py-0.5 rounded bg-white border border-[#D8DDD6] font-semibold text-[#506D5B]">Error = Forecast − Actual</code>
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#76847E]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            + Overforecast
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            − Underforecast
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto max-h-[460px] overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-[#F2F0E9] border-b border-[#D8DDD6] shadow-2xs z-10">
            <tr className="text-[#76847E] uppercase text-[10px] tracking-wider select-none">
              <th
                onClick={() => handleSort("startTime")}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-[#26312E]"
              >
                <div className="flex items-center gap-1">
                  <span>Delivery Time (UTC)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-semibold">Published At (UTC)</th>
              <th
                onClick={() => handleSort("forecast_mw")}
                className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-[#26312E]"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Forecast</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("actual_mw")}
                className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-[#26312E]"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Actual</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("error_mw")}
                className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-[#26312E]"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Error (MW)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort("absolute_error_mw")}
                className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-[#26312E]"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Abs Error</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D8DDD6]/50">
            {sortedPeriods.map((period) => {
              const isOver = period.error_mw > 0;
              const isPeakError = period.absolute_error_mw === maxAbsError;

              return (
                <tr
                  key={period.startTime}
                  className={`hover:bg-white/60 transition-colors ${
                    isPeakError ? "bg-amber-500/5 font-medium" : ""
                  }`}
                >
                  <td className="py-2.5 px-3 font-medium text-[#26312E] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {isPeakError && (
                        <span title="Peak Error Period for the Day">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        </span>
                      )}
                      <span>{formatDateTimeUTC(period.startTime)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-[#5B6B63] whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#78988A]" />
                      <span>{formatDateTimeUTC(period.publishTime)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-[#506D5B] font-['Space_Grotesk'] whitespace-nowrap">
                    {formatMW(period.forecast_mw)} MW
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-[#2563EB] font-['Space_Grotesk'] whitespace-nowrap">
                    {formatMW(period.actual_mw)} MW
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold font-['Space_Grotesk'] whitespace-nowrap">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded-sm ${
                        isOver
                          ? "text-amber-800 bg-amber-50"
                          : "text-blue-800 bg-blue-50"
                      }`}
                    >
                      {isOver ? `+${formatMW(period.error_mw)}` : formatMW(period.error_mw)} MW
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-[#26312E] font-['Space_Grotesk'] whitespace-nowrap">
                    {formatMW(period.absolute_error_mw)} MW
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
