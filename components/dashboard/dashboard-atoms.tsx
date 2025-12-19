import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import React from "react";

export interface GlassContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export function GlassContainer({
  children,
  className,
  intensity = "medium",
  ...props
}: GlassContainerProps) {
  const intensityStyles = {
    low: "bg-white/30 backdrop-blur-md border-white/20",
    medium: "bg-white/40 backdrop-blur-lg border-white/30",
    high: "bg-white/60 backdrop-blur-xl border-white/40 shadow-lg",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border shadow-sm transition-all duration-300",
        intensityStyles[intensity],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number; // percentage
    direction: "up" | "down" | "neutral";
  };
  description?: string;
  className?: string;
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  description,
  className,
}: StatsCardProps) {
  return (
    <GlassContainer
      className={cn(
        "p-6 flex flex-col justify-between hover:scale-[1.02]",
        className
      )}
      intensity="medium"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 uppercase tracking-wider">
            {label}
          </p>
          <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
        </div>
        <div className="p-3 bg-white/50 rounded-xl shadow-inner text-slate-700">
          <Icon size={24} strokeWidth={1.5} />
        </div>
      </div>

      {(trend || description) && (
        <div className="mt-4 flex items-center text-sm">
          {trend && (
            <span
              className={cn(
                "flex items-center font-medium px-2 py-0.5 rounded-full mr-2",
                trend.direction === "up" && "text-green-700 bg-green-100",
                trend.direction === "down" && "text-red-700 bg-red-100",
                trend.direction === "neutral" && "text-slate-700 bg-slate-100"
              )}
            >
              {trend.direction === "up" && (
                <TrendingUp size={14} className="mr-1" />
              )}
              {trend.direction === "down" && (
                <TrendingDown size={14} className="mr-1" />
              )}
              {trend.direction === "neutral" && (
                <Minus size={14} className="mr-1" />
              )}
              {Math.abs(trend.value)}%
            </span>
          )}
          {description && <span className="text-slate-500">{description}</span>}
        </div>
      )}
    </GlassContainer>
  );
}
