import * as React from "react";
import { cn } from "@/lib/utils";

const SectionLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1.5",
      className
    )}
    {...props}
  />
));
SectionLabel.displayName = "SectionLabel";

export { SectionLabel };
