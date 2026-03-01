"use client";
import React from "react";
import { motion } from "framer-motion";

interface HeatmapData {
  hour: number;
  volume: number; // 0 to 100
}

interface HeatmapProps {
  data: HeatmapData[];
}

export const CheckInHeatmapChart: React.FC<HeatmapProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-12 gap-2 h-48 mt-8">
      {data.map((item, i) => (
        <div key={i} className="flex flex-col gap-2 items-center group">
          <div className="flex-1 w-full relative">
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              className="absolute bottom-0 w-full rounded-lg transition-colors cursor-pointer"
              style={{
                height: `${item.volume}%`,
                backgroundColor:
                  item.volume > 70
                    ? "#2563eb"
                    : item.volume > 30
                      ? "#93c5fd"
                      : "#eff6ff",
              }}
            />
          </div>
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">
            {item.hour}:00
          </span>
        </div>
      ))}
    </div>
  );
};
