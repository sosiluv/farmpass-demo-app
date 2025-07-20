import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  Settings,
  Building2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useState, useMemo, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import { BUTTONS, LABELS } from "@/lib/constants/visitor";
import type { Farm } from "@/lib/types/visitor";
import {
  SearchInput,
  ResultCounter,
  QuickFilters,
  VisitorFarmSelector,
  CustomDatePicker,
  ActiveFilterTags,
} from "./components";

interface VisitorFiltersProps {
  searchTerm: string;
  selectedFarm: string;
  dateRange: string;
  customStartDate: Date | null;
  customEndDate: Date | null;
  onSearchChange: (value: string) => void;
  onFarmChange: (value: string) => void;
  onDateRangeChange: (value: string) => void;
  onCustomStartDateChange: (date: Date | null) => void;
  onCustomEndDateChange: (date: Date | null) => void;
  farms: Farm[];
  activeFiltersCount: number;
  filteredCount: number;
  totalCount: number;
  onClearFilters: () => void;
  onClearCustomDates?: () => void;
  showFarmFilter?: boolean;
  showAllOption?: boolean;
  isAdmin?: boolean;
  disableFarmRemoval?: boolean;
}

export const VisitorFilters = memo(function VisitorFilters({
  searchTerm,
  selectedFarm,
  dateRange,
  customStartDate,
  customEndDate,
  onSearchChange,
  onFarmChange,
  onDateRangeChange,
  onCustomStartDateChange,
  onCustomEndDateChange,
  farms,
  activeFiltersCount,
  filteredCount,
  totalCount,
  onClearFilters,
  onClearCustomDates,
  showFarmFilter = true,
  showAllOption = true,
  isAdmin = false,
  disableFarmRemoval,
}: VisitorFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // 메모이제이션된 핸들러들
  const handleAdvancedToggle = useCallback(() => {
    setIsAdvancedOpen((prev) => !prev);
  }, []);

  // 메모이제이션된 컴포넌트들
  const searchSection = useMemo(
    () => (
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <SearchInput
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
            />
          </div>
          <div className="flex-shrink-0">
            <ResultCounter
              filteredCount={filteredCount}
              totalCount={totalCount}
            />
          </div>
        </div>
      </div>
    ),
    [searchTerm, onSearchChange, filteredCount, totalCount]
  );

  const advancedFilters = useMemo(
    () => (
      <Collapsible
        open={isAdvancedOpen}
        onOpenChange={setIsAdvancedOpen}
        className="space-y-2 sm:space-y-4"
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex items-center space-x-1.5 sm:space-x-3 h-8 sm:h-10 text-xs sm:text-sm border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-400 transition-all duration-300 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 hover:from-indigo-50 hover:to-white dark:hover:from-indigo-900 dark:hover:to-slate-900 shadow-sm hover:shadow-md",
              isAdvancedOpen &&
                "border-indigo-400 dark:border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900 dark:to-purple-900"
            )}
          >
            <div
              className={cn(
                "p-0.5 sm:p-1 rounded-md transition-all duration-300",
                isAdvancedOpen
                  ? "bg-gradient-to-br from-indigo-100 to-purple-100"
                  : "bg-gradient-to-br from-slate-100 to-gray-100"
              )}
            >
              <Settings
                className={cn(
                  "h-3 w-3 sm:h-4 sm:w-4 transition-all duration-300",
                  isAdvancedOpen ? "text-indigo-600" : "text-slate-600"
                )}
              />
            </div>
            <span className="font-medium">
              {BUTTONS.VISITOR_FILTERS_ADVANCED}
            </span>
            <ChevronDown
              className={cn(
                "h-3 w-3 sm:h-4 sm:w-4 transition-all duration-300 text-slate-500",
                isAdvancedOpen && "rotate-180 text-indigo-600"
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 sm:space-y-5 animate-in slide-in-from-top-2 duration-300">
          <div className="p-3 sm:p-5 bg-gradient-to-br from-slate-50/80 via-white to-indigo-50/30 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700 backdrop-blur-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {/* 농장 선택 */}
              {showFarmFilter && (
                <div className="space-y-1.5 sm:space-y-3 min-w-0">
                  <label className="text-xs sm:text-sm font-semibold text-foreground flex items-center space-x-1.5 sm:space-x-2">
                    <div className="p-0.5 sm:p-1 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-md">
                      <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <span>{LABELS.VISITOR_FILTERS_FARM_SELECT}</span>
                  </label>
                  <div className="min-w-0">
                    <VisitorFarmSelector
                      selectedFarm={selectedFarm}
                      farms={farms}
                      onFarmChange={onFarmChange}
                      showAllOption={showAllOption}
                    />
                  </div>
                </div>
              )}

              {/* 커스텀 날짜 선택 */}
              <div className="space-y-1.5 sm:space-y-3 min-w-0">
                <label className="text-xs sm:text-sm font-semibold text-foreground flex items-center space-x-1.5 sm:space-x-2">
                  <div className="p-0.5 sm:p-1 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-md">
                    <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <span>{LABELS.VISITOR_FILTERS_PERIOD_SETTING}</span>
                </label>
                <div className="min-w-0">
                  <CustomDatePicker
                    customStartDate={customStartDate}
                    customEndDate={customEndDate}
                    onCustomStartDateChange={onCustomStartDateChange}
                    onCustomEndDateChange={onCustomEndDateChange}
                    onClearCustomDates={onClearCustomDates}
                  />
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    ),
    [
      isAdvancedOpen,
      showFarmFilter,
      selectedFarm,
      farms,
      onFarmChange,
      showAllOption,
      customStartDate,
      customEndDate,
      onCustomStartDateChange,
      onCustomEndDateChange,
      onClearCustomDates,
    ]
  );

  return (
    <Card className="border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-2 sm:p-5 md:p-6">
        <div className="space-y-3 sm:space-y-5 min-w-0">
          {/* 검색 및 결과 카운터 */}
          {searchSection}

          {/* 빠른 필터 */}
          <QuickFilters
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
            activeFiltersCount={activeFiltersCount}
          />

          {/* 고급 필터 */}
          {advancedFilters}

          {/* 활성 필터 태그 */}
          <ActiveFilterTags
            searchTerm={searchTerm}
            selectedFarm={selectedFarm}
            dateRange={dateRange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            farms={farms}
            onSearchChange={onSearchChange}
            onFarmChange={onFarmChange}
            onDateRangeChange={onDateRangeChange}
            onCustomStartDateChange={onCustomStartDateChange}
            onCustomEndDateChange={onCustomEndDateChange}
            onClearFilters={onClearFilters}
            onClearCustomDates={onClearCustomDates}
            disableFarmRemoval={disableFarmRemoval}
          />
        </div>
      </CardContent>
    </Card>
  );
});
