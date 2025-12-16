import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Lightweight, Radix-free aspect ratio component.
 * Uses CSS aspect-ratio property for modern browsers.
 */
const AspectRatio = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { ratio?: number }
>(({ className, ratio = 1, style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative w-full", className)}
    style={{ ...style, aspectRatio: ratio }}
    {...props}
  />
))
AspectRatio.displayName = "AspectRatio"

export { AspectRatio }
