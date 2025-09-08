import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description: string;
  children: ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  titleClassName?: string;
  variant?: "default" | "success" | "warning" | "info";
  className?: string;
}

const variantStyles = {
  default: {
    card: "bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700",
    icon: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    title: "text-slate-900 dark:text-slate-100",
    description: "text-slate-600 dark:text-slate-400",
  },
  success: {
    card: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700",
    icon: "bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-400",
    title: "text-emerald-900 dark:text-emerald-100",
    description: "text-emerald-700 dark:text-emerald-300",
  },
  warning: {
    card: "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700",
    icon: "bg-amber-100 dark:bg-amber-800/50 text-amber-600 dark:text-amber-400",
    title: "text-amber-900 dark:text-amber-100",
    description: "text-amber-700 dark:text-emerald-300",
  },
  info: {
    card: "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700",
    icon: "bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400",
    title: "text-blue-900 dark:text-blue-100",
    description: "text-blue-700 dark:text-blue-300",
  },
};

export function ChartCard({
  title,
  description,
  children,
  icon: Icon,
  iconClassName,
  titleClassName,
  variant = "default",
  className,
}: ChartCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-lg border min-h-[400px] lg:min-h-[480px] xl:min-h-[520px] flex flex-col",
        styles.card,
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between space-y-0">
          <div className="space-y-1 flex-1">
            <CardTitle
              className={cn(
                "text-base sm:text-lg md:text-xl font-medium leading-none tracking-tight",
                titleClassName || styles.title
              )}
            >
              {title}
            </CardTitle>
            <CardDescription
              className={cn(
                "text-sm sm:text-base leading-relaxed",
                styles.description
              )}
            >
              {description}
            </CardDescription>
          </div>
          {Icon && (
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md",
                iconClassName || styles.icon
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col">
        <div className="flex-1 min-h-0">{children}</div>
      </CardContent>
    </Card>
  );
}
