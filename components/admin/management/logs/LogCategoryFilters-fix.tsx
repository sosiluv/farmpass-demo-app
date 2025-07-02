import { Button } from "@/components/ui/button";
import {
  User,
  Settings,
  Home,
  Users,
  Shield,
  FileText,
  Bell,
  Database,
  ClipboardList,
  Monitor,
  Zap,
  AlertTriangle,
  Wrench,
} from "lucide-react";

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
            <User className="w-3 h-3 sm:mr-1" />
            <span className="hidden sm:inline">사용자</span>
          </Button>
          <Button
            variant={auditFilter === "system" ? "default" : "outline"}
            size="sm"
            onClick={() => onAuditFilterChange("system")}
            className="h-7 px-2 text-xs"
          >
            <Settings className="w-3 h-3 sm:mr-1" />
            <span className="hidden sm:inline">시스템</span>
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
          <Shield className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">인증</span>
        </Button>
        <Button
          variant={categoryFilter === "farm" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("farm")}
          className="h-7 px-2 text-xs"
        >
          <Home className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">농장</span>
        </Button>
        <Button
          variant={categoryFilter === "visitor" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("visitor")}
          className="h-7 px-2 text-xs"
        >
          <Users className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">방문자</span>
        </Button>
        <Button
          variant={categoryFilter === "member" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("member")}
          className="h-7 px-2 text-xs"
        >
          <User className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">멤버</span>
        </Button>
        <Button
          variant={categoryFilter === "settings" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("settings")}
          className="h-7 px-2 text-xs"
        >
          <Settings className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">설정</span>
        </Button>
        <Button
          variant={categoryFilter === "security" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("security")}
          className="h-7 px-2 text-xs"
        >
          <Shield className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">보안</span>
        </Button>
        <Button
          variant={categoryFilter === "file" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("file")}
          className="h-7 px-2 text-xs"
        >
          <FileText className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">파일</span>
        </Button>
        <Button
          variant={categoryFilter === "notification" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("notification")}
          className="h-7 px-2 text-xs"
        >
          <Bell className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">알림</span>
        </Button>
        <Button
          variant={categoryFilter === "data" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("data")}
          className="h-7 px-2 text-xs"
        >
          <Database className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">데이터</span>
        </Button>
        <Button
          variant={categoryFilter === "log" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("log")}
          className="h-7 px-2 text-xs"
        >
          <ClipboardList className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">로그관리</span>
        </Button>
        <Button
          variant={categoryFilter === "application" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("application")}
          className="h-7 px-2 text-xs"
        >
          <Monitor className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">앱</span>
        </Button>
        <Button
          variant={categoryFilter === "performance" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("performance")}
          className="h-7 px-2 text-xs"
        >
          <Zap className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">성능</span>
        </Button>
        <Button
          variant={categoryFilter === "error" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("error")}
          className="h-7 px-2 text-xs"
        >
          <AlertTriangle className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">에러</span>
        </Button>
        <Button
          variant={categoryFilter === "system" ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryFilterChange("system")}
          className="h-7 px-2 text-xs"
        >
          <Wrench className="w-3 h-3 sm:mr-1" />
          <span className="hidden sm:inline">기타</span>
        </Button>
      </div>
    </div>
  );
}
