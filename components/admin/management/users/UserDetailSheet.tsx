import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import {
  CommonSheetHeader,
  CommonSheetContent,
  CommonSheetFooter,
} from "@/components/ui/sheet-common";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ZoomableImage } from "@/components/ui/zoomable-image";
import { formatDateTime } from "@/lib/utils/datetime/date";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useResetLoginAttemptsMutation } from "@/lib/hooks/query/use-auth-mutations";
import { generateInitials, getAvatarUrl } from "@/lib/utils/media/avatar";
import { BUTTONS, LABELS, PAGE_HEADER } from "@/lib/constants/management";
import { Loader2, LockOpen } from "lucide-react";
import { type UserProfileWithFarmMembers } from "@/lib/hooks/query/use-admin-users-query";
import { useAuth } from "@/components/providers/auth-provider";

interface UserDetailSheetProps {
  user: UserProfileWithFarmMembers | null;
  open: boolean;
  onClose: () => void;
}

export function UserDetailSheet({ user, open, onClose }: UserDetailSheetProps) {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError, showInfo, showWarning } = useCommonToast();
  const { state } = useAuth();
  const isAdmin =
    state.status === "authenticated" && state.user?.app_metadata?.isAdmin;

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

  const resetAttemptsMutation = useResetLoginAttemptsMutation();

  const handleUnlock = async () => {
    showInfo("계정 잠금 해제 시작", "계정 잠금을 해제하는 중입니다...");
    setLoading(true);
    try {
      const result = await resetAttemptsMutation.mutateAsync({
        email: user?.email || "",
        reason: "관리자 수동 잠금 해제",
      });

      // API 응답 메시지에 따라 토스트 타입 결정
      if (result.message.includes("이미 잠금 해제되어 있습니다")) {
        showWarning("계정 상태 확인", result.message);
      } else {
        showSuccess("계정 잠금 해제 완료", result.message);
      }
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      showError("계정 잠금 해제 실패", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <CommonSheetContent
        side="bottom"
        showHandle={true}
        enableDragToClose={true}
        dragDirection="vertical"
        dragThreshold={50}
        onClose={onClose}
      >
        <CommonSheetHeader
          title={PAGE_HEADER.USER_DETAIL_TITLE}
          description={PAGE_HEADER.USER_DETAIL_DESC}
        />
        {user ? (
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="space-y-4 pr-2 pb-4">
              {/* 기본 정보 */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                {user.profile_image_url &&
                user.profile_image_url.trim() !== "" ? (
                  <ZoomableImage
                    src={getAvatarUrl(user, { size: 128 })}
                    alt={user.name || "User"}
                    title={`${user.name} 프로필`}
                    className="h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 flex-shrink-0 rounded-full bg-gray-50 flex items-center justify-center"
                    shape="circle"
                    size="lg"
                  />
                ) : (
                  <Avatar className="h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 flex-shrink-0 rounded-full bg-gray-50 flex items-center justify-center">
                    <AvatarImage
                      src={getAvatarUrl(user, { size: 128 })}
                      alt={user.name || "User"}
                    />
                    <AvatarFallback
                      className={`${getAvatarColor(user.name)} text-white`}
                    >
                      {generateInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="text-center sm:text-left flex-1">
                  <div className="text-lg sm:text-xl md:text-2xl font-semibold">
                    {user.name}
                  </div>
                  <div className="text-sm sm:text-base text-muted-foreground break-all">
                    {user.email}
                  </div>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-1 sm:gap-2 mt-2">
                    <Badge
                      className={`${getRoleColor(
                        isAdmin ? "admin" : "user"
                      )} text-xs sm:text-sm`}
                    >
                      {isAdmin
                        ? LABELS.SYSTEM_ADMIN_USER
                        : LABELS.GENERAL_USER_DETAIL}
                    </Badge>
                    <Badge
                      className={`${getStatusColor(
                        user.is_active
                      )} text-xs sm:text-sm`}
                    >
                      {user.is_active ? LABELS.ACTIVE_CSV : LABELS.INACTIVE_CSV}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 상세 정보 */}
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="font-medium text-foreground text-sm sm:text-base">
                      {LABELS.PHONE_NUMBER_USER}
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm sm:text-base">
                      {user.phone || LABELS.NO_INFO}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="font-medium text-foreground text-sm sm:text-base">
                      {LABELS.COMPANY_INSTITUTION}
                    </div>
                    <div className="text-muted-foreground mt-1 break-all text-sm sm:text-base">
                      {user.company_name || LABELS.NO_INFO}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="font-medium text-foreground text-sm sm:text-base">
                      {LABELS.BUSINESS_TYPE}
                    </div>
                    <div className="text-muted-foreground mt-1 text-sm sm:text-base">
                      {user.business_type || LABELS.NO_INFO}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <div className="font-medium text-foreground text-sm sm:text-base">
                      {LABELS.COMPANY_ADDRESS_USER}
                    </div>
                    <div className="text-muted-foreground mt-1 break-all text-sm sm:text-base">
                      {user.company_address || LABELS.NO_INFO}
                    </div>
                  </div>
                </div>

                {/* 시간 정보 */}
                <div className="pt-2 sm:pt-4 border-t space-y-2 sm:space-y-3">
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <span className="font-medium text-foreground text-sm sm:text-base">
                      {LABELS.LAST_LOGIN}
                    </span>
                    <div className="text-muted-foreground mt-1 text-sm sm:text-base">
                      {user.last_login_at
                        ? formatDateTime(user.last_login_at)
                        : LABELS.NO_LOGIN_RECORD}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <span className="font-medium text-foreground text-sm sm:text-base">
                      {LABELS.REGISTRATION_DATE}:
                    </span>
                    <div className="text-muted-foreground mt-1 text-sm sm:text-base">
                      {formatDateTime(user.created_at)}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-muted rounded-lg">
                    <span className="font-medium text-foreground text-sm sm:text-base">
                      {LABELS.INFO_UPDATE_DATE}
                    </span>
                    <div className="text-muted-foreground mt-1 text-sm sm:text-base">
                      {formatDateTime(user.updated_at)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {LABELS.NO_USER_INFO}
          </div>
        )}
        <CommonSheetFooter
          onCancel={onClose}
          onConfirm={handleUnlock}
          cancelText={BUTTONS.CANCEL}
          confirmText={loading ? BUTTONS.UNLOCKING : BUTTONS.UNLOCK_ACCOUNT}
          isLoading={loading}
          disabled={loading || !user}
          confirmIcon={
            loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <LockOpen className="h-4 w-4 mr-2" />
            )
          }
        />
      </CommonSheetContent>
    </Sheet>
  );
}
