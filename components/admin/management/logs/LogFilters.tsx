import { CommonFilters } from "../shared/CommonFilters";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Download, X } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { LogFilter } from "@/lib/types/system";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface LogFiltersProps {
  filters: LogFilter;
  onFiltersChange: (filters: LogFilter) => void;
  onExport?: () => void;
}

type LogLevel = "error" | "warn" | "info" | "debug";

export function LogFilters({
  filters,
  onFiltersChange,
  onExport,
}: LogFiltersProps) {
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value });
  };

  const handleLevelChange = (value: string) => {
    onFiltersChange({
      ...filters,
      level: value === "all" ? undefined : (value as LogLevel),
    });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    onFiltersChange({ ...filters, startDate: date });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    onFiltersChange({ ...filters, endDate: date });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      level: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const hasActiveFilters =
    filters.search || filters.level || filters.startDate || filters.endDate;

  // 날짜 선택기와 버튼
  const datePickers = (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full sm:w-[280px] justify-start text-left font-normal h-10 px-3 text-sm",
              !filters.startDate && !filters.endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {filters.startDate && filters.endDate ? (
                <>
                  {format(filters.startDate, "PPP", { locale: ko })} ~{" "}
                  {format(filters.endDate, "PPP", { locale: ko })}
                </>
              ) : filters.startDate ? (
                <>
                  {format(filters.startDate, "PPP", { locale: ko })} ~ 종료일
                  선택
                </>
              ) : filters.endDate ? (
                <>
                  시작일 선택 ~ {format(filters.endDate, "PPP", { locale: ko })}
                </>
              ) : (
                "기간 선택"
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(calc(100vw-1rem),300px)] sm:w-auto p-0"
          align="start"
          sideOffset={4}
        >
          <div className="flex flex-col sm:flex-row gap-2 p-2 sm:p-3">
            <div className="block sm:hidden bg-muted/50 rounded-lg p-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium">
                  {showEndCalendar ? "종료일" : "시작일"} 선택
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => setShowEndCalendar(!showEndCalendar)}
                >
                  {showEndCalendar ? "시작일" : "종료일"} 선택하기
                </Button>
              </div>
              {!showEndCalendar ? (
                <Calendar
                  mode="single"
                  selected={filters.startDate}
                  onSelect={handleStartDateChange}
                  initialFocus
                  disabled={(date) =>
                    filters.endDate ? date > filters.endDate : false
                  }
                  className="w-full rounded-md border bg-white [&_.rdp]:p-0 [&_.rdp-caption]:text-xs [&_.rdp-cell]:p-0 [&_.rdp-button]:p-0 [&_.rdp-button]:h-7 [&_.rdp-button]:w-7 [&_.rdp-head_th]:p-0 [&_.rdp-head_th]:text-[10px] [&_.rdp-button]:text-xs"
                />
              ) : (
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={handleEndDateChange}
                  initialFocus
                  disabled={(date) =>
                    filters.startDate ? date < filters.startDate : false
                  }
                  className="w-full rounded-md border bg-white [&_.rdp]:p-0 [&_.rdp-caption]:text-xs [&_.rdp-cell]:p-0 [&_.rdp-button]:p-0 [&_.rdp-button]:h-7 [&_.rdp-button]:w-7 [&_.rdp-head_th]:p-0 [&_.rdp-head_th]:text-[10px] [&_.rdp-button]:text-xs"
                />
              )}
            </div>
            <div className="hidden sm:flex sm:flex-row gap-2">
              <Calendar
                mode="single"
                selected={filters.startDate}
                onSelect={handleStartDateChange}
                initialFocus
                disabled={(date) =>
                  filters.endDate ? date > filters.endDate : false
                }
                className="rounded-md border"
              />
              <div className="self-center w-[1px] h-[200px] bg-border" />
              <Calendar
                mode="single"
                selected={filters.endDate}
                onSelect={handleEndDateChange}
                initialFocus
                disabled={(date) =>
                  filters.startDate ? date < filters.startDate : false
                }
                className="rounded-md border"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {onExport && (
          <Button
            variant="outline"
            onClick={onExport}
            className="flex-1 sm:flex-none whitespace-nowrap h-9 px-3"
            size="sm"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">CSV 내보내기</span>
            <span className="sm:hidden ml-2">내보내기</span>
          </Button>
        )}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="flex-1 sm:flex-none h-9 px-3 text-sm"
          >
            <X className="h-3 w-3 mr-2" />
            <span className="hidden sm:inline">날짜 초기화</span>
            <span className="sm:hidden">초기화</span>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      <CommonFilters
        searchPlaceholder="로그 검색..."
        searchValue={filters.search || ""}
        onSearchChange={handleSearchChange}
        selects={[
          {
            value: filters.level || "all",
            onChange: handleLevelChange,
            options: [
              { value: "all", label: "모든 레벨" },
              { value: "info", label: "정보" },
              { value: "warn", label: "경고" },
              { value: "error", label: "오류" },
              { value: "debug", label: "디버그" },
            ],
            placeholder: "로그 레벨",
          },
        ]}
      />
      {datePickers}
    </div>
  );
}
