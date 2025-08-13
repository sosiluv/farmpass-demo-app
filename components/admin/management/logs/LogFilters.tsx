import React from "react";
import { CommonFilters } from "../shared/CommonFilters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DateRangePicker from "@/components/admin/management/shared/DateRangePicker";
import { BUTTONS, LABELS, PLACEHOLDERS } from "@/lib/constants/management";
import { cn } from "@/lib/utils";
import type { LogFilter } from "@/lib/types/system";

interface LogFiltersProps {
  filters: LogFilter;
  onFiltersChange: (filters: LogFilter) => void;
  levelFilters: string[];
  onLevelFiltersChange: (filters: string[]) => void;
}

export function LogFilters({
  filters,
  onFiltersChange,
  levelFilters,
  onLevelFiltersChange,
}: LogFiltersProps) {
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

  const levelOptions = LABELS.LOG_LEVEL_OPTIONS;

  const selectedLevelCount = levelFilters.includes("all")
    ? 0
    : levelFilters.length;

  const datePickers = (
    <DateRangePicker
      startDate={filters.startDate}
      endDate={filters.endDate}
      onStartDateChange={handleStartDateChange}
      onEndDateChange={handleEndDateChange}
    />
  );

  return (
    <div className="space-y-4">
      <CommonFilters
        searchPlaceholder={PLACEHOLDERS.LOG_SEARCH_PLACEHOLDER}
        searchValue={filters.search || ""}
        onSearchChange={handleSearchChange}
        extra={datePickers}
      />

      {/* 레벨 필터 (다중 선택) */}
      <div className="space-y-3">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-foreground">
              {LABELS.LOG_LEVEL}
            </h4>
            {selectedLevelCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {LABELS.SELECTED_COUNT_SIMPLE.replace(
                  "{count}",
                  selectedLevelCount.toString()
                )}
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
              {BUTTONS.SELECT_ALL}
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
                    {isAll ? BUTTONS.ALL_CATEGORIES : option.label}
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
            <span>
              {LABELS.SELECTED_LEVELS.replace(
                "{levels}",
                levelFilters.join(", ")
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
