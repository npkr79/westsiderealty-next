import * as React from "react"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

/**
 * Lightweight toggle-group component stubs.
 * These are placeholders until @radix-ui/react-toggle-group is installed.
 * The toggle-group component is not currently used in the codebase.
 */

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof toggleVariants> & {
      type?: "single" | "multiple";
      value?: string | string[];
      onValueChange?: (value: string | string[]) => void;
    }
>(({ className, variant, size, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </div>
))

ToggleGroup.displayName = "ToggleGroup"

const ToggleGroupItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof toggleVariants> & {
      value: string;
    }
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})

ToggleGroupItem.displayName = "ToggleGroupItem"

export { ToggleGroup, ToggleGroupItem }
