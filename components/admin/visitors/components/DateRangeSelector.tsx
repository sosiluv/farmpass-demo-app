import { Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LABELS } from "@/lib/constants/visitor";

interface DateRangeSelectorProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function DateRangeSelector({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeSelectorProps) {
  return (
    <Card className="border border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-blue-700 text-sm sm:text-base">
          <Calendar className="h-4 w-4" />
          <span>{LABELS.DATE_RANGE_SELECTOR_TITLE}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="export-start-date"
              className="text-xs md:text-sm font-medium"
            >
              {LABELS.DATE_RANGE_START_DATE}
            </Label>
            <Input
              id="export-start-date"
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="h-9 text-xs sm:text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="export-end-date"
              className="text-xs md:text-sm font-medium"
            >
              {LABELS.DATE_RANGE_END_DATE}
            </Label>
            <Input
              id="export-end-date"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="h-9 text-xs sm:text-sm"
            />
          </div>
        </div>
        {startDate && endDate && (
          <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded-md">
            {LABELS.DATE_RANGE_SUMMARY.replace(
              "{startDate}",
              startDate
            ).replace("{endDate}", endDate)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
