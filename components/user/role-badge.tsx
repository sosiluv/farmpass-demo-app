"use client";

import { Badge } from "@/components/ui/badge";
import { Shield, UserCheck, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export type UserRole = "owner" | "manager" | "viewer";

interface RoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "solid";
  className?: string;
}

const roleConfig = {
  owner: {
    label: "농장 소유자",
    shortLabel: "소유자",
    mobileLabel: "소유자",
    icon: Shield,
    colors: {
      default: "bg-purple-100 text-purple-800 border-purple-200",
      outline: "border-purple-300 text-purple-700 hover:bg-purple-50",
      solid: "bg-purple-600 text-white hover:bg-purple-700",
    },
  },
  manager: {
    label: "농장 관리자",
    shortLabel: "관리자",
    mobileLabel: "관리자",
    icon: UserCheck,
    colors: {
      default: "bg-blue-100 text-blue-800 border-blue-200",
      outline: "border-blue-300 text-blue-700 hover:bg-blue-50",
      solid: "bg-blue-600 text-white hover:bg-blue-700",
    },
  },
  viewer: {
    label: "조회 전용",
    shortLabel: "조회자",
    mobileLabel: "조회",
    icon: Eye,
    colors: {
      default: "bg-green-100 text-green-800 border-green-200",
      outline: "border-green-300 text-green-700 hover:bg-green-50",
      solid: "bg-green-600 text-white hover:bg-green-700",
    },
  },
};

export function RoleBadge({
  role,
  size = "md",
  variant = "default",
  className,
}: RoleBadgeProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1",
    md: "text-[10px] sm:text-sm px-1.5 sm:px-2.5 py-0.5 sm:py-1",
    lg: "text-xs sm:text-base px-2 sm:px-3 py-1 sm:py-1.5",
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5 sm:h-3 sm:w-3",
    md: "h-3 w-3 sm:h-4 sm:w-4",
    lg: "h-3.5 w-3.5 sm:h-5 sm:w-5",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 sm:gap-1.5 font-medium border transition-colors",
        config.colors[variant],
        sizeClasses[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      <span className="hidden sm:inline">
        {size === "sm" ? config.shortLabel : config.label}
      </span>
      <span className="sm:hidden">{config.mobileLabel}</span>
    </Badge>
  );
}

// 권한 선택용 드롭다운에서 사용할 옵션 컴포넌트
interface RoleOptionProps {
  role: UserRole;
  selected?: boolean;
  onClick?: () => void;
}

export function RoleOption({ role, selected, onClick }: RoleOptionProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 cursor-pointer rounded-md transition-colors",
        selected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent hover:text-accent-foreground"
      )}
      onClick={onClick}
    >
      <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="font-medium text-xs sm:text-sm">{config.label}</span>
    </div>
  );
}

// 권한 정보를 가져오는 유틸리티 함수
export function getRoleInfo(role: UserRole) {
  return roleConfig[role];
}

// 권한 레벨을 숫자로 반환 (높을수록 더 높은 권한)
export function getRoleLevel(role: UserRole): number {
  const levels = {
    viewer: 1,
    manager: 2,
    owner: 3,
  };
  return levels[role];
}

// 권한 비교 함수
export function canManageRole(
  userRole: UserRole,
  targetRole: UserRole
): boolean {
  return getRoleLevel(userRole) > getRoleLevel(targetRole);
}
