interface LogFilterStatusProps {
  totalCount: number;
  filteredCount: number;
  auditFilter: string;
  categoryFilter: string;
}

export function LogFilterStatus({
  totalCount,
  filteredCount,
  auditFilter,
  categoryFilter,
}: LogFilterStatusProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
      <span>
        총 {totalCount}개 중 {filteredCount}개 표시
      </span>
      {auditFilter !== "all" && (
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
          {auditFilter === "audit" ? "사용자 활동만" : "시스템 로그만"}
        </span>
      )}
      {categoryFilter !== "all" && (
        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
          {categoryFilter} 카테고리
        </span>
      )}
    </div>
  );
}
