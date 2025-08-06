import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { socialLinkingKeys } from "./query-keys";

/**
 * 소셜 연동 콜백 처리 훅
 */
export function useSocialLinkingCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useCommonToast();

  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");
    const message = searchParams.get("message");
    const provider = searchParams.get("provider");

    // 소셜 연동 관련 파라미터 클린업 유틸리티
    const cleanUpParams = (params: URLSearchParams) => {
      [
        "error",
        "error_code",
        "error_description",
        "message",
        "success",
        "provider",
      ].forEach((key) => params.delete(key));
      return params;
    };

    if (error === "link_failed" && message) {
      const decodedMessage = decodeURIComponent(message);
      showError("소셜 계정 연동 실패", decodedMessage);

      // URL에서 모든 관련 파라미터 제거
      const params = cleanUpParams(new URLSearchParams(searchParams));
      router.replace(`/admin/account?${params.toString()}`);
    } else if (success === "linked") {
      const providerName =
        provider === "google"
          ? "Google"
          : provider === "kakao"
          ? "Kakao"
          : provider || "소셜";
      showSuccess(
        "소셜 계정 연동 완료",
        `${providerName} 계정이 성공적으로 연동되었습니다.`
      );

      // URL에서 모든 관련 파라미터 제거
      const params = cleanUpParams(new URLSearchParams(searchParams));
      router.replace(`/admin/account?${params.toString()}`);

      // 계정 목록 새로고침
      queryClient.invalidateQueries({
        queryKey: socialLinkingKeys.identities(),
      });
    }
  }, [searchParams, router, showError, showSuccess, queryClient]);
}
