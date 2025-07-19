import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { X, Calendar, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { LogFilter } from "@/lib/types/system";

interface LogFilterStatusProps {
  totalCount: number;
  filteredCount: number;
  categoryFilters: string[];
  filters: LogFilter;
  levelFilters: string[];
  onClearAllFilters?: () => void;
}

export function LogFilterStatus({
  totalCount,
  filteredCount,
  categoryFilters,
  filters,
  levelFilters,
  onClearAllFilters,
}: LogFilterStatusProps) {
  const getFilterDescription = () => {
    if (categoryFilters.includes("all")) {
      return null;
    }

    if (categoryFilters.length === 1) {
      return categoryFilters[0];
    }

    return `${categoryFilters.length}개 카테고리`;
  };

  const getActiveFilterTags = () => {
    const tags = [];

    // 검색어 필터
    if (filters.search?.trim()) {
      tags.push({
        key: "search",
        label: `검색: "${filters.search}"`,
        icon: "🔍",
        color: "bg-blue-100 text-blue-800 border-blue-200",
      });
    }

    // 날짜 필터
    if (filters.startDate || filters.endDate) {
      let dateLabel = "날짜 범위";
      if (filters.startDate && filters.endDate) {
        dateLabel = `${format(filters.startDate, "MM/dd", {
          locale: ko,
        })} ~ ${format(filters.endDate, "MM/dd", { locale: ko })}`;
      } else if (filters.startDate) {
        dateLabel = `${format(filters.startDate, "MM/dd", { locale: ko })} ~`;
      } else if (filters.endDate) {
        dateLabel = `~ ${format(filters.endDate, "MM/dd", { locale: ko })}`;
      }

      tags.push({
        key: "date",
        label: dateLabel,
        icon: "📅",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      });
    }

    // 레벨 필터
    if (!levelFilters.includes("all")) {
      const levelLabels = levelFilters.map((level) => {
        const levelMap: Record<string, string> = {
          info: "정보",
          warn: "경고",
          error: "오류",
          debug: "디버그",
        };
        return levelMap[level] || level;
      });

      tags.push({
        key: "level",
        label: levelLabels.join(", "),
        icon: "⚠️",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      });
    }

    // 카테고리 필터
    const categoryDescription = getFilterDescription();
    if (categoryDescription) {
      tags.push({
        key: "category",
        label: categoryDescription,
        icon: "🏷️",
        color: "bg-purple-100 text-purple-800 border-purple-200",
      });
    }

    return tags;
  };

  const activeTags = getActiveFilterTags();
  const hasActiveFilters = activeTags.length > 0;

  if (!hasActiveFilters) {
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
        {activeTags.map((tag) => (
          <Badge
            key={tag.key}
            variant="outline"
            className={cn(
              "text-xs sm:text-sm font-medium",
              tag.color,
              "hover:bg-opacity-80 transition-all duration-200"
            )}
          >
            <span className="mr-1">{tag.icon}</span>
            {tag.label}
          </Badge>
        ))}
      </div>

      {onClearAllFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAllFilters}
          className="text-xs sm:text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 sm:px-3 py-1 sm:py-2 rounded-md transition-all duration-200 font-medium"
        >
          <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          모든 필터 지우기
        </Button>
      )}
    </div>
  );
}
