import * as React from "react";
import { cn } from "@/lib/utils";

const BackgroundStyle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute inset-0 -z-10 blur-3xl pointer-events-none",
      className
    )}
    {...props}
  />
));
BackgroundStyle.displayName = "BackgroundStyle";

export { BackgroundStyle };
