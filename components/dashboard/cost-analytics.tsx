"use client";

import { GlassContainer } from "./dashboard-atoms";
import { CostStats } from "@/lib/types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { DollarSign, TrendingUp, Wallet } from "lucide-react";

const COLORS = ["#8b5cf6", "#ec4899", "#3b82f6"];

interface CostAnalyticsProps {
  data?: CostStats;
  loading?: boolean;
}

export function CostAnalytics({ data, loading }: CostAnalyticsProps) {
  if (loading) {
    return <div className="h-64 bg-slate-100/50 animate-pulse rounded-xl" />;
  }

  if (!data) return null;

  const distributionData = [
    { name: "Video Generation", value: data.byType.video },
    { name: "Image Generation", value: data.byType.image },
    { name: "Audio Generation", value: data.byType.audio },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Cost Card */}
      <GlassContainer
        className="p-6 md:col-span-1 flex flex-col justify-between"
        intensity="medium"
      >
        <div>
          <h3 className="text-slate-500 font-medium mb-2 flex items-center">
            <Wallet className="w-5 h-5 mr-2 text-indigo-500" />
            Tổng Chi Phí Ước Tính
          </h3>
          <div className="text-4xl font-bold text-slate-800">
            ${data.totalCost.toFixed(2)}
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit">
            <TrendingUp className="w-4 h-4 mr-1" />
            +12% so với tháng trước
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Video</span>
            <span className="font-medium">${data.byType.video.toFixed(2)}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full"
              style={{
                width: `${(data.byType.video / data.totalCost) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Image</span>
            <span className="font-medium">${data.byType.image.toFixed(2)}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-pink-500 h-2 rounded-full"
              style={{
                width: `${(data.byType.image / data.totalCost) * 100}%`,
              }}
            />
          </div>
        </div>
      </GlassContainer>

      {/* Daily Trend Chart */}
      <GlassContainer
        className="p-6 md:col-span-2 min-h-[300px]"
        intensity="medium"
      >
        <div className="mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <DollarSign className="mr-2 text-emerald-500" size={20} />
            Xu Hướng Chi Phí (7 Ngày)
          </h3>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.dailyCosts}>
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
                formatter={(val: number) => [`$${val.toFixed(2)}`, "Cost"]}
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCost)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassContainer>
    </div>
  );
}
