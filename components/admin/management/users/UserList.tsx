import { CommonListItem } from "../shared/CommonListItem";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye } from "lucide-react";
import { formatDateTime } from "@/lib/utils/datetime/date";
import { Profile } from "@/lib/types";
import { useState } from "react";
import { UserDetailModal } from "./UserDetailModal";
import { CommonListWrapper } from "../shared/CommonListWrapper";
import { ImagePreviewDialog } from "@/components/common/ImagePreviewDialog";
import { generateInitials, getAvatarUrl } from "@/lib/utils/media/avatar";

interface UserListProps {
  users: Profile[];
  onUserClick: (user: Profile) => void;
}

export function UserList({ users, onUserClick }: UserListProps) {
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewAlt, setPreviewAlt] = useState<string>("");

  const handleAvatarClick = (user: Profile) => {
    if (user.profile_image_url) {
      setPreviewUrl(user.profile_image_url);
      setPreviewAlt(user.name || "User");
      setPreviewOpen(true);
    }
  };

  const getRoleColor = (accountType: string) => {
    switch (accountType) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "user":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-green-500",
      "bg-blue-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-cyan-500",
    ];

    if (!name) return "bg-gray-500";

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <>
      <CommonListWrapper>
        {(users || []).map((user) => (
          <CommonListItem
            key={user.id}
            avatar={
              <Avatar
                className="h-6 w-6 sm:h-10 sm:w-10 lg:h-12 lg:w-12 flex-shrink-0 mr-8 sm:mr-10 lg:mr-12 xl:mr-16 2xl:mr-20"
                onClick={() => handleAvatarClick(user)}
                style={{
                  cursor: user.profile_image_url ? "pointer" : undefined,
                }}
              >
                <AvatarImage
                  src={getAvatarUrl(user, { size: 128 })}
                  alt={user.name || "User"}
                />
                <AvatarFallback
                  className={`${getAvatarColor(user.name)} text-white text-sm`}
                >
                  {generateInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            }
            primary={user.name}
            secondary={user.email}
            meta={
              user.last_login_at
                ? `마지막 접속: ${formatDateTime(user.last_login_at)}`
                : "로그인 기록 없음"
            }
            badges={
              <div className="flex flex-col gap-1">
                <Badge
                  className={`${getRoleColor(
                    user.account_type
                  )} text-xs px-2 py-1`}
                >
                  {user.account_type === "admin"
                    ? "시스템 관리자"
                    : "일반 사용자"}
                </Badge>
                <Badge
                  className={`${getStatusColor(
                    user.is_active
                  )} text-xs px-2 py-1`}
                >
                  {user.is_active ? "활성" : "비활성"}
                </Badge>
              </div>
            }
            actions={
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>상세 정보 보기</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            }
          />
        ))}
        {users.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">
            사용자가 없습니다.
          </div>
        )}
      </CommonListWrapper>

      <UserDetailModal
        user={selectedUser}
        open={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
      />
      <ImagePreviewDialog
        src={previewUrl}
        alt={previewAlt}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        caption={previewAlt}
      />
    </>
  );
}
