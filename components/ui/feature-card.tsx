"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export type FeatureCardTheme =
  | "blue"
  | "indigo"
  | "purple"
  | "teal"
  | "emerald"
  | "slate"
  | "rose"
  | "amber";

interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon: LucideIcon;
  colorTheme?: FeatureCardTheme;
  children: React.ReactNode;
  action?: React.ReactNode;
}

const themeStyles: Record<
  FeatureCardTheme,
  {
    hoverShadow: string;
    iconBg: string; // bg-color-50
    iconColor: string; // text-color-600
    iconHoverBg: string; // group-hover:bg-color-600
    // iconHoverText is always white
    titleGradient: string; // group-hover:from-color-600 group-hover:to-color-400
  }
> = {
  blue: {
    hoverShadow: "hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)]",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    iconHoverBg: "group-hover:bg-blue-600",
    titleGradient: "group-hover:from-blue-600 group-hover:to-blue-400",
  },
  indigo: {
    hoverShadow: "hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)]",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    iconHoverBg: "group-hover:bg-indigo-600",
    titleGradient: "group-hover:from-indigo-600 group-hover:to-indigo-400",
  },
  purple: {
    hoverShadow: "hover:shadow-[0_8px_30px_rgba(168,85,247,0.1)]",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    iconHoverBg: "group-hover:bg-purple-600",
    titleGradient: "group-hover:from-purple-600 group-hover:to-purple-400",
  },
  teal: {
    hoverShadow: "hover:shadow-[0_8px_30px_rgba(20,184,166,0.1)]",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
    iconHoverBg: "group-hover:bg-teal-600",
    titleGradient: "group-hover:from-teal-600 group-hover:to-teal-400",
  },
  emerald: {
    hoverShadow: "hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)]",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    iconHoverBg: "group-hover:bg-emerald-600",
    titleGradient: "group-hover:from-emerald-600 group-hover:to-emerald-400",
  },
  slate: {
    hoverShadow: "hover:shadow-[0_8px_30px_rgba(71,85,105,0.1)]",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    iconHoverBg: "group-hover:bg-slate-600",
    titleGradient: "group-hover:from-slate-600 group-hover:to-slate-400",
  },
  rose: {
    hoverShadow: "hover:shadow-[0_8px_30px_rgba(244,63,94,0.1)]",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    iconHoverBg: "group-hover:bg-rose-600",
    titleGradient: "group-hover:from-rose-600 group-hover:to-rose-400",
  },
  amber: {
    hoverShadow: "hover:shadow-[0_8px_30px_rgba(245,158,11,0.1)]",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    iconHoverBg: "group-hover:bg-amber-600",
    titleGradient: "group-hover:from-amber-600 group-hover:to-amber-400",
  },
};

export function FeatureCard({
  title,
  icon: Icon,
  colorTheme = "blue",
  children,
  action,
  className,
  ...props
}: FeatureCardProps) {
  const theme = themeStyles[colorTheme];

  return (
    <div
      className={cn(
        "bg-white border border-slate-200 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 overflow-hidden group",
        theme.hoverShadow,
        className
      )}
      {...props}
    >
      <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-blue-50">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2.5 rounded-xl transition-colors duration-300",
              theme.iconBg,
              theme.iconColor,
              theme.iconHoverBg,
              "group-hover:text-white"
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <h3
            className={cn(
              "text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 transition-all duration-300",
              theme.titleGradient
            )}
          >
            {title}
          </h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
