import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Lightweight, Radix-free checkbox.
 * Keeps the same visual styling but uses a native <input type="checkbox"> under the hood.
 */
const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, checked, ...props }, ref) => (
  <span className="inline-flex items-center justify-center">
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "checked:bg-primary checked:text-primary-foreground",
        className
      )}
      checked={checked}
      {...props}
    />
    {/* Visual indicator for consistency with previous design */}
    {checked && (
      <span className="pointer-events-none -ml-4 flex h-4 w-4 items-center justify-center text-primary-foreground">
        <Check className="h-3 w-3" />
      </span>
    )}
  </span>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
