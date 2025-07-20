import { AlertCircle } from "lucide-react";
import type { LogFilter } from "@/lib/types/system";
import { LABELS } from "@/lib/constants/management";

interface LogEmptyStateProps {
  filters: LogFilter;
}

export function LogEmptyState({ filters }: LogEmptyStateProps) {
  const hasActiveFilters =
    filters.search || filters.level || filters.startDate || filters.endDate;

  return (
    <div className="text-center py-8 text-muted-foreground">
      <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
      <p>{LABELS.NO_LOGS_TO_DISPLAY}</p>
      {hasActiveFilters && (
        <p className="text-sm mt-2">{LABELS.ADJUST_FILTERS}</p>
      )}
    </div>
  );
}
