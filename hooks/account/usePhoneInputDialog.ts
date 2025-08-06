import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useProfileQuery } from "@/lib/hooks/query/use-profile-query";
import { useUpdateProfileMutation } from "@/lib/hooks/query/use-account-mutations";

export function usePhoneInputDialog() {
  const { state } = useAuth();
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { data: profile, refetch: refetchProfile } = useProfileQuery(userId);
  const { mutateAsync: updateProfile } = useUpdateProfileMutation();

  const [showDialog, setShowDialog] = useState(false);
  const [lastMessage, setLastMessage] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  // 프로필에 phone이 없으면 다이얼로그 표시
  useEffect(() => {
    if (state.status === "authenticated" && profile && !profile.phone) {
      setShowDialog(true);
    } else {
      setShowDialog(false);
    }
  }, [state.status, profile]);

  // 저장(업데이트) 핸들러
  const handleSave = useCallback(
    async (phoneNumber: string) => {
      try {
        await updateProfile({ phoneNumber });
        await refetchProfile();
        setShowDialog(false);
        setLastMessage({
          type: "success",
          title: "저장 완료",
          message: "휴대폰번호가 저장되었습니다.",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.";
        setLastMessage({
          type: "error",
          title: "오류",
          message: errorMessage,
        });
      }
    },
    [updateProfile, refetchProfile]
  );

  const closeDialog = useCallback(() => {
    setShowDialog(false);
  }, []);

  const clearLastMessage = useCallback(() => {
    setLastMessage(null);
  }, []);

  return {
    showDialog,
    handleSave,
    closeDialog,
    lastMessage,
    clearLastMessage,
    profile,
  };
}
