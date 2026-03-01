"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface GrowthData {
  month: string;
  newUsers: number;
  returning: number;
}

export const UserGrowthChart: React.FC<{ data: GrowthData[] }> = ({ data }) => {
  return (
    <div className="w-full h-[300px] mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fontWeight: 800 }}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            contentStyle={{ borderRadius: "12px" }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{
              fontSize: "10px",
              fontWeight: 900,
              textTransform: "uppercase",
            }}
          />
          <Bar
            dataKey="newUsers"
            stackId="a"
            fill="#0f172a"
            radius={[0, 0, 0, 0]}
            barSize={20}
          />
          <Bar
            dataKey="returning"
            stackId="a"
            fill="#e2e8f0"
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
