import { CommonFilters } from "../shared/CommonFilters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import type { LogLevel } from "@/lib/types/common";

interface LogFiltersProps {
  filters: LogFilter;
  onFiltersChange: (filters: LogFilter) => void;
  levelFilters: string[];
  onLevelFiltersChange: (filters: string[]) => void;
  onCategoryFiltersChange?: (filters: string[]) => void;
  onExport?: () => void;
}

export function LogFilters({
  filters,
  onFiltersChange,
  levelFilters,
  onLevelFiltersChange,
  onCategoryFiltersChange,
  onExport,
}: LogFiltersProps) {
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, search: e.target.value });
  };

  const handleLevelToggle = (level: string) => {
    if (level === "all") {
      onLevelFiltersChange(["all"]);
    } else {
      if (levelFilters.includes("all")) {
        onLevelFiltersChange([level]);
      } else {
        if (levelFilters.includes(level)) {
          const newFilters = levelFilters.filter((f) => f !== level);
          onLevelFiltersChange(newFilters.length > 0 ? newFilters : ["all"]);
        } else {
          onLevelFiltersChange([...levelFilters, level]);
        }
      }
    }
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
    onLevelFiltersChange(["all"]);
    if (onCategoryFiltersChange) {
      onCategoryFiltersChange(["all"]);
    }
  };

  const hasActiveFilters =
    filters.search ||
    filters.startDate ||
    filters.endDate ||
    !levelFilters.includes("all");

  const levelOptions = [
    { value: "all", label: "모든 레벨", icon: "📊" },
    { value: "info", label: "정보", icon: "ℹ️" },
    { value: "warn", label: "경고", icon: "⚠️" },
    { value: "error", label: "오류", icon: "❌" },
    { value: "debug", label: "디버그", icon: "🐛" },
  ];

  const selectedLevelCount = levelFilters.includes("all")
    ? 0
    : levelFilters.length;

  const datePickers = (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* 시작 날짜 */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full sm:w-auto justify-start text-left font-normal",
              !filters.startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.startDate ? (
              format(filters.startDate, "PPP", { locale: ko })
            ) : (
              <span>시작 날짜</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.startDate}
            onSelect={handleStartDateChange}
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
              "w-full sm:w-auto justify-start text-left font-normal",
              !filters.endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.endDate ? (
              format(filters.endDate, "PPP", { locale: ko })
            ) : (
              <span>종료 날짜</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.endDate}
            onSelect={handleEndDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  return (
    <div className="space-y-4">
      <CommonFilters
        searchPlaceholder="로그 검색..."
        searchValue={filters.search || ""}
        onSearchChange={handleSearchChange}
      />

      {datePickers}

      {/* 레벨 필터 (다중 선택) */}
      <div className="space-y-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-foreground">로그 레벨</h4>
            {selectedLevelCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedLevelCount}개 선택
              </Badge>
            )}
          </div>
          {selectedLevelCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLevelFiltersChange(["all"])}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              전체 선택
            </Button>
          )}
        </div>

        {/* 레벨 버튼들 */}
        <div className="flex flex-wrap gap-2">
          {levelOptions.map((option) => {
            const selected = levelFilters.includes(option.value);
            const isAll = option.value === "all";

            return (
              <Button
                key={option.value}
                variant={selected ? "default" : "outline"}
                size="sm"
                onClick={() => handleLevelToggle(option.value)}
                className={cn(
                  "h-8 px-3 text-xs font-medium transition-all duration-200",
                  "border border-border hover:border-primary/50",
                  "focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
                  selected && [
                    "bg-primary text-primary-foreground",
                    "shadow-sm shadow-primary/25",
                    "border-primary hover:bg-primary/90",
                  ],
                  !selected && [
                    "bg-background hover:bg-accent/50",
                    "text-muted-foreground hover:text-foreground",
                  ],
                  isAll && selected && "bg-primary/90 hover:bg-primary"
                )}
              >
                <div className="flex items-center gap-1.5">
                  {!isAll && (
                    <span className="text-sm leading-none">{option.icon}</span>
                  )}
                  <span className="leading-none">
                    {isAll ? "전체" : option.label}
                  </span>
                </div>
              </Button>
            );
          })}
        </div>

        {/* 선택 상태 표시 */}
        {selectedLevelCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Separator orientation="vertical" className="h-3" />
            <span>선택된 레벨: {levelFilters.join(", ")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
