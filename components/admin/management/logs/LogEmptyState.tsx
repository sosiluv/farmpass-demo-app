import { AlertCircle } from "lucide-react";
import type { LogFilter } from "@/lib/types/system";

interface LogEmptyStateProps {
  filters: LogFilter;
}

export function LogEmptyState({ filters }: LogEmptyStateProps) {
  const hasActiveFilters =
    filters.search || filters.level || filters.startDate || filters.endDate;

  return (
    <div className="text-center py-8 text-muted-foreground">
      <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
      <p>표시할 로그가 없습니다.</p>
      {hasActiveFilters && <p className="text-sm mt-2">필터를 조정해보세요.</p>}
    </div>
  );
}
