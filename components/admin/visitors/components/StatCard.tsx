import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconBg: string;
  description: string;
  trend: string;
  suffix?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  borderColor,
  textColor,
  iconBg,
  description,
  trend,
  suffix = "",
}: StatCardProps) {
  return (
    <Card
      className={`relative overflow-hidden border ${borderColor} ${bgColor} hover:shadow-md transition-all duration-200 hover:scale-[1.02] group`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-200`}
      />
      <div className="absolute -top-2 -right-2 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-white/20 to-white/5 opacity-30" />

      <CardContent className="p-2 sm:p-3 md:p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 min-w-0 flex-1">
            <div
              className={`p-1.5 sm:p-2 rounded-lg ${iconBg} shadow-sm group-hover:shadow-md transition-shadow duration-200 flex-shrink-0`}
            >
              <Icon
                className={`h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 ${textColor}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`text-xs sm:text-sm md:text-base font-medium ${textColor} opacity-80 truncate`}
              >
                {title}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground hidden lg:block">
                {description}
              </p>
            </div>
          </div>
          <div className="text-right md:text-right md:flex-shrink-0 md:ml-2">
            <div
              className={`text-base sm:text-xl md:text-2xl lg:text-2xl font-bold ${textColor} leading-none whitespace-nowrap`}
            >
              {value.toLocaleString()}
              {suffix}
            </div>
            <Badge
              variant="secondary"
              className={`${bgColor} ${textColor} border-none text-xs sm:text-sm font-medium px-1 py-0 mt-1 hidden lg:inline-flex`}
            >
              {trend}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between mt-1.5 sm:mt-2 lg:hidden">
          <span className="text-xs sm:text-sm text-muted-foreground">
            {description}
          </span>
          <Badge
            variant="secondary"
            className={`${bgColor} ${textColor} border-none text-xs sm:text-sm font-medium px-1 py-0`}
          >
            {trend}
          </Badge>
        </div>
      </CardContent>

      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${color} opacity-60`}
      />
    </Card>
  );
}
