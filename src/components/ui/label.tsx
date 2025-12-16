import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Lightweight, Radix-free Label component.
 * Preserves the same API surface for common usage without depending on @radix-ui/react-label.
 */
const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
