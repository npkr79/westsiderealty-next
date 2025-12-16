import * as React from "react"

/**
 * Lightweight Slot component stub.
 * This is a placeholder until @radix-ui/react-slot is installed.
 * The Slot component is used for the asChild pattern.
 */
export const Slot = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & {
    asChild?: boolean;
  }
>(({ asChild, children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...(props as any),
      ...(children.props as any),
      ref,
    } as any);
  }
  return React.createElement("div", { ...props, ref }, children);
});

Slot.displayName = "Slot";

