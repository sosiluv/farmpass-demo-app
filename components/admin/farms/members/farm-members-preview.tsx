"use client";

import { Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { type FarmMembers, MemberWithProfile } from "@/lib/types";
import { generateInitials, getAvatarUrl } from "@/lib/utils/media/avatar";
import { LABELS } from "@/lib/constants/farms";

interface FarmMembersPreviewProps {
  farmId: string;
  membersData?: FarmMembers;
}

export function FarmMembersPreview({
  farmId,
  membersData,
}: FarmMembersPreviewProps) {
  // 오직 상위에서 전달받은 데이터만 사용 (개별 쿼리 완전 제거)
  const members = membersData?.members || [];
  const isLoading = !membersData;

  if (isLoading) {
    return (
      <div className="h-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {LABELS.NO_MEMBERS}
          </span>
        </div>
      </div>
    );
  }

  const memberCount = members.length;

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
          {LABELS.MEMBERS_COUNT.replace("{count}", memberCount.toString())}
        </span>
      </div>

      <div className="flex items-center space-x-1">
        {/* 구성원 아바타 */}
        <div className="flex -space-x-2">
          {(members || []).slice(0, 3).map((member: MemberWithProfile) => (
            <Avatar
              key={member.id}
              className={`w-6 h-6 border-2 border-background ${getRoleColor(
                member.role
              )}`}
              title={`${member.representative_name} (${member.role})`}
            >
              <AvatarImage
                src={getAvatarUrl(
                  {
                    ...member,
                    name: member.representative_name,
                  },
                  { size: 64 }
                )}
                alt={member.representative_name}
                className="object-cover"
              />
              <AvatarFallback
                className={`text-xs font-medium ${getRoleColor(member.role)}`}
              >
                {generateInitials(member.representative_name)}
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
            {members.some((m: MemberWithProfile) => m.role === "owner") && (
              <span className="text-xs" title={LABELS.OWNER_TITLE}>
                {LABELS.OWNER_EMOJI}
              </span>
            )}
            {members.some((m: MemberWithProfile) => m.role === "manager") && (
              <span className="text-xs" title={LABELS.MANAGER_TITLE}>
                {LABELS.MANAGER_EMOJI}
              </span>
            )}
            {members.some((m: MemberWithProfile) => m.role === "viewer") && (
              <span className="text-xs" title={LABELS.VIEWER_TITLE}>
                {LABELS.VIEWER_EMOJI}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
