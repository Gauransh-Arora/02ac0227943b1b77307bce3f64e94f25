import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import type { DailyAccuracyPoint } from "../../lib/api";
import { formatMW } from "../../lib/formatters";

interface DailyAccuracyChartProps {
  data: DailyAccuracyPoint[];
  onSelectDate?: (date: string) => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DailyAccuracyPoint;
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;

  return (
    <div className="p-3 bg-[#F2F0E9] border border-[#D8DDD6] rounded-xl shadow-lg text-xs space-y-1 backdrop-blur-md">
      <p className="font-semibold text-[#26312E] pb-1 border-b border-[#D8DDD6]">
        {point.date} ({point.matched_periods} periods)
      </p>
      <div className="flex items-center justify-between gap-4 text-[#506D5B]">
        <span>Mean Absolute Error:</span>
        <span className="font-bold">{formatMW(point.mae_mw, 1)} MW</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[#76847E]">
        <span>RMSE:</span>
        <span className="font-medium">{formatMW(point.rmse_mw, 1)} MW</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[#76847E]">
        <span>Forecast Bias:</span>
        <span className={`font-medium ${point.bias_mw && point.bias_mw > 0 ? "text-amber-700" : "text-blue-700"}`}>
          {point.bias_mw && point.bias_mw > 0 ? `+${formatMW(point.bias_mw, 1)}` : formatMW(point.bias_mw, 1)} MW
        </span>
      </div>
    </div>
  );
};

export const DailyAccuracyChart: React.FC<DailyAccuracyChartProps> = ({
  data,
  onSelectDate,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-[#F2F0E9]/90 backdrop-blur-xs border border-[#D8DDD6] shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-[#D8DDD6]/60">
        <div>
          <h3 className="text-sm font-bold text-[#26312E] tracking-tight">
            Daily Accuracy (MAE)
          </h3>
          <p className="text-xs text-[#76847E]">
            Mean Absolute Error in MW per day across January 2026
          </p>
        </div>
        <span className="text-[11px] font-medium text-[#506D5B] bg-[#78988A]/15 px-2.5 py-0.5 rounded-full border border-[#78988A]/20">
          Lower is better
        </span>
      </div>

      <div className="h-[240px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#D8DDD6" vertical={false} />
            <XAxis
              dataKey="label"
              interval={4}
              tick={{ fill: "#76847E", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "#D8DDD6" }}
            />
            <YAxis
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              tick={{ fill: "#76847E", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              unit=" MW"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="mae_mw"
              fill="#78988A"
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(entry: unknown) => {
                const item = entry as { date?: string };
                if (onSelectDate && item && item.date) {
                  onSelectDate(item.date);
                }
              }}
            >
              {data.map((entry) => {
                const isHigh = entry.mae_mw && entry.mae_mw > 3000;
                return (
                  <Cell
                    key={entry.date}
                    fill={isHigh ? "#506D5B" : "#78988A"}
                    className="hover:opacity-80 transition-opacity"
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 pt-2 border-t border-[#D8DDD6]/60 flex items-center justify-between text-[11px] text-[#76847E]">
        <span>31 calendar days analyzed</span>
        <span className="italic">Click a bar to inspect in Explorer</span>
      </div>
    </div>
  );
};
