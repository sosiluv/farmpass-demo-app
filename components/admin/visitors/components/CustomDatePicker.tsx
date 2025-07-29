import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { LABELS } from "@/lib/constants/visitor";

interface CustomDatePickerProps {
  customStartDate: Date | null;
  customEndDate: Date | null;
  onCustomStartDateChange: (date: Date | null) => void;
  onCustomEndDateChange: (date: Date | null) => void;
  onClearCustomDates?: () => void;
}

export function CustomDatePicker({
  customStartDate,
  customEndDate,
  onCustomStartDateChange,
  onCustomEndDateChange,
  onClearCustomDates,
}: CustomDatePickerProps) {
  return (
    <div className="flex items-center space-x-2 sm:space-x-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-9 sm:h-10 md:h-11 border-slate-200 dark:border-slate-600 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all duration-300 bg-white/90 dark:bg-slate-800 backdrop-blur-sm text-xs sm:text-sm md:text-base shadow-sm hover:shadow-md dark:text-slate-100 dark:placeholder:text-slate-400 dark:disabled:text-slate-500",
              customStartDate &&
                "border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900"
            )}
          >
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-indigo-600 dark:text-indigo-300" />
            {customStartDate ? (
              format(customStartDate, "yyyy-MM-dd", { locale: ko })
            ) : (
              <span className="dark:text-slate-400">
                {LABELS.CUSTOM_DATE_PICKER_START_DATE}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={customStartDate || undefined}
            onSelect={(date) => onCustomStartDateChange(date || null)}
            initialFocus
            locale={ko}
          />
        </PopoverContent>
      </Popover>

      <span className="text-gray-500 text-xs sm:text-sm">~</span>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-9 sm:h-10 md:h-11 border-slate-200 dark:border-slate-600 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all duration-300 bg-white/90 dark:bg-slate-800 backdrop-blur-sm text-xs sm:text-sm md:text-base shadow-sm hover:shadow-md dark:text-slate-100 dark:placeholder:text-slate-400 dark:disabled:text-slate-500",
              customEndDate &&
                "border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900"
            )}
          >
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-indigo-600 dark:text-indigo-300" />
            {customEndDate ? (
              format(customEndDate, "yyyy-MM-dd", { locale: ko })
            ) : (
              <span className="dark:text-slate-400">
                {LABELS.CUSTOM_DATE_PICKER_END_DATE}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={customEndDate || undefined}
            onSelect={(date) => onCustomEndDateChange(date || null)}
            initialFocus
            locale={ko}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
