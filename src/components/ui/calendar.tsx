import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Lightweight calendar component stub.
 * This is a placeholder until react-day-picker is installed.
 * The Calendar component is not currently used in the codebase.
 */
export type CalendarProps = React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
  classNames?: Record<string, string>;
  showOutsideDays?: boolean;
  [key: string]: any;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div
      className={cn("p-3 rounded-md border bg-background", className)}
      {...props}
    >
      <p className="text-sm text-muted-foreground">
        Calendar component placeholder. Install react-day-picker to enable full functionality.
      </p>
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
