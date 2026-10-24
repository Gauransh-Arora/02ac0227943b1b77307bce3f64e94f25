import React, { useEffect, useState } from "react";
import { getOverview, getOverviewSeries } from "../lib/api";
import type { OverviewResponse, OverviewSeriesResponse } from "../lib/api";
import { MetricCard } from "../components/dashboard/MetricCard";
import { GenerationChart } from "../components/dashboard/GenerationChart";
import { DailyAccuracyChart } from "../components/dashboard/DailyAccuracyChart";
import { CoveragePanel } from "../components/dashboard/CoveragePanel";
import { LargestErrorsTable } from "../components/dashboard/LargestErrorsTable";
import { LoadingState } from "../components/ui/LoadingState";
import { ErrorState } from "../components/ui/ErrorState";
import { Calendar, History } from "lucide-react";

interface OverviewPageProps {
  onInspectDate?: (dateStr: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onInspectDate }) => {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [seriesData, setSeriesData] = useState<OverviewSeriesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviewData = (signal?: AbortSignal) => {
    Promise.all([
      getOverview(signal),
      getOverviewSeries(signal),
    ])
      .then(([overviewRes, seriesRes]) => {
        setOverview(overviewRes);
        setSeriesData(seriesRes);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message || "Failed to retrieve monthly forecast analytics.");
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchOverviewData(controller.signal);
    return () => {
      controller.abort();
    };
  }, []);

  const handleRetry = () => {
    setLoading(true);
    fetchOverviewData();
  };

  if (loading) {
    return (
      <div className="p-8 rounded-3xl bg-[#F2F0E9]/80 backdrop-blur-md border border-[#D8DDD6] shadow-sm">
        <LoadingState
          message="Aggregating January 2026 UK Wind Observations"
          subMessage="Synchronizing 744 hourly forecast and actual records from Elexon BMRS..."
        />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="p-8 rounded-3xl bg-[#F2F0E9]/80 backdrop-blur-md border border-[#D8DDD6] shadow-sm">
        <ErrorState
          title="Could not load Wind Forecast Overview"
          message={error || "Overview data is unavailable."}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const { accuracy } = overview;

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* Overview Header Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#F2F0E9]/90 backdrop-blur-xs border border-[#D8DDD6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#26312E] tracking-tight font-['Space_Grotesk']">
              Wind Forecast Overview
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#506D5B] bg-[#78988A]/20 px-2.5 py-0.5 rounded-full border border-[#78988A]/30">
              <History className="w-3 h-3" />
              Historical Analysis
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#76847E]">
            Great Britain · Analysis Period: <strong className="text-[#26312E] font-medium">January 1–31, 2026</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/70 border border-[#D8DDD6] text-xs text-[#5B6B63]">
            <Calendar className="w-3.5 h-3.5 text-[#506D5B]" />
            <span className="font-semibold text-[#26312E]">31 Days</span>
            <span className="text-[#76847E]">|</span>
            <span>744 Hourly Windows</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Mean Absolute Error"
          value={accuracy.mae_mw}
          unit="MW"
          description="Average absolute forecast error"
          hint="Lower is better"
          highlight
        />

        <MetricCard
          title="Root Mean Squared Error"
          value={accuracy.rmse_mw}
          unit="MW"
          description="Penalizes larger errors"
          hint="Lower is better"
        />

        <MetricCard
          title="Forecast Bias"
          value={accuracy.bias_mw}
          unit="MW"
          description="Forecast minus actual generation"
          biasContext
        />

        <MetricCard
          title="Matched Periods"
          value={accuracy.matched_periods}
          unit="Hrs"
          description="Hourly forecast/actual comparisons"
          hint="100% Validated"
        />
      </div>

      {/* Primary Chart: Forecast vs Actual Generation */}
      {seriesData && seriesData.hourly_series.length > 0 && (
        <GenerationChart data={seriesData.hourly_series} />
      )}

      {/* Secondary Panels Grid: Daily Accuracy & Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {seriesData && (
          <DailyAccuracyChart
            data={seriesData.daily_accuracy}
            onSelectDate={onInspectDate}
          />
        )}

        <CoveragePanel
          actualRecords={overview.actual_records}
          selectedForecastRecords={overview.selected_forecast_records}
          matchedPeriods={overview.accuracy.matched_periods}
        />
      </div>

      {/* Largest Forecast Errors Table */}
      {seriesData && seriesData.largest_errors.length > 0 && (
        <LargestErrorsTable
          errors={seriesData.largest_errors}
          onInspectDate={onInspectDate}
        />
      )}
    </div>
  );
};
