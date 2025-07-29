import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { LABELS } from "@/lib/constants/management";

interface DateRangeSectionProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  title?: string;
  color?: "blue" | "green" | "orange" | "purple";
}

export function DateRangeSection({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  title = LABELS.DATE_RANGE,
  color = "blue",
}: DateRangeSectionProps) {
  const colorClasses = {
    blue: "border-blue-200 bg-blue-50/50 text-blue-700",
    green: "border-green-200 bg-green-50/50 text-green-700",
    orange: "border-orange-200 bg-orange-50/50 text-orange-700",
    purple: "border-purple-200 bg-purple-50/50 text-purple-700",
  };

  return (
    <Card className={`border ${colorClasses[color]}`}>
      <CardHeader className="pb-1.5 sm:pb-2 md:pb-3">
        <CardTitle className="flex items-center space-x-1.5 sm:space-x-2 text-sm sm:text-base md:text-lg">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          <div className="space-y-1 sm:space-y-1.5">
            <Label className="text-xs sm:text-sm md:text-base font-medium">
              {LABELS.START_DATE}
            </Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="h-7 sm:h-8 md:h-9 text-xs sm:text-sm md:text-base"
            />
          </div>
          <div className="space-y-1 sm:space-y-1.5">
            <Label className="text-xs sm:text-sm md:text-base font-medium">
              {LABELS.END_DATE}
            </Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="h-7 sm:h-8 md:h-9 text-xs sm:text-sm md:text-base"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
