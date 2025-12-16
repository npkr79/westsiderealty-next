import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Lightweight slider component stub.
 * This is a placeholder until @radix-ui/react-slider is installed.
 */

const Slider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number[];
    defaultValue?: number[];
    onValueChange?: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
  }
>(({ className, value, defaultValue, onValueChange, min = 0, max = 100, step = 1, disabled, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState<number[]>(value || defaultValue || [min]);
  
  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const currentValue = value !== undefined ? value : internalValue;

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <div
          className="absolute h-full bg-primary"
          style={{
            width: `${((currentValue[0] - min) / (max - min)) * 100}%`,
          }}
        />
      </div>
      <div className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </div>
  );
})
Slider.displayName = "Slider"

export { Slider }
