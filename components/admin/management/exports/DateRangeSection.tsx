"use client";

import React from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { LABELS } from "@/lib/constants/management";
import { formatDate } from "@/lib/utils/datetime/date";

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
    blue: "border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    green:
      "border-green-200 dark:border-green-800/60 bg-green-50/50 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    orange:
      "border-orange-200 dark:border-orange-800/60 bg-orange-50/50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    purple:
      "border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  };

  return (
    <Card className={`border ${colorClasses[color]}`}>
      <CardHeader className="pb-1.5 sm:pb-2 md:pb-3">
        <CardTitle className="flex items-center space-x-1.5 text-base md:text-lg">
          <Calendar className="h-4 w-4" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm md:text-base font-medium text-gray-700 dark:text-slate-200">
              {LABELS.START_DATE}
            </Label>
            <ReactDatePicker
              selected={startDate ? new Date(startDate) : null}
              onChange={(date) =>
                onStartDateChange(date ? formatDate(date as Date) : "")
              }
              selectsStart
              startDate={startDate ? new Date(startDate) : null}
              endDate={endDate ? new Date(endDate) : null}
              dateFormat="yyyy-MM-dd"
              placeholderText="YYYY-MM-DD"
              popperPlacement="bottom-start"
              popperClassName="z-[60]"
              className="flex h-12 w-full items-center justify-between rounded-md border border-gray-300 dark:border-slate-600 px-3 text-sm md:text-base bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              wrapperClassName="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm md:text-base font-medium text-gray-700 dark:text-slate-200">
              {LABELS.END_DATE}
            </Label>
            <ReactDatePicker
              selected={endDate ? new Date(endDate) : null}
              onChange={(date) =>
                onEndDateChange(date ? formatDate(date as Date) : "")
              }
              selectsEnd
              startDate={startDate ? new Date(startDate) : null}
              endDate={endDate ? new Date(endDate) : null}
              minDate={startDate ? new Date(startDate) : undefined}
              dateFormat="yyyy-MM-dd"
              placeholderText="YYYY-MM-DD"
              popperPlacement="bottom-start"
              popperClassName="z-[60]"
              className="flex h-12 w-full items-center justify-between rounded-md border border-gray-300 dark:border-slate-600 px-3 text-sm md:text-base bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              wrapperClassName="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
