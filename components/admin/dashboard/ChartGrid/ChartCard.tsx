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
    icon: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    title: "text-emerald-900 dark:text-emerald-100",
    description: "text-emerald-700 dark:text-emerald-300",
  },
  warning: {
    card: "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-700",
    icon: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    title: "text-amber-900 dark:text-amber-100",
    description: "text-amber-700 dark:text-amber-300",
  },
  info: {
    card: "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700",
    icon: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    title: "text-blue-900 dark:text-blue-100",
    description: "text-blue-700 dark:text-blue-300",
  },
};

export function ChartCard({
  title,
  description,
  children,
  icon: Icon,
  iconClassName = "h-5 w-5",
  titleClassName = "text-base",
  variant = "default",
  className,
}: ChartCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300",
        styles.card,
        className
      )}
    >
      {/* 배경 패턴 오버레이 */}
      <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-current to-transparent" />
      </div>

      <CardHeader className="relative pb-3">
        <CardTitle
          className={cn(
            "flex items-center gap-3 text-lg font-semibold transition-colors duration-300",
            styles.title,
            titleClassName
          )}
        >
          {Icon && (
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110",
                styles.icon
              )}
            >
              <Icon
                className={cn("transition-colors duration-300", iconClassName)}
              />
            </div>
          )}
          <span className="flex-1">{title}</span>
        </CardTitle>
        <CardDescription
          className={cn(
            "text-sm font-medium transition-colors duration-300",
            styles.description
          )}
        >
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative p-0 overflow-hidden">
        <div className="h-[280px] sm:h-[300px] md:h-[320px] lg:h-[350px] xl:h-[400px] 2xl:h-[450px] w-full p-4">
          {children}
        </div>

        {/* 하단 장식선 */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-300",
            variant === "default" &&
              "from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600",
            variant === "success" &&
              "from-emerald-200 to-emerald-300 dark:from-emerald-700 dark:to-emerald-600",
            variant === "warning" &&
              "from-amber-200 to-amber-300 dark:from-amber-700 dark:to-amber-600",
            variant === "info" &&
              "from-blue-200 to-blue-300 dark:from-blue-700 dark:to-blue-600"
          )}
        />
      </CardContent>
    </Card>
  );
}
