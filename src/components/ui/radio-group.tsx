import * as React from "react"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Lightweight radio-group component stubs.
 * These are placeholders until @radix-ui/react-radio-group is installed.
 * The radio-group component is only used by unused UI components.
 */

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: string; onValueChange?: (value: string) => void }
>(({ className, value, onValueChange, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("grid gap-2", className)}
      {...props}
    />
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </span>
    </button>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
