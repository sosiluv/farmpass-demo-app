import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { RoleBadge, UserRole } from "@/components/user/role-badge";
import { QuickActionButtons } from "@/components/user/quick-action-buttons";
import { useState } from "react";
import { ImagePreviewDialog } from "@/components/common/ImagePreviewDialog";
import { generateInitials, getAvatarUrl } from "@/lib/utils/media/avatar";

// 역할별 아바타 스타일 설정
function getRoleStyles(role: string): {
  bgColor: string;
  textColor: string;
  borderColor: string;
} {
  switch (role) {
    case "owner":
      return {
        bgColor: "bg-purple-50",
        textColor: "text-purple-700",
        borderColor: "border-purple-200",
      };
    case "manager":
      return {
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        borderColor: "border-blue-200",
      };
    case "viewer":
      return {
        bgColor: "bg-green-50",
        textColor: "text-green-700",
        borderColor: "border-green-200",
      };
    default:
      return {
        bgColor: "bg-gray-50",
        textColor: "text-gray-700",
        borderColor: "border-gray-200",
      };
  }
}

interface Member {
  id: string;
  representative_name: string;
  email: string;
  role: string;
  profile_image_url?: string | null;
  avatar_seed?: string | null;
  name?: string | null;
}

interface MemberCardProps {
  member: Member;
  canManageMembers: boolean;
  onDelete: (id: string) => void;
  onRoleChange: (memberId: string, newRole: "manager" | "viewer") => void;
}

export function MemberCard({
  member,
  canManageMembers,
  onDelete,
  onRoleChange,
}: MemberCardProps) {
  const roleStyles = getRoleStyles(member.role);
  const [previewOpen, setPreviewOpen] = useState(false);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/5 transition-colors gap-3 sm:gap-4">
      {/* 모바일: 세로 레이아웃, 태블릿+: 가로 레이아웃 */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <Avatar
          className={`h-10 w-10 sm:h-12 sm:w-12 border-2 ${
            roleStyles.borderColor
          } ${roleStyles.bgColor} flex-shrink-0 ${
            member.profile_image_url ? "cursor-pointer" : ""
          }`}
          onClick={() => member.profile_image_url && setPreviewOpen(true)}
        >
          <AvatarImage
            src={getAvatarUrl(
              {
                ...member,
                name: member.representative_name,
              },
              { size: 128 }
            )}
            alt={member.representative_name}
            className="object-cover"
          />
          <AvatarFallback
            className={`font-medium text-xs sm:text-sm ${roleStyles.textColor}`}
          >
            {generateInitials(member.representative_name)}
          </AvatarFallback>
        </Avatar>
        <ImagePreviewDialog
          src={member.profile_image_url || ""}
          alt={member.representative_name}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          caption={member.representative_name}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="font-medium text-sm sm:text-base truncate">
              {member.representative_name}
              {member.role === "owner" && (
                <span className="ml-2 text-xs sm:text-sm text-purple-600 font-normal">
                  (농장 소유자)
                </span>
              )}
            </span>
            <RoleBadge role={member.role as UserRole} />
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground truncate">
            {member.email}
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-end sm:justify-start flex-shrink-0">
        <QuickActionButtons
          memberRole={member.role as UserRole}
          memberId={member.id}
          memberName={member.representative_name}
          onDelete={onDelete}
          onRoleChange={onRoleChange}
          canManageMembers={canManageMembers}
        />
      </div>
    </div>
  );
}
