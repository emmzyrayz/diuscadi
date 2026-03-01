"use client";
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface PerformanceMix {
  name: string;
  value: number;
  color: string;
}

export const EventPerformanceChart: React.FC<{ data: PerformanceMix[] }> = ({
  data,
}) => {
  return (
    <div className="w-full h-[250px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={8}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-black text-slate-900 leading-none">
          {data.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
        </span>
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
          Total Reach
        </span>
      </div>
    </div>
  );
};
