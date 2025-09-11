import { Badge } from "@/components/ui/badge";

interface ResultCounterProps {
  filteredCount: number;
  totalCount: number;
}

export function ResultCounter({
  filteredCount,
  totalCount,
}: ResultCounterProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm md:text-base bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-slate-800/80 dark:to-slate-800/80 rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-200/60 dark:border-slate-600/60 shadow-sm backdrop-blur-sm whitespace-nowrap">
      <div className="flex items-center gap-1 sm:gap-2">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse shadow-sm" />
        <span className="font-semibold text-gray-800 dark:text-slate-200">
          {filteredCount.toLocaleString()}
        </span>
        <span className="text-gray-400 dark:text-slate-400 font-medium">/</span>
        <span className="text-gray-600 dark:text-slate-300 font-medium">
          {totalCount.toLocaleString()}
        </span>
      </div>
      <Badge
        variant="outline"
        className="text-xs sm:text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 shadow-sm px-1 sm:px-1.5 md:px-2 py-0.5"
      >
        결과
      </Badge>
    </div>
  );
}
