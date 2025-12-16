import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Lightweight separator component stub.
 * This is a placeholder until @radix-ui/react-separator is installed.
 */

const Separator = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement> & { orientation?: "horizontal" | "vertical"; decorative?: boolean }
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <hr
      ref={ref}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator }
