"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";
import { useToastPosition } from "@/components/providers/toast-position-provider";

const DynamicToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => {
  const { position, getPositionClasses } = useToastPosition();
  
  return (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn(
        getPositionClasses(position),
        className
      )}
      {...props}
    />
  );
});

DynamicToastViewport.displayName = ToastPrimitives.Viewport.displayName;

export { DynamicToastViewport };
