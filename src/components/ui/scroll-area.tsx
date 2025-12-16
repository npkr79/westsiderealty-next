import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Lightweight scroll-area component stubs.
 * These are placeholders until @radix-ui/react-scroll-area is installed.
 * The scroll-area component is not currently used in the codebase.
 */

const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <div className="h-full w-full rounded-[inherit]">
      {children}
    </div>
  </div>
))
ScrollArea.displayName = "ScrollArea"

const ScrollBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: "vertical" | "horizontal" }
>(({ className, orientation = "vertical", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <div className="relative flex-1 rounded-full bg-border" />
  </div>
))
ScrollBar.displayName = "ScrollBar"

export { ScrollArea, ScrollBar }
