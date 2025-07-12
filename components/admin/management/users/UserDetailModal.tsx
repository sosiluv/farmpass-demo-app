import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDateTime } from "@/lib/utils/datetime/date";
import { Profile } from "@/lib/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useResetLoginAttemptsMutation } from "@/lib/hooks/query/use-auth-mutations";
import { getAuthErrorMessage } from "@/lib/utils/validation/validation";

interface UserDetailModalProps {
  user: Profile | null;
  open: boolean;
  onClose: () => void;
}

export function UserDetailModal({ user, open, onClose }: UserDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError, showInfo } = useCommonToast();

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

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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

  const resetAttemptsMutation = useResetLoginAttemptsMutation();

  const handleUnlock = async () => {
    showInfo("계정 잠금 해제 시작", "계정 잠금을 해제하는 중입니다...");
    setLoading(true);
    try {
      await resetAttemptsMutation.mutateAsync({
        email: user?.email || "",
        reason: "관리자 수동 잠금 해제",
      });
      showSuccess(
        "계정 잠금 해제 완료",
        "계정 잠금이 성공적으로 해제되었습니다."
      );
      onClose();
    } catch (error) {
      const authError = getAuthErrorMessage(error);
      showError("계정 잠금 해제 실패", authError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[350px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] max-h-[90vh] sm:max-h-[85vh] overflow-hidden p-3 sm:p-4 md:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-base sm:text-lg">
            사용자 상세 정보
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            선택된 사용자의 상세 정보를 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        {user ? (
          <ScrollArea className="h-full max-h-[calc(90vh-8rem)] sm:max-h-[calc(85vh-10rem)]">
            <div className="space-y-4 sm:space-y-6 pr-2 sm:pr-4">
              {/* 기본 정보 */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0">
                  {user.profile_image_url ? (
                    <AvatarImage
                      src={user.profile_image_url}
                      alt={user.name || "User"}
                    />
                  ) : (
                    <AvatarFallback
                      className={`${getAvatarColor(
                        user.name
                      )} text-white text-sm sm:text-base`}
                    >
                      {getInitials(user.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="text-center sm:text-left flex-1">
                  <div className="text-lg sm:text-xl font-semibold">
                    {user.name}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground break-all">
                    {user.email}
                  </div>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-1 sm:gap-2 mt-2">
                    <Badge
                      className={`${getRoleColor(user.account_type)} text-xs`}
                    >
                      {user.account_type === "admin"
                        ? "시스템 관리자"
                        : "일반 사용자"}
                    </Badge>
                    <Badge
                      className={`${getStatusColor(user.is_active)} text-xs`}
                    >
                      {user.is_active ? "활성" : "비활성"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 상세 정보 */}
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="font-medium text-foreground">전화번호</div>
                    <div className="text-muted-foreground mt-1">
                      {user.phone || "미등록"}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="font-medium text-foreground">회사/기관</div>
                    <div className="text-muted-foreground mt-1 break-all">
                      {user.company_name || "미등록"}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="font-medium text-foreground">
                      사업자 유형
                    </div>
                    <div className="text-muted-foreground mt-1">
                      {user.business_type || "미등록"}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="font-medium text-foreground">회사 주소</div>
                    <div className="text-muted-foreground mt-1 break-all">
                      {user.company_address || "미등록"}
                    </div>
                  </div>
                </div>

                {/* 시간 정보 */}
                <div className="pt-2 sm:pt-4 border-t space-y-2 sm:space-y-3">
                  <div className="p-2 sm:p-3 bg-muted rounded-lg text-xs sm:text-sm">
                    <span className="font-medium text-foreground">
                      마지막 로그인:
                    </span>
                    <div className="text-muted-foreground mt-1">
                      {user.last_login_at
                        ? formatDateTime(user.last_login_at)
                        : "로그인 기록 없음"}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-muted rounded-lg text-xs sm:text-sm">
                    <span className="font-medium text-foreground">가입일:</span>
                    <div className="text-muted-foreground mt-1">
                      {formatDateTime(user.created_at)}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-muted rounded-lg text-xs sm:text-sm">
                    <span className="font-medium text-foreground">
                      정보 수정일:
                    </span>
                    <div className="text-muted-foreground mt-1">
                      {formatDateTime(user.updated_at)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            사용자 정보가 없습니다.
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button
            variant="destructive"
            onClick={handleUnlock}
            disabled={loading || !user}
          >
            {loading ? "해제 중..." : "계정 잠금 해제"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
