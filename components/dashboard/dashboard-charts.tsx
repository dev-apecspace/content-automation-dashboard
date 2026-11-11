"use client";

import { GlassContainer } from "./dashboard-atoms";
import { ChartDataPoint } from "@/lib/types";
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";

interface DashboardChartsProps {
  data: ChartDataPoint[];
  loading?: boolean;
}

export function DashboardCharts({ data, loading }: DashboardChartsProps) {
  if (loading) {
    return <div className="h-96 bg-slate-100/50 animate-pulse rounded-xl" />;
  }

  // Calculate totals for summary (optional)
  const totalViews = data.reduce((acc, curr) => acc + curr.views, 0);
  const totalEngagement = data.reduce(
    (acc, curr) => acc + curr.reactions + curr.comments + curr.shares,
    0
  );

  return (
    <GlassContainer className="p-6 h-[450px]" intensity="medium">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            Hiệu Suất Nội Dung
          </h3>
          <p className="text-sm text-slate-500">
            Views, Reactions, Comments & Shares trên các nền tảng
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-right">
            <div className="text-slate-500">Views (7 ngày)</div>
            <div className="font-bold text-indigo-600">
              {totalViews.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-slate-500">Tương tác (7 ngày)</div>
            <div className="font-bold text-pink-600">
              {totalEngagement.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <ComposedChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickFormatter={(val) =>
              val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val
            }
            label={{
              value: "Views",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#94a3b8", fontSize: 10 },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
            label={{
              value: "Engagement",
              angle: 90,
              position: "insideRight",
              style: { fill: "#94a3b8", fontSize: 10 },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            itemStyle={{ fontSize: "12px", padding: 0 }}
            formatter={(value: number, name: string) => [
              value.toLocaleString(),
              name === "views"
                ? "Lượt xem"
                : name === "reactions"
                ? "Reactions"
                : name === "comments"
                ? "Bình luận"
                : name === "shares"
                ? "Chia sẻ"
                : name,
            ]}
            labelStyle={{
              fontWeight: "bold",
              color: "#334155",
              marginBottom: "8px",
            }}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: "10px" }} />

          {/* Views Area */}
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="views"
            name="views"
            stroke="#6366f1"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorViews)"
          />

          {/* Engagement Lines */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="reactions"
            name="reactions"
            stroke="#ec4899"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="comments"
            name="comments"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="shares"
            name="shares"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </GlassContainer>
  );
}
