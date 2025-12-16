import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Lightweight, Radix-free progress bar.
 * Uses a simple div-based implementation while preserving the original API shape.
 */
const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number; max?: number }
>(({ className, value = 0, max = 100, ...props }, ref) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress }
