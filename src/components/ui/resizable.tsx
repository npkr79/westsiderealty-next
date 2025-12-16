import * as React from "react"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Lightweight resizable component stubs.
 * These are placeholders until react-resizable-panels is installed.
 * The resizable component is not currently used in the codebase.
 */

const ResizablePanelGroup = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { direction?: "horizontal" | "vertical" }) => (
  <div
    className={cn(
      "flex h-full w-full",
      className
    )}
    {...props}
  />
)

const ResizablePanel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
ResizablePanel.displayName = "ResizablePanel"

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  withHandle?: boolean
}) => (
  <div
    className={cn(
      "relative flex w-px items-center justify-center bg-border",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </div>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
