import { Badge } from "@/components/ui/badge";
import { X, Search, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { getFarmTypeInfo } from "@/lib/constants/farm-types";
import type { Farm } from "@/lib/types/visitor";

const DATE_RANGE_LABELS: Record<string, string> = {
  today: "오늘",
  week: "최근 7일",
  month: "최근 30일",
  custom: "사용자 지정",
  all: "전체",
};

interface ActiveFilterTagsProps {
  searchTerm: string;
  selectedFarm: string;
  dateRange: string;
  customStartDate: Date | null;
  customEndDate: Date | null;
  farms: Farm[];
  onSearchChange: (value: string) => void;
  onFarmChange: (value: string) => void;
  onDateRangeChange: (value: string) => void;
  onCustomStartDateChange: (date: Date | null) => void;
  onCustomEndDateChange: (date: Date | null) => void;
  onClearFilters: () => void;
  onClearCustomDates?: () => void;
  disableFarmRemoval?: boolean;
}

export function ActiveFilterTags({
  searchTerm,
  selectedFarm,
  dateRange,
  customStartDate,
  customEndDate,
  farms,
  onSearchChange,
  onFarmChange,
  onDateRangeChange,
  onCustomStartDateChange,
  onCustomEndDateChange,
  onClearFilters,
  onClearCustomDates,
  disableFarmRemoval = false,
}: ActiveFilterTagsProps) {
  const getActiveFilterTags = () => {
    const tags = [];

    // 검색어 필터
    if (searchTerm.trim()) {
      tags.push({
        key: "search",
        label: `검색: "${searchTerm}"`,
        icon: Search,
        color: "bg-blue-100 text-blue-800 border-blue-200",
        onRemove: () => onSearchChange(""),
      });
    }

    // 농장 필터
    if (selectedFarm && selectedFarm !== "all") {
      const farm = farms.find((f) => f.id === selectedFarm);
      if (farm) {
        const { Icon } = getFarmTypeInfo(farm.farm_type ?? null);
        tags.push({
          key: "farm",
          label: farm.farm_name,
          icon: Icon,
          color: disableFarmRemoval
            ? "bg-purple-100 text-purple-800 border-purple-200 cursor-default"
            : "bg-purple-100 text-purple-800 border-purple-200",
          onRemove: disableFarmRemoval ? undefined : () => onFarmChange("all"),
        });
      }
    }

    // 날짜 범위 필터
    if (dateRange && dateRange !== "all") {
      const dateLabel = DATE_RANGE_LABELS[dateRange] || dateRange;
      tags.push({
        key: "dateRange",
        label: dateLabel,
        icon: Calendar,
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        onRemove: () => onDateRangeChange("all"),
      });
    }

    // 커스텀 날짜 필터
    if (customStartDate || customEndDate) {
      let dateLabel = "커스텀 날짜";
      if (customStartDate && customEndDate) {
        dateLabel = `${format(customStartDate, "MM/dd", {
          locale: ko,
        })} ~ ${format(customEndDate, "MM/dd", { locale: ko })}`;
      } else if (customStartDate) {
        dateLabel = `${format(customStartDate, "MM/dd", { locale: ko })} ~`;
      } else if (customEndDate) {
        dateLabel = `~ ${format(customEndDate, "MM/dd", { locale: ko })}`;
      }

      tags.push({
        key: "customDate",
        label: dateLabel,
        icon: MapPin,
        color: "bg-orange-100 text-orange-800 border-orange-200",
        onRemove: () => {
          onCustomStartDateChange(null);
          onCustomEndDateChange(null);
          onClearCustomDates?.();
        },
      });
    }

    return tags;
  };

  const activeTags = getActiveFilterTags();

  if (activeTags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200">
      <div className="flex items-center space-x-1 sm:space-x-2">
        <span className="text-xs sm:text-sm font-medium text-gray-700">
          활성 필터:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {(activeTags || []).map((tag) => {
          const Icon = tag.icon;
          return (
            <Badge
              key={tag.key}
              variant="outline"
              className={`${tag.color} ${
                tag.onRemove
                  ? "hover:bg-opacity-80 transition-all duration-200 cursor-pointer group"
                  : ""
              }`}
              onClick={tag.onRemove}
            >
              <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">
                {tag.label}
              </span>
              {tag.onRemove && (
                <X className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 flex-shrink-0 group-hover:text-red-600 transition-colors" />
              )}
            </Badge>
          );
        })}
      </div>

      <button
        onClick={onClearFilters}
        className="text-xs sm:text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 sm:px-3 py-1 sm:py-2 rounded-md transition-all duration-200 font-medium"
      >
        모든 필터 지우기
      </button>
    </div>
  );
}
