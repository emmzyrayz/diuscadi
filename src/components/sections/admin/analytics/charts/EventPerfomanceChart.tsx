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
}) => (
  <div className="w-full relative" style={{ minHeight: 250 }}>
    <ResponsiveContainer width="100%" height={250}>
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
      <span className="text-2xl font-black text-foreground leading-none">
        {data.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
      </span>
      <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">
        Total Reach
      </span>
    </div>
  </div>
);
