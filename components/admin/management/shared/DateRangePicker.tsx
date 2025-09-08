"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  className?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  autoCloseEndOnSelect?: boolean;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
  startPlaceholder = "시작일",
  endPlaceholder = "종료일",
  autoCloseEndOnSelect = true,
}: DateRangePickerProps) {
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const handleEndSelect = (date: Date | undefined) => {
    onEndDateChange(date);
    if (autoCloseEndOnSelect) setShowEndCalendar(false);
  };

  return (
    <div className={cn("flex gap-2", className)}>
      {/* 시작 날짜 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-12 w-full sm:w-auto sm:min-w-[120px] lg:min-w-[140px] xl:min-w-[160px] justify-start text-left font-normal",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? (
              format(startDate, "PPP", { locale: ko })
            ) : (
              <span>{startPlaceholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={onStartDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* 종료 날짜 */}
      <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-12 w-full sm:w-auto sm:min-w-[120px] lg:min-w-[140px] xl:min-w-[160px] justify-start text-left font-normal",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate ? (
              format(endDate, "PPP", { locale: ko })
            ) : (
              <span>{endPlaceholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={handleEndSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DateRangePicker;
