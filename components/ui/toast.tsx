"use client";

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => {
  return (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn(
        "fixed top-4 right-4 z-[100] flex max-h-screen w-full flex-col items-end space-y-2 p-4 md:max-w-[420px]",
        className
      )}
      {...props}
    />
  );
});
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start space-x-3 overflow-hidden rounded-2xl border p-4 shadow-2xl transition-all duration-300 ease-out toast-hover data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:toast-slide-in data-[state=closed]:toast-slide-out data-[swipe=end]:toast-slide-out",
  {
    variants: {
      variant: {
        default:
          "border-slate-200/50 bg-white/95 text-slate-900 backdrop-blur-xl shadow-slate-200/50",
        success:
          "border-emerald-200/50 bg-emerald-50/95 text-emerald-900 backdrop-blur-xl shadow-emerald-200/50",
        destructive:
          "border-red-200/50 bg-red-50/95 text-red-900 backdrop-blur-xl shadow-red-200/50",
        warning:
          "border-amber-200/50 bg-amber-50/95 text-amber-900 backdrop-blur-xl shadow-amber-200/50",
        info: "border-blue-200/50 bg-blue-50/95 text-blue-900 backdrop-blur-xl shadow-blue-200/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border bg-transparent px-3 text-sm font-medium ring-offset-background transition-all duration-200 hover:bg-secondary hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-lg p-1.5 text-foreground/50 opacity-0 transition-all duration-200 hover:text-foreground hover:bg-black/5 hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:hover:bg-red-500/10 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-6", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm leading-5 opacity-90 mt-1", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

// 아이콘 컴포넌트
const ToastIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: VariantProps<typeof toastVariants>["variant"];
  }
>(({ className, variant = "default", ...props }, ref) => {
  const iconMap = {
    default: Info,
    success: CheckCircle,
    destructive: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = iconMap[variant || "default"];

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full toast-icon-bounce",
        variant === "success" && "bg-emerald-100 text-emerald-600",
        variant === "destructive" && "bg-red-100 text-red-600",
        variant === "warning" && "bg-amber-100 text-amber-600",
        variant === "info" && "bg-blue-100 text-blue-600",
        variant === "default" && "bg-slate-100 text-slate-600",
        className
      )}
      {...props}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
});
ToastIcon.displayName = "ToastIcon";

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastIcon,
};
