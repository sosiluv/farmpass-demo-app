"use client";

import { Button } from "@/components/ui/button";
import { UserMinus, Shield, ArrowUp, ArrowDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRole } from "./role-badge";

interface QuickActionButtonsProps {
  memberRole: UserRole;
  memberId: string;
  memberName: string;
  onDelete?: (memberId: string) => void;
  onRoleChange?: (memberId: string, newRole: "manager" | "viewer") => void;
  canManageMembers?: boolean;
}

export function QuickActionButtons({
  memberRole,
  memberId,
  memberName,
  onDelete,
  onRoleChange,
  canManageMembers = false,
}: QuickActionButtonsProps) {
  // 소유자는 삭제/변경 불가
  if (memberRole === "owner") {
    return null;
  }

  // 구성원 관리 권한이 없으면 버튼 표시하지 않음
  if (!canManageMembers) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      {/* 권한 변경 드롭다운 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-2">
            <Shield className="h-4 w-4 mr-2" />
            권한 변경
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => onRoleChange?.(memberId, "manager")}
            disabled={memberRole === "manager"}
          >
            관리자로 변경
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onRoleChange?.(memberId, "viewer")}
            disabled={memberRole === "viewer"}
          >
            조회자로 변경
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 삭제 버튼 */}
      <Button
        variant="destructive"
        size="sm"
        onClick={() => onDelete?.(memberId)}
        className="h-8 px-2"
      >
        <UserMinus className="h-4 w-4 mr-2" />
        삭제
      </Button>
    </div>
  );
}
