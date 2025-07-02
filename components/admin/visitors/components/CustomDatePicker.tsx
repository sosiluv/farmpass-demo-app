import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
              "h-9 sm:h-10 md:h-11 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-300 bg-white/90 backdrop-blur-sm text-xs sm:text-sm md:text-base shadow-sm hover:shadow-md",
              customStartDate && "border-indigo-400 bg-indigo-50"
            )}
          >
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-indigo-600" />
            {customStartDate
              ? format(customStartDate, "yyyy년 MM월 dd일", { locale: ko })
              : "시작일 선택"}
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
              "h-9 sm:h-10 md:h-11 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-300 bg-white/90 backdrop-blur-sm text-xs sm:text-sm md:text-base shadow-sm hover:shadow-md",
              customEndDate && "border-indigo-400 bg-indigo-50"
            )}
          >
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-indigo-600" />
            {customEndDate
              ? format(customEndDate, "yyyy년 MM월 dd일", { locale: ko })
              : "종료일 선택"}
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

      {(customStartDate || customEndDate) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (onClearCustomDates) {
              onClearCustomDates();
            } else {
              onCustomStartDateChange(null);
              onCustomEndDateChange(null);
            }
          }}
          className="h-9 sm:h-10 md:h-11 p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <X className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      )}
    </div>
  );
}
