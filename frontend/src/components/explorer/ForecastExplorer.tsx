import React, { useState, useEffect, useRef } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getForecasts } from "../../lib/api";
import type { ForecastResponse, ForecastPeriod } from "../../lib/api";
import { formatMW, formatDateTimeUTC, formatTimeUTC, formatDateLabel } from "../../lib/formatters";
import { ForecastTable } from "./ForecastTable";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { EmptyState } from "../ui/EmptyState";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Zap,
  Clock,
  Compass,
} from "lucide-react";

interface ForecastExplorerProps {
  initialDate?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ForecastPeriod;
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;

  return (
    <div className="p-3 bg-[#F2F0E9] border border-[#D8DDD6] rounded-xl shadow-lg text-xs space-y-1.5 backdrop-blur-md min-w-[200px]">
      <p className="font-semibold text-[#26312E] pb-1 border-b border-[#D8DDD6]">
        Delivery: {formatDateTimeUTC(item.startTime)}
      </p>
      <div className="flex items-center justify-between text-[#506D5B]">
        <span>Forecast Power:</span>
        <span className="font-bold text-sm font-['Space_Grotesk']">
          {formatMW(item.generation_mw)} MW
        </span>
      </div>
      <div className="pt-1 border-t border-[#D8DDD6] flex items-center justify-between text-[11px] text-[#76847E]">
        <span>Published:</span>
        <span className="font-medium text-[#5B6B63]">{formatDateTimeUTC(item.publishTime)}</span>
      </div>
    </div>
  );
};

export const ForecastExplorer: React.FC<ForecastExplorerProps> = ({
  initialDate = "2026-01-15",
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    getForecasts(selectedDate, controller.signal)
      .then((response) => {
        if (!ignore) {
          setData(response);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore && err instanceof Error && err.name !== "AbortError") {
          setError(err.message || "Failed to fetch day-ahead forecasts.");
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
    getForecasts(selectedDate, controller.signal)
      .then((response) => {
        setData(response);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message || "Failed to fetch day-ahead forecasts.");
          setLoading(false);
        }
      });
  };

  const periods = data?.forecast_periods || [];
  let peakMW = 0;
  let minMW = Infinity;
  let totalMWh = 0;

  if (periods.length > 0) {
    periods.forEach((p) => {
      if (p.generation_mw > peakMW) peakMW = p.generation_mw;
      if (p.generation_mw < minMW) minMW = p.generation_mw;
      totalMWh += p.generation_mw;
    });
  } else {
    minMW = 0;
  }

  const currentDayNum = parseInt(selectedDate.split("-")[2], 10);

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* Header & Date Selector Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#F2F0E9]/90 backdrop-blur-xs border border-[#D8DDD6] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#26312E] tracking-tight font-['Space_Grotesk']">
              Forecast Explorer
            </h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-[#506D5B] bg-[#78988A]/20 px-2.5 py-0.5 rounded-full border border-[#78988A]/30">
              <Compass className="w-3 h-3" />
              Day-Ahead Schedule
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#76847E]">
            Inspect day-ahead wind generation forecasts for Great Britain (January 2026)
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
                id="forecast-date-input"
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
            message={`Fetching Day-Ahead Forecast for ${selectedDate}`}
            subMessage="Retrieving hourly generation estimates from /api/forecasts..."
          />
        </div>
      )}

      {error && !loading && (
        <ErrorState
          title={`Error loading forecast for ${selectedDate}`}
          message={error}
          onRetry={handleRetry}
        />
      )}

      {!loading && !error && periods.length === 0 && (
        <EmptyState
          title={`No forecast records found for ${selectedDate}`}
          message="No day-ahead forecast records were returned by the API for this date."
        />
      )}

      {!loading && !error && periods.length > 0 && (
        <>
          {/* Day Summary Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#F2F0E9]/90 border border-[#D8DDD6] shadow-xs">
              <div className="flex items-center gap-2 text-xs text-[#76847E] mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#839D2D]" />
                <span>Peak Forecasted Load</span>
              </div>
              <div className="text-2xl font-extrabold text-[#26312E] font-['Space_Grotesk']">
                {formatMW(peakMW)} <span className="text-xs font-semibold text-[#76847E]">MW</span>
              </div>
              <p className="text-[10px] text-[#76847E] mt-1">
                Highest hourly generation expected on {formatDateLabel(selectedDate)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F2F0E9]/90 border border-[#D8DDD6] shadow-xs">
              <div className="flex items-center gap-2 text-xs text-[#76847E] mb-1">
                <Zap className="w-3.5 h-3.5 text-[#506D5B]" />
                <span>Total Expected Energy</span>
              </div>
              <div className="text-2xl font-extrabold text-[#26312E] font-['Space_Grotesk']">
                {(totalMWh / 1000).toFixed(1)} <span className="text-xs font-semibold text-[#76847E]">GWh</span>
              </div>
              <p className="text-[10px] text-[#76847E] mt-1">
                Integrated 24-hour day-ahead forecast volume
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F2F0E9]/90 border border-[#D8DDD6] shadow-xs">
              <div className="flex items-center gap-2 text-xs text-[#76847E] mb-1">
                <Clock className="w-3.5 h-3.5 text-[#78988A]" />
                <span>Minimum Forecasted Load</span>
              </div>
              <div className="text-2xl font-extrabold text-[#26312E] font-['Space_Grotesk']">
                {formatMW(minMW)} <span className="text-xs font-semibold text-[#76847E]">MW</span>
              </div>
              <p className="text-[10px] text-[#76847E] mt-1">
                Lowest hourly dispatch forecasted
              </p>
            </div>
          </div>

          {/* Daily Forecast Chart */}
          <div className="p-5 rounded-2xl bg-[#F2F0E9]/90 backdrop-blur-xs border border-[#D8DDD6] shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2 border-b border-[#D8DDD6]/60">
              <div>
                <h2 className="text-base font-bold text-[#26312E] tracking-tight">
                  24-Hour Forecast Profile: {formatDateLabel(selectedDate)}, 2026
                </h2>
                <p className="text-xs text-[#76847E]">
                  Hourly wind power forecast in MW (UTC delivery timestamps)
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#506D5B] bg-[#78988A]/15 px-3 py-1 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-[#839D2D]" />
                WINDFOR Day-Ahead Forecast
              </div>
            </div>

            <div className="h-[300px] sm:h-[340px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={periods}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#839D2D" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#839D2D" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
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
                  <Area
                    type="monotone"
                    dataKey="generation_mw"
                    stroke="#839D2D"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#forecastFill)"
                    dot={{ r: 2.5, fill: "#839D2D" }}
                    activeDot={{ r: 5, strokeWidth: 0, fill: "#506D5B" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Forecast Table */}
          <ForecastTable periods={periods} />
        </>
      )}
    </div>
  );
};
