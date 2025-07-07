"use client";

import { Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { MemberWithProfile as MemberData } from "@/lib/hooks/use-farm-members-preview-safe";

// 타입 정의
interface FarmMembersData {
  count: number;
  members: MemberData[];
  loading: boolean;
}

interface FarmMembersPreviewProps {
  farmId: string;
  membersData: FarmMembersData;
}

export function FarmMembersPreview({
  farmId,
  membersData,
}: FarmMembersPreviewProps) {
  const { count: memberCount, members, loading } = membersData;

  if (loading) {
    return (
      <div className="h-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-amber-100 text-amber-700";
      case "manager":
        return "bg-blue-100 text-blue-700";
      case "viewer":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex items-center justify-between pt-3 border-t border-border/50">
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          구성원 {memberCount}명
        </span>
      </div>

      <div className="flex items-center space-x-1">
        {/* 구성원 아바타 */}
        <div className="flex -space-x-2">
          {(members || []).slice(0, 3).map((member: MemberData) => (
            <Avatar
              key={member.id}
              className={`w-6 h-6 border-2 border-background ${getRoleColor(
                member.role
              )}`}
              title={`${member.name} (${member.role})`}
            >
              <AvatarImage
                src={member.profile_image_url || ""}
                alt={member.name}
                className="object-cover"
              />
              <AvatarFallback
                className={`text-xs font-medium ${getRoleColor(member.role)}`}
              >
                {member.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}

          {/* 더 많은 구성원이 있을 때 +N 표시 */}
          {memberCount > 3 && (
            <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
              +{memberCount - 3}
            </div>
          )}
        </div>

        {/* 역할 요약 배지 */}
        {memberCount > 0 && (
          <div className="flex space-x-1 ml-2">
            {members.some((m: MemberData) => m.role === "owner") && (
              <span className="text-xs" title="소유자">
                🛡️
              </span>
            )}
            {members.some((m: MemberData) => m.role === "manager") && (
              <span className="text-xs" title="관리자">
                👨‍💼
              </span>
            )}
            {members.some((m: MemberData) => m.role === "viewer") && (
              <span className="text-xs" title="조회자">
                👁️
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
