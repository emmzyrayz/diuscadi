"use client";
import React from "react";
import { motion } from "framer-motion";

interface HeatmapData {
  hour: number;
  volume: number; // 0–100
  isReal?: boolean; // true = confirmed check-in data, false/undefined = predicted
}

interface HeatmapProps {
  data: HeatmapData[];
}

export const CheckInHeatmapChart: React.FC<HeatmapProps> = ({ data }) => {
  const hasAnyData = data.some((d) => d.volume > 0);

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500" />
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
            Confirmed
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-200 border border-dashed border-blue-300" />
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
            Predicted
          </span>
        </div>
        {!hasAnyData && (
          <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest ml-auto">
            Collecting visit data…
          </span>
        )}
      </div>

      <div className="grid grid-cols-12 gap-2 h-48">
        {data.map((item, i) => {
          const isReal = item.isReal === true;
          const isEmpty = item.volume === 0;
          return (
            <div key={i} className="flex flex-col gap-2 items-center group">
              {/* Tooltip */}
              <div className="relative flex-1 w-full">
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <div className="bg-foreground text-background text-[8px] font-black px-2 py-1 rounded-lg whitespace-nowrap">
                    {item.hour}:00 —{" "}
                    {isEmpty
                      ? "No data"
                      : `${item.volume}%${isReal ? "" : " (est.)"}`}
                  </div>
                </div>
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="absolute bottom-0 w-full rounded-lg"
                  style={{
                    height: `${Math.max(item.volume, isEmpty ? 0 : 4)}%`,
                    backgroundColor: isEmpty
                      ? "#f1f5f9"
                      : isReal
                        ? item.volume > 70
                          ? "#2563eb"
                          : item.volume > 30
                            ? "#60a5fa"
                            : "#93c5fd"
                        : item.volume > 70
                          ? "#bfdbfe" // predicted — lighter blue
                          : item.volume > 30
                            ? "#dbeafe"
                            : "#eff6ff",
                    border: !isReal && !isEmpty ? "1px dashed #93c5fd" : "none",
                  }}
                />
              </div>
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">
                {item.hour}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
