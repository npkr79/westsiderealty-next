import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Lightweight toggle component stub.
 * This is a placeholder until @radix-ui/react-toggle is installed.
 */

export const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof toggleVariants> & {
      pressed?: boolean;
      onPressedChange?: (pressed: boolean) => void;
    }
>(({ className, variant, size, pressed, onPressedChange, onClick, ...props }, ref) => {
  const [internalPressed, setInternalPressed] = React.useState(pressed || false);
  
  React.useEffect(() => {
    if (pressed !== undefined) {
      setInternalPressed(pressed);
    }
  }, [pressed]);

  const isPressed = pressed !== undefined ? pressed : internalPressed;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    const newPressed = !isPressed;
    if (pressed === undefined) {
      setInternalPressed(newPressed);
    }
    onPressedChange?.(newPressed);
  };

  return (
    <button
      ref={ref}
      type="button"
      className={cn(toggleVariants({ variant, size, className }), isPressed && "bg-accent text-accent-foreground")}
      onClick={handleClick}
      data-state={isPressed ? "on" : "off"}
      {...props}
    />
  );
})

Toggle.displayName = "Toggle"

export { Toggle }
