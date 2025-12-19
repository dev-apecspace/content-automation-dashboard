"use client";

import { GlassContainer } from "./dashboard-atoms";
import { PlatformDistribution, StatusDistribution } from "@/lib/types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { PieChart as PieIcon, BarChart3 } from "lucide-react";

const COLORS = ["#6366f1", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

interface PlatformPieChartProps {
  data: PlatformDistribution[];
  loading?: boolean;
}

export function PlatformPieChart({ data, loading }: PlatformPieChartProps) {
  return (
    <GlassContainer className="p-6 h-[400px] flex flex-col" intensity="medium">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center">
          <PieIcon className="mr-2 text-slate-500" size={20} />
          Phân Bố Nền Tảng
        </h3>
      </div>

      <div className="flex-1 w-full min-h-0">
        {loading ? (
          <div className="w-full h-full bg-slate-100/50 animate-pulse rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="count"
                nameKey="platform"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </GlassContainer>
  );
}

interface StatusBarChartProps {
  data: StatusDistribution[];
  loading?: boolean;
}

export function StatusBarChart({ data, loading }: StatusBarChartProps) {
  return (
    <GlassContainer className="p-6 h-[400px] flex flex-col" intensity="medium">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center">
          <BarChart3 className="mr-2 text-slate-500" size={20} />
          Trạng Thái Nội Dung
        </h3>
      </div>

      <div className="flex-1 w-full min-h-0">
        {loading ? (
          <div className="w-full h-full bg-slate-100/50 animate-pulse rounded-xl" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#e2e8f0"
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="label"
                type="category"
                width={120}
                tick={{ fontSize: 11, fill: "#64748b" }}
                interval={0}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.2)" }}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Bar
                dataKey="count"
                fill="#6366f1"
                radius={[0, 4, 4, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </GlassContainer>
  );
}
