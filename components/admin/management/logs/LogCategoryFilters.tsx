import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LOG_CATEGORIES } from "@/lib/constants/log-categories";
import { BUTTONS, LABELS } from "@/lib/constants/management";
import { cn } from "@/lib/utils";

interface LogCategoryFiltersProps {
  categoryFilters: string[];
  onCategoryFiltersChange: (filters: string[]) => void;
}

export function LogCategoryFilters({
  categoryFilters,
  onCategoryFiltersChange,
}: LogCategoryFiltersProps) {
  const handleCategoryToggle = (categoryValue: string) => {
    if (categoryValue === "all") {
      // "전체" 선택 시 다른 모든 선택 해제
      onCategoryFiltersChange(["all"]);
    } else {
      // "전체"가 선택되어 있으면 해제하고 현재 카테고리만 선택
      if (categoryFilters.includes("all")) {
        onCategoryFiltersChange([categoryValue]);
      } else {
        // 현재 카테고리가 이미 선택되어 있으면 제거, 아니면 추가
        if (categoryFilters.includes(categoryValue)) {
          const newFilters = categoryFilters.filter((f) => f !== categoryValue);
          // 아무것도 선택되지 않으면 "전체" 선택
          onCategoryFiltersChange(newFilters.length > 0 ? newFilters : ["all"]);
        } else {
          onCategoryFiltersChange([...categoryFilters, categoryValue]);
        }
      }
    }
  };

  const isSelected = (categoryValue: string) => {
    return categoryFilters.includes(categoryValue);
  };

  const selectedCount = categoryFilters.includes("all")
    ? 0
    : categoryFilters.length;

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-foreground">
            {LABELS.CATEGORY_FILTER}
          </h4>
          {selectedCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {LABELS.SELECTED_COUNT_SIMPLE.replace(
                "{count}",
                selectedCount.toString()
              )}
            </Badge>
          )}
        </div>
        {selectedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCategoryFiltersChange(["all"])}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {BUTTONS.SELECT_ALL}
          </Button>
        )}
      </div>

      {/* 카테고리 버튼들 */}
      <div className="flex flex-wrap gap-2">
        {LOG_CATEGORIES.map((category) => {
          const selected = isSelected(category.value);
          const isAll = category.value === "all";

          return (
            <Button
              key={category.value}
              variant={selected ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryToggle(category.value)}
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
                  <span className="text-sm leading-none">{category.icon}</span>
                )}
                <span className="leading-none">
                  {isAll ? BUTTONS.ALL_CATEGORIES : category.label}
                </span>
              </div>
            </Button>
          );
        })}
      </div>

      {/* 선택 상태 표시 */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Separator orientation="vertical" className="h-3" />
          <span>
            {LABELS.SELECTED_CATEGORIES.replace(
              "{categories}",
              categoryFilters.join(", ")
            )}
          </span>
        </div>
      )}
    </div>
  );
}
