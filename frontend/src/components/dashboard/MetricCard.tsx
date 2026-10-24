import React from "react";
import { ArrowUpRight } from "lucide-react";
import { formatMW } from "../../lib/formatters";

interface MetricCardProps {
  title: string;
  value: number | null | undefined;
  unit?: string;
  description: string;
  hint?: string;
  biasContext?: boolean;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = "MW",
  description,
  hint,
  biasContext = false,
  highlight = false,
}) => {
  const isAvailable = value !== null && value !== undefined && !isNaN(value);
  const formattedValue = isAvailable ? formatMW(value, 1) : "—";

  // Context for bias: positive = overforecasting, negative = underforecasting
  let biasBadge = null;
  if (biasContext && isAvailable) {
    if (value > 0) {
      biasBadge = (
        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          + Overforecasting
        </span>
      );
    } else if (value < 0) {
      biasBadge = (
        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
          − Underforecasting
        </span>
      );
    } else {
      biasBadge = (
        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Neutral Bias
        </span>
      );
    }
  }

  return (
    <div
      className={`relative p-4 sm:p-5 rounded-2xl bg-[#F2F0E9]/90 backdrop-blur-xs border transition-all duration-200 hover:shadow-md ${
        highlight
          ? "border-[#78988A] ring-1 ring-[#78988A]/30"
          : "border-[#D8DDD6] hover:border-[#78988A]/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B6B63]">
          {title}
        </h3>
        <span className="w-5 h-5 rounded-full bg-white/70 border border-[#D8DDD6] flex items-center justify-center text-[#78988A]">
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>
      </div>

      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-2xl sm:text-3xl font-extrabold text-[#26312E] tracking-tight font-['Space_Grotesk']">
          {formattedValue}
        </span>
        {unit && isAvailable && (
          <span className="text-xs font-semibold text-[#76847E] uppercase">{unit}</span>
        )}
      </div>

      <div className="mt-2.5 pt-2 border-t border-[#D8DDD6]/60 flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs text-[#76847E] leading-tight">
          {description}
        </p>
        {hint && (
          <span className="text-[10px] font-medium text-[#506D5B] bg-[#78988A]/15 px-2 py-0.5 rounded-full border border-[#78988A]/20">
            {hint}
          </span>
        )}
        {biasBadge}
      </div>
    </div>
  );
};
