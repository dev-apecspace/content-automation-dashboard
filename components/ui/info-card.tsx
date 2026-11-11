import * as React from "react";
import { cn } from "@/lib/utils";

const InfoCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300",
      className
    )}
    {...props}
  />
));
InfoCard.displayName = "InfoCard";

export { InfoCard };
