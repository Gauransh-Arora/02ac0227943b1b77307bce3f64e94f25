import React from "react";
import { Wind } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No data available",
  message = "There are no forecast or actual generation observations recorded for this selection.",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-[#F2F0E9] rounded-2xl border border-[#D8DDD6] shadow-xs">
      <div className="w-10 h-10 rounded-full bg-[#78988A]/10 flex items-center justify-center text-[#506D5B] mb-3">
        <Wind className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-[#26312E]">{title}</h3>
      <p className="text-xs text-[#76847E] mt-1 max-w-sm">{message}</p>
    </div>
  );
};
