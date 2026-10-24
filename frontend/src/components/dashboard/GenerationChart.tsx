import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { HourlySeriesPoint } from "../../lib/api";
import { formatMW, formatDateTimeUTC } from "../../lib/formatters";

interface GenerationChartProps {
  data: HourlySeriesPoint[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    color: string;
    payload: HourlySeriesPoint;
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const point = payload[0].payload;
  const forecast = point.forecast_mw;
  const actual = point.actual_mw;
  const error = point.error_mw;

  return (
    <div className="p-3 bg-[#F2F0E9] border border-[#D8DDD6] rounded-xl shadow-lg text-xs min-w-[210px] space-y-1.5 backdrop-blur-md">
      <p className="font-semibold text-[#26312E] pb-1 border-b border-[#D8DDD6]">
        {formatDateTimeUTC(point.startTime)}
      </p>
      <div className="flex items-center justify-between text-[#506D5B]">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-[#839D2D]" />
          Forecast:
        </span>
        <span className="font-bold">{formatMW(forecast)} MW</span>
      </div>
      <div className="flex items-center justify-between text-[#355C7D]">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
          Actual:
        </span>
        <span className="font-bold">{formatMW(actual)} MW</span>
      </div>
      <div className="pt-1 border-t border-[#D8DDD6] flex items-center justify-between">
        <span className="text-[#76847E]">Error (F − A):</span>
        <span
          className={`font-bold ${
            error > 0 ? "text-amber-700" : error < 0 ? "text-blue-700" : "text-emerald-700"
          }`}
        >
          {error > 0 ? `+${formatMW(error)}` : formatMW(error)} MW
        </span>
      </div>
    </div>
  );
};

export const GenerationChart: React.FC<GenerationChartProps> = ({ data }) => {
  const formatXTick = (tickItem: string) => {
    try {
      const d = new Date(tickItem);
      const day = d.getUTCDate();
      return `Jan ${day}`;
    } catch {
      return tickItem;
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-[#F2F0E9]/90 backdrop-blur-xs border border-[#D8DDD6] shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2 border-b border-[#D8DDD6]/60">
        <div>
          <h2 className="text-base font-bold text-[#26312E] tracking-tight">
            Forecast vs Actual Generation
          </h2>
          <p className="text-xs text-[#76847E]">
            Hourly generation across January 2026 (744 matched delivery periods)
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-[#506D5B]">
            <span className="w-3 h-1 rounded-full bg-[#839D2D]" />
            Day-ahead Forecast
          </span>
          <span className="flex items-center gap-1.5 text-[#2563EB]">
            <span className="w-3 h-1 rounded-full bg-[#2563EB]" />
            Actual Generation
          </span>
        </div>
      </div>

      <div className="h-[340px] sm:h-[380px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#D8DDD6" vertical={false} />
            <XAxis
              dataKey="startTime"
              tickFormatter={formatXTick}
              interval={71}
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
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "#839D2D" }}
            />
            <Line
              type="monotone"
              dataKey="actual_mw"
              name="Actual"
              stroke="#2563EB"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: "#2563EB" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
