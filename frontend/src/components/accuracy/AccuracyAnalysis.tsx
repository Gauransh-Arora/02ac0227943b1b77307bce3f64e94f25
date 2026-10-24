import React, { useState, useEffect, useRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getAccuracy } from "../../lib/api";
import type { AccuracyResponse, AccuracyPeriod } from "../../lib/api";
import { formatMW, formatDateTimeUTC, formatTimeUTC, formatDateLabel } from "../../lib/formatters";
import { MetricCard } from "../dashboard/MetricCard";
import { AccuracyTable } from "./AccuracyTable";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";

interface AccuracyAnalysisProps {
  initialDate?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: AccuracyPeriod;
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  const isOver = p.error_mw > 0;

  return (
    <div className="p-3 bg-[#F2F0E9] border border-[#D8DDD6] rounded-xl shadow-lg text-xs space-y-1.5 backdrop-blur-md min-w-[210px]">
      <p className="font-semibold text-[#26312E] pb-1 border-b border-[#D8DDD6]">
        {formatDateTimeUTC(p.startTime)}
      </p>
      <div className="flex items-center justify-between text-[#506D5B]">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-[#839D2D]" />
          Forecast:
        </span>
        <span className="font-bold">{formatMW(p.forecast_mw)} MW</span>
      </div>
      <div className="flex items-center justify-between text-[#2563EB]">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
          Actual:
        </span>
        <span className="font-bold">{formatMW(p.actual_mw)} MW</span>
      </div>
      <div className="pt-1 border-t border-[#D8DDD6] flex items-center justify-between">
        <span className="text-[#76847E]">Error (F − A):</span>
        <span
          className={`font-bold ${
            isOver ? "text-amber-700" : p.error_mw < 0 ? "text-blue-700" : "text-emerald-700"
          }`}
        >
          {isOver ? `+${formatMW(p.error_mw)}` : formatMW(p.error_mw)} MW
        </span>
      </div>
    </div>
  );
};

export const AccuracyAnalysis: React.FC<AccuracyAnalysisProps> = ({
  initialDate = "2026-01-15",
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [data, setData] = useState<AccuracyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    getAccuracy(selectedDate, controller.signal)
      .then((response) => {
        if (!ignore) {
          setData(response);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore && err instanceof Error && err.name !== "AbortError") {
          setError(err.message || "Failed to fetch day forecast accuracy.");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [selectedDate]);

  const handleDateChange = (newDate: string) => {
    if (!newDate) return;
    if (newDate >= "2026-01-01" && newDate <= "2026-01-31") {
      setLoading(true);
      setSelectedDate(newDate);
    }
  };

  const handlePrevDay = () => {
    const currentDay = parseInt(selectedDate.split("-")[2], 10);
    if (currentDay > 1) {
      const prev = `2026-01-${String(currentDay - 1).padStart(2, "0")}`;
      setLoading(true);
      setSelectedDate(prev);
    }
  };

  const handleNextDay = () => {
    const currentDay = parseInt(selectedDate.split("-")[2], 10);
    if (currentDay < 31) {
      const next = `2026-01-${String(currentDay + 1).padStart(2, "0")}`;
      setLoading(true);
      setSelectedDate(next);
    }
  };

  const handleSelectPreset = (d: string) => {
    if (d !== selectedDate) {
      setLoading(true);
      setSelectedDate(d);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    abortControllerRef.current = controller;
    getAccuracy(selectedDate, controller.signal)
      .then((response) => {
        setData(response);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message || "Failed to fetch day forecast accuracy.");
          setLoading(false);
        }
      });
  };

  const currentDayNum = parseInt(selectedDate.split("-")[2], 10);
  const periods = data?.periods || [];

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* Header & Date Selector Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#F2F0E9]/90 backdrop-blur-xs border border-[#D8DDD6] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#26312E] tracking-tight font-['Space_Grotesk']">
              Accuracy Analysis
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#506D5B] bg-[#78988A]/20 px-2.5 py-0.5 rounded-full border border-[#78988A]/30">
              <Activity className="w-3 h-3" />
              Hourly Verification
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#76847E]">
            Compare day-ahead forecasts against verified actual outturn generation
          </p>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white/80 border border-[#D8DDD6] rounded-xl p-1 shadow-2xs">
            <button
              onClick={handlePrevDay}
              disabled={currentDayNum <= 1}
              className="p-1.5 rounded-lg text-[#5B6B63] hover:text-[#26312E] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-2.5">
              <Calendar className="w-3.5 h-3.5 text-[#506D5B]" />
              <input
                type="date"
                id="accuracy-date-input"
                min="2026-01-01"
                max="2026-01-31"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#26312E] focus:outline-hidden cursor-pointer"
              />
            </div>

            <button
              onClick={handleNextDay}
              disabled={currentDayNum >= 31}
              className="p-1.5 rounded-lg text-[#5B6B63] hover:text-[#26312E] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick select presets */}
          <div className="flex items-center gap-1">
            {["2026-01-01", "2026-01-15", "2026-01-31"].map((d) => (
              <button
                key={d}
                onClick={() => handleSelectPreset(d)}
                className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors border ${
                  selectedDate === d
                    ? "bg-[#506D5B] text-white border-[#506D5B]"
                    : "bg-white/70 text-[#5B6B63] border-[#D8DDD6] hover:bg-white"
                }`}
              >
                {d === "2026-01-01" ? "Jan 1" : d === "2026-01-15" ? "Jan 15 (Mid)" : "Jan 31"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="p-8 rounded-3xl bg-[#F2F0E9]/80 backdrop-blur-md border border-[#D8DDD6]">
          <LoadingState
            message={`Computing Forecast Accuracy for ${selectedDate}`}
            subMessage="Matching day-ahead forecasts with FUELHH actuals from /api/accuracy..."
          />
        </div>
      )}

      {error && !loading && (
        <ErrorState
          title={`Error loading accuracy metrics for ${selectedDate}`}
          message={error}
          onRetry={handleRetry}
        />
      )}

      {!loading && !error && data && (
        <>
          {/* Daily Accuracy KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Daily MAE"
              value={data.mae_mw}
              unit="MW"
              description="Mean Absolute Error on this day"
              hint="Lower is better"
              highlight
            />

            <MetricCard
              title="Daily RMSE"
              value={data.rmse_mw}
              unit="MW"
              description="Root Mean Squared Error"
              hint="Penalizes outlier hours"
            />

            <MetricCard
              title="Forecast Bias"
              value={data.bias_mw}
              unit="MW"
              description="Average direction of error (F − A)"
              biasContext
            />

            <MetricCard
              title="Matched Periods"
              value={data.matched_periods}
              unit="Hrs"
              description="Verified hourly comparisons"
              hint="24 of 24 Hours"
            />
          </div>

          {/* Daily Comparison Chart */}
          <div className="p-5 rounded-2xl bg-[#F2F0E9]/90 backdrop-blur-xs border border-[#D8DDD6] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2 border-b border-[#D8DDD6]/60">
              <div>
                <h2 className="text-base font-bold text-[#26312E] tracking-tight">
                  Forecast vs Actual Profile: {formatDateLabel(selectedDate)}, 2026
                </h2>
                <p className="text-xs text-[#76847E]">
                  Direct hourly comparison of day-ahead forecast vs actual metered output
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-[#506D5B]">
                  <span className="w-3 h-1 rounded-full bg-[#839D2D]" />
                  Day-Ahead Forecast
                </span>
                <span className="flex items-center gap-1.5 text-[#2563EB]">
                  <span className="w-3 h-1 rounded-full bg-[#2563EB]" />
                  Actual Generation
                </span>
              </div>
            </div>

            <div className="h-[320px] sm:h-[360px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={periods}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8DDD6" vertical={false} />
                  <XAxis
                    dataKey="startTime"
                    tickFormatter={(v) => formatTimeUTC(v)}
                    interval={2}
                    tick={{ fill: "#76847E", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#D8DDD6" }}
                  />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    tick={{ fill: "#76847E", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    unit=" MW"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="forecast_mw"
                    name="Forecast"
                    stroke="#839D2D"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: "#839D2D" }}
                    activeDot={{ r: 5, strokeWidth: 0, fill: "#506D5B" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual_mw"
                    name="Actual"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: "#2563EB" }}
                    activeDot={{ r: 5, strokeWidth: 0, fill: "#2563EB" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Error Decomposition Table */}
          <AccuracyTable periods={periods} />
        </>
      )}
    </div>
  );
};
