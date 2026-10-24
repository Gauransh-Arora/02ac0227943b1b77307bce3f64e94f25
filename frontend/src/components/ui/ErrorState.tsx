import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Failed to load forecast data",
  message = "Could not communicate with the API server. Please ensure the backend service is running.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-[#F2F0E9] rounded-2xl border border-red-200/60 shadow-xs max-w-lg mx-auto">
      <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-3">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-[#26312E]">{title}</h3>
      <p className="text-xs text-[#76847E] mt-1.5 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-[#506D5B] text-white hover:bg-[#3D5446] transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#78988A]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};
