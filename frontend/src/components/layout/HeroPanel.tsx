import React from "react";
import turbineImg from "../../assets/wind_trubine.png";
import { Wind, Database, Calendar, ShieldCheck, Compass, Info } from "lucide-react";

export const HeroPanel: React.FC = () => {
  return (
    <aside className="relative flex flex-col justify-between w-full lg:w-[32%] xl:w-[30%] min-h-[580px] lg:min-h-full p-5 lg:p-7 overflow-hidden rounded-3xl bg-linear-to-b from-[#78988A]/25 via-[#688879]/30 to-[#4E6B5A]/45 backdrop-blur-md border border-white/40 shadow-xl select-none">
      
      {/* Top Header: Brand & Identity */}
      <div className="relative z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/80 shadow-xs border border-white/60 text-[#26312E]">
            <Wind className="w-5 h-5 text-[#506D5B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold tracking-wider text-white drop-shadow-xs font-['Space_Grotesk']">
                AERIS
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-white/70 text-[#26312E] border border-white/50">
                UK GRID
              </span>
            </div>
            <p className="text-[11px] font-medium tracking-widest uppercase text-white/85">
              Wind Forecast Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Center Left UI Gadgets inspired by reference (+ / - zoom pill & telemetry overlay) */}
      <div className="absolute left-6 top-32 z-20 hidden md:flex flex-col items-center bg-white/70 backdrop-blur-md border border-white/60 rounded-xl py-2 px-1.5 shadow-sm text-[#26312E] text-xs font-semibold gap-2">
        <button className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/80 transition-colors" title="Zoom in">
          +
        </button>
        <div className="w-3 h-px bg-[#26312E]/20" />
        <button className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/80 transition-colors" title="Zoom out">
          −
        </button>
      </div>

      {/* Turbine Hub Telemetry Gauge overlay (inspired by reference's pitch angle arc) */}
      <div className="absolute top-[26%] right-8 z-20 hidden lg:block pointer-events-none">
        <div className="relative flex items-center justify-center w-28 h-28">
          <svg className="w-full h-full transform -rotate-45" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <path
              d="M 50 10 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="rgba(255, 255, 255, 0.85)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center text-center text-white drop-shadow-sm">
            <span className="text-xl font-bold font-['Space_Grotesk'] leading-none">45°</span>
            <span className="text-[9px] uppercase tracking-wider opacity-85">Pitch Yaw</span>
          </div>
        </div>
      </div>

      {/* Turbine Hero Image with Entrance Animation */}
      <div
        className="absolute inset-0 pointer-events-none flex items-end justify-center z-10 animate-turbine-hero"
        aria-hidden="true"
      >
        <img
          src={turbineImg}
          alt="Wind turbine hero graphic"
          className="h-[88%] lg:h-[95%] max-w-none object-contain object-bottom translate-x-4 lg:translate-x-6 drop-shadow-2xl"
          loading="eager"
        />
      </div>

      {/* Bottom Information Glass Panel (inspired by reference's "Environmental Information" card) */}
      <div className="relative z-20 mt-auto pt-44 lg:pt-0">
        <div className="p-4 rounded-2xl bg-white/75 backdrop-blur-md border border-white/60 shadow-lg text-[#26312E]">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#26312E]/10">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#506D5B]" />
              <span className="text-xs font-bold uppercase tracking-wider">
                System Parameters
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#839D2D]/20 text-[#506D5B] border border-[#839D2D]/30">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#5B6B63] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Data Source
              </span>
              <span className="font-semibold text-[#26312E]">Elexon BMRS</span>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#5B6B63] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Analysis Period
              </span>
              <span className="font-semibold text-[#26312E]">January 2026</span>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-[#5B6B63] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Dataset Status
              </span>
              <span className="font-medium text-[#26312E]">Historical Analysis</span>
            </div>
          </div>
        </div>

        {/* Bottom Title & Caption Bar */}
        <div className="mt-3.5 pt-2 flex items-end justify-between text-white/90 drop-shadow-xs">
          <div>
            <h1 className="text-base font-bold leading-tight tracking-tight">
              Wind Forecast Intelligence
            </h1>
            <p className="text-[11px] text-white/75 font-medium">
              Great Britain · January 2026 Analysis
            </p>
          </div>
          <div className="text-right">
            <span className="block text-xs font-semibold text-white">UK-GB</span>
            <span className="block text-[10px] text-white/70">National Grid ESO</span>
          </div>
        </div>
      </div>

    </aside>
  );
};
