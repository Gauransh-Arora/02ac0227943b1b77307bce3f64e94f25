import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading analytics...",
  subMessage = "Querying Elexon BMRS dataset",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-[#78988A]/10 text-[#506D5B]">
        <Loader2 className="w-6 h-6 animate-spin text-[#506D5B]" />
      </div>
      <p className="text-sm font-semibold text-[#26312E]">{message}</p>
      {subMessage && (
        <p className="text-xs text-[#76847E] mt-1">{subMessage}</p>
      )}
    </div>
  );
};
