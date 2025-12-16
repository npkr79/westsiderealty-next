import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Lightweight popover component stubs.
 * These are placeholders until @radix-ui/react-popover is installed.
 * The popover component is only used by unused combobox components.
 */

const Popover = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { open?: boolean; onOpenChange?: (open: boolean) => void }
>(({ className, open, onOpenChange, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
Popover.displayName = "Popover"

const PopoverTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, asChild, children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { ...(props as any), ...(children.props as any), ref } as any);
  }
  return (
    <div ref={ref} className={cn("", className)} {...props}>
      {children}
    </div>
  );
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: "center" | "start" | "end"; sideOffset?: number }
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
      className
    )}
    {...props}
  />
))
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
