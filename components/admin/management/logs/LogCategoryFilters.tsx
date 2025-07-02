import { Button } from "@/components/ui/button";

interface LogCategoryFiltersProps {
  auditFilter: string;
  categoryFilter: string;
  onAuditFilterChange: (filter: string) => void;
  onCategoryFilterChange: (filter: string) => void;
}

export function LogCategoryFilters({
  auditFilter,
  categoryFilter,
  onAuditFilterChange,
  onCategoryFilterChange,
}: LogCategoryFiltersProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground">
          필터:
        </span>
        <div className="flex gap-1">
          <Button
            variant={auditFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onAuditFilterChange("all")}
            className="h-7 px-2 text-xs"
          >
            전체
          </Button>
          <Button
            variant={auditFilter === "audit" ? "default" : "outline"}
            size="sm"
            onClick={() => onAuditFilterChange("audit")}
            className="h-7 px-2 text-xs"
          >
            <span className="hidden sm:inline">👤 </span>사용자
          </Button>
          <Button
            variant={auditFilter === "system" ? "default" : "outline"}
            size="sm"
            onClick={() => onAuditFilterChange("system")}
            className="h-7 px-2 text-xs"
          >
            <span className="hidden sm:inline">⚙️ </span>시스템
          </Button>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        <Button
          variant={categoryFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("all")}
          className="h-7 px-2 text-xs"
        >
          <span className="sm:hidden">전체</span>
          <span className="hidden sm:inline">모든 카테고리</span>
        </Button>
        <Button
          variant={categoryFilter === "auth" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("auth")}
          className="h-7 px-2 text-xs"
        >
          <span className="hidden sm:inline">🔐 </span>인증
        </Button>
        <Button
          variant={categoryFilter === "farm" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("farm")}
          className="h-7 px-2 text-xs"
        >
          <span className="hidden sm:inline">🏡 </span>농장
        </Button>
        <Button
          variant={categoryFilter === "visitor" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("visitor")}
          className="h-7 px-2 text-xs"
        >
          <span className="hidden sm:inline">👥 </span>방문자
        </Button>
        <Button
          variant={categoryFilter === "member" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("member")}
          className="h-7 px-2 text-xs"
        >
          <span className="hidden sm:inline">👨‍💼 </span>멤버
        </Button>
        <Button
          variant={categoryFilter === "settings" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("settings")}
          className="h-7 px-2 text-xs"
        >
          <span className="hidden sm:inline">⚙️ </span>설정
        </Button>
        <Button
          variant={categoryFilter === "security" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("security")}
          className="h-7 px-2 text-xs"
        >
          <span className="hidden sm:inline">🛡️ </span>보안
        </Button>
        <Button
          variant={categoryFilter === "file" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("file")}
          className="h-7 px-2 text-xs"
        >
          <span className="hidden sm:inline">📁 </span>파일
        </Button>
        <Button
          variant={categoryFilter === "notification" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("notification")}
          className="h-7 px-2 text-xs"
        >
          <span className="hidden sm:inline">🔔 </span>알림
        </Button>
        <Button
          variant={categoryFilter === "data" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("data")}
          className="h-7 px-2 text-xs"
        >
          <span className="hidden sm:inline">📊 </span>데이터
        </Button>
        <Button
          variant={categoryFilter === "log" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("log")}
          className="h-7 px-2 text-xs"
        >
          <span className="hidden sm:inline">📋 </span>로그관리
        </Button>
        <Button
          variant={categoryFilter === "application" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("application")}
          className="h-7 px-2 text-xs"
        >
          <span className="hidden sm:inline">🖥️ </span>앱
        </Button>
        <Button
          variant={categoryFilter === "performance" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("performance")}
          className="h-7 px-2 text-xs"
        >
          <span className="hidden sm:inline">⚡ </span>성능
        </Button>
        <Button
          variant={categoryFilter === "error" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("error")}
          className="h-7 px-2 text-xs"
        >
          <span className="hidden sm:inline">❌ </span>에러
        </Button>
        <Button
          variant={categoryFilter === "system" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("system")}
          className="h-7 px-2 text-xs"
        >
          <span className="hidden sm:inline">🔧 </span>기타
        </Button>
      </div>
    </div>
  );
}
