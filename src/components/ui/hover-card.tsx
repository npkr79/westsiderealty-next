import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Lightweight hover-card component stubs.
 * These are placeholders until @radix-ui/react-hover-card is installed.
 * The hover-card component is not currently used in the codebase.
 */

const HoverCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
)
HoverCard.displayName = "HoverCard"

const HoverCardTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
)
HoverCardTrigger.displayName = "HoverCardTrigger"

const HoverCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: "center" | "start" | "end"; sideOffset?: number }
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
      className
    )}
    {...props}
  />
))
HoverCardContent.displayName = "HoverCardContent"

export { HoverCard, HoverCardTrigger, HoverCardContent }
