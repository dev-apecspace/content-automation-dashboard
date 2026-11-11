import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import React from "react";

export interface GlassContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: "low" | "medium" | "high" | "magical";
}

export function GlassContainer({
  children,
  className,
  intensity = "medium",
  ...props
}: GlassContainerProps) {
  const intensityStyles = {
    // Modern Glass: cleaner, more blurred, subtle white shine overlay
    low: "bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-md shadow-[0_4px_24px_-1px_rgba(0,0,0,0.02)]",
    medium: "bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-xl shadow-[0_8px_32px_-4px_rgba(31,38,135,0.1)] border border-white/20",
    high: "bg-gradient-to-br from-white/80 to-white/30 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] border border-white/40",
    // Magical Aura: Transparent vibrant glass with inner light
    magical: "backdrop-blur-xl shadow-[inset_0_0_20px_rgba(255,255,255,0.5)] border border-white/20 shadow-lg",
  };

  return (
    <div
      className={cn(
        "rounded-2xl transition-all duration-300 relative overflow-hidden group",
        "before:absolute before:inset-0 before:z-[-1] before:bg-gradient-to-br before:from-white/40 before:via-transparent before:to-transparent before:opacity-50", // Specular shine
        intensityStyles[intensity as keyof typeof intensityStyles] || intensityStyles.medium,
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
  variant?: "default" | "gradient";
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  description,
  className,
  variant = "default",
}: StatsCardProps) {
  const isGradient = variant === "gradient";

  return (
    <GlassContainer
      className={cn(
        "p-6 flex flex-col justify-between hover:scale-[1.02] transition-all duration-300",
        // Enhanced glass effect for gradient cards
        isGradient && "shadow-md hover:shadow-xl hover:shadow-indigo-500/10", // Colored shadow glow on hover
        className
      )}
      intensity={isGradient ? "magical" : "medium"}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={cn(
              "text-sm font-medium uppercase tracking-wider",
              // Dreamy: Soft slate text for elegance
              isGradient ? "text-slate-700 font-semibold" : "text-slate-600"
            )}
          >
            {label}
          </p>
          <h3
            className={cn(
              "text-3xl font-bold mt-2",
              // Dreamy: Dark text for contrast on pastel
              isGradient ? "text-slate-900 drop-shadow-sm" : "text-slate-900"
            )}
          >
            {value}
          </h3>
        </div>
        <div
          className={cn(
            "p-3 rounded-xl shadow-sm transition-colors",
            isGradient
              ? "bg-white/60 text-indigo-700 backdrop-blur-md shadow-inner" // More transparent icon bg
              : "bg-white/50 text-slate-700"
          )}
        >
          <Icon size={24} strokeWidth={1.5} />
        </div>
      </div>

      {(trend || description) && (
        <div className="mt-4 flex items-center text-sm">
          {trend && (
            <span
              className={cn(
                "flex items-center font-medium px-2 py-0.5 rounded-full mr-2 backdrop-blur-sm",
                isGradient
                  ? "bg-white/30 text-slate-800 shadow-sm"
                  : cn(
                      trend.direction === "up" && "text-green-700 bg-green-100",
                      trend.direction === "down" && "text-red-700 bg-red-100",
                      trend.direction === "neutral" &&
                        "text-slate-700 bg-slate-100"
                    )
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
          {description && (
            <span className={isGradient ? "text-slate-700" : "text-slate-500"}>
              {description}
            </span>
          )}
        </div>
      )}
    </GlassContainer>
  );
}
