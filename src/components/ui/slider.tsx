"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value?: number[];
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value, defaultValue, onValueChange, min = 0, max = 100, step = 1, disabled, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<number[]>(
      value || defaultValue || [min, max]
    );
    const [isDragging, setIsDragging] = React.useState<"min" | "max" | null>(null);
    const sliderRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    const currentValue = value !== undefined ? value : internalValue;
    const [minVal, maxVal] = currentValue;

    const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;
    const minPercent = getPercentage(minVal);
    const maxPercent = getPercentage(maxVal);

    const handleMouseDown = (type: "min" | "max") => {
      if (disabled) return;
      setIsDragging(type);
    };

    const handleMouseMove = React.useCallback(
      (e: MouseEvent) => {
        if (isDragging === null || disabled || !sliderRef.current) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newValue = min + percentage * (max - min);
        const roundedValue = Math.round(newValue / step) * step;

        const newValues = [...currentValue];
        if (isDragging === "min") {
          newValues[0] = Math.min(roundedValue, maxVal - step);
        } else {
          newValues[1] = Math.max(roundedValue, minVal + step);
        }

        setInternalValue(newValues);
        onValueChange?.(newValues);
      },
      [isDragging, minVal, maxVal, min, max, step, currentValue, onValueChange, disabled]
    );

    const handleMouseUp = React.useCallback(() => {
      setIsDragging(null);
    }, []);

    React.useEffect(() => {
      if (isDragging !== null) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };
      }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
      <div
        ref={sliderRef}
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
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />
        </div>
        {/* Min handle */}
        <div
          className={cn(
            "absolute h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            disabled ? "pointer-events-none opacity-50" : "cursor-grab active:cursor-grabbing"
          )}
          style={{ left: `calc(${minPercent}% - 10px)` }}
          onMouseDown={() => handleMouseDown("min")}
        />
        {/* Max handle */}
        <div
          className={cn(
            "absolute h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            disabled ? "pointer-events-none opacity-50" : "cursor-grab active:cursor-grabbing"
          )}
          style={{ left: `calc(${maxPercent}% - 10px)` }}
          onMouseDown={() => handleMouseDown("max")}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
