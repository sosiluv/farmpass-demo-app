/**
 * =================================
 * 🔔 공통 Toast 메시지 유틸리티
 * =================================
 * 중복된 toast 메시지들을 표준화하고 일관성 제공
 */

import { useToast } from "@/hooks/use-toast";
import { devLog } from "@/lib/utils/logging/dev-logger";

// 공통 성공 메시지들
export const SUCCESS_MESSAGES = {
  // 방문자 관련
  VISITOR_CREATED: {
    title: "방문자 등록 완료",
    description: "방문자가 성공적으로 등록되었습니다.",
  },
  VISITOR_UPDATED: {
    title: "방문자 정보 수정 완료",
    description: "방문자 정보가 성공적으로 수정되었습니다.",
  },
  VISITOR_DELETED: {
    title: "방문자 삭제 완료",
    description: "방문자가 성공적으로 삭제되었습니다.",
  },

  // 농장 관련
  FARM_CREATED: {
    title: "농장 등록 완료",
    description: "새로운 농장이 등록되었습니다.",
  },
  FARM_UPDATED: {
    title: "농장 정보 수정 완료",
    description: "농장 정보가 수정되었습니다.",
  },
  FARM_DELETED: {
    title: "농장 삭제 완료",
    description: "농장이 삭제되었습니다.",
  },

  // 멤버 관련
  MEMBER_PROMOTED: {
    title: "멤버 승격 완료",
    description: "멤버가 성공적으로 승격되었습니다.",
  },
  MEMBER_DEMOTED: {
    title: "멤버 강등 완료",
    description: "멤버가 성공적으로 강등되었습니다.",
  },
  MEMBER_REMOVED: {
    title: "멤버 제거 완료",
    description: "멤버가 성공적으로 제거되었습니다.",
  },

  // 알림 관련
  NOTIFICATION_SUBSCRIBED: {
    title: "구독 성공",
    description: "알림 구독이 완료되었습니다.",
  },
  NOTIFICATION_UNSUBSCRIBED: {
    title: "구독 해제",
    description: "알림 구독이 해제되었습니다.",
  },
  NOTIFICATION_ICON_UPLOADED: {
    title: "업로드 완료",
    description: "알림 아이콘이 업로드되었습니다.",
  },
  NOTIFICATION_BADGE_UPLOADED: {
    title: "업로드 완료",
    description: "배지 아이콘이 업로드되었습니다.",
  },
  NOTIFICATION_TEST_STARTED: {
    title: "테스트 알림 발송 중",
    description: "잠시만 기다려주세요...",
  },
  NOTIFICATION_TEST_SUCCESS: {
    title: "테스트 알림 발송 완료",
    description: "테스트 알림이 성공적으로 발송되었습니다.",
  },
  VAPID_GENERATION_STARTED: {
    title: "VAPID 키 생성 중",
    description: "잠시만 기다려주세요...",
  },
  VAPID_GENERATION_SUCCESS: {
    title: "VAPID 키 생성 완료",
    description: "새로운 VAPID 키가 성공적으로 생성되었습니다.",
  },

  // 일반
  DATA_SAVED: {
    title: "저장 완료",
    description: "변경사항이 저장되었습니다.",
  },
  DATA_REFRESHED: {
    title: "새로고침 완료",
    description: "데이터가 새로고침되었습니다.",
  },

  // 내보내기 관련
  DATA_EXPORTED: {
    title: "내보내기 완료",
    description: "데이터가 성공적으로 내보내졌습니다.",
  },

  // 알림 설정 관련
  NOTIFICATION_SETTINGS_SAVED: {
    title: "알림 설정 저장 완료",
    description: "알림 설정이 성공적으로 저장되었습니다.",
  },
  NOTIFICATION_SETTINGS_CANCELED: {
    title: "변경사항 취소",
    description: "알림 설정 변경사항이 취소되었습니다.",
  },
} as const;

// 공통 에러 메시지들
export const ERROR_MESSAGES = {
  // 방문자 관련
  VISITOR_CREATE_FAILED: {
    title: "방문자 등록 실패",
    description: "방문자를 등록하는 중 오류가 발생했습니다.",
  },
  VISITOR_UPDATE_FAILED: {
    title: "방문자 정보 수정 실패",
    description: "방문자 정보를 수정하는 중 오류가 발생했습니다.",
  },
  VISITOR_DELETE_FAILED: {
    title: "방문자 삭제 실패",
    description: "방문자를 삭제하는 중 오류가 발생했습니다.",
  },
  VISITOR_FETCH_FAILED: {
    title: "방문자 목록 조회 실패",
    description: "방문자 목록을 불러오는 중 오류가 발생했습니다.",
  },

  // 농장 관련
  FARM_CREATE_FAILED: {
    title: "농장 등록 실패",
    description: "농장을 등록하는 중 오류가 발생했습니다.",
  },
  FARM_UPDATE_FAILED: {
    title: "농장 정보 수정 실패",
    description: "농장 정보를 수정하는 중 오류가 발생했습니다.",
  },
  FARM_DELETE_FAILED: {
    title: "농장 삭제 실패",
    description: "농장을 삭제하는 중 오류가 발생했습니다.",
  },
  FARM_FETCH_FAILED: {
    title: "농장 목록 조회 실패",
    description: "농장 목록을 불러오는 중 오류가 발생했습니다.",
  },

  // 멤버 관련
  MEMBER_ACTION_FAILED: {
    title: "멤버 작업 실패",
    description: "멤버 작업 중 오류가 발생했습니다.",
  },
  MEMBER_FETCH_FAILED: {
    title: "멤버 목록 조회 실패",
    description: "멤버 목록을 불러오는 중 오류가 발생했습니다.",
  },

  // 알림 관련
  NOTIFICATION_FAILED: {
    title: "알림 작업 실패",
    description: "푸시 알림 작업에 실패했습니다.",
  },
  NOTIFICATION_UPLOAD_FAILED: {
    title: "업로드 실패",
    description: "이미지 업로드 중 오류가 발생했습니다.",
  },
  NOTIFICATION_TEST_FAILED: {
    title: "테스트 알림 발송 실패",
    description: "테스트 알림 발송에 실패했습니다.",
  },
  NOTIFICATION_SUBSCRIPTION_NEEDED: {
    title: "푸시 알림 구독 필요",
    description: "알림 설정에서 푸시 알림을 구독해주세요.",
  },
  NOTIFICATION_SUBSCRIPTION_EXPIRED: {
    title: "구독 만료",
    description: "구독이 만료되어 다시 구독이 필요합니다.",
  },
  VAPID_GENERATION_FAILED: {
    title: "VAPID 키 생성 실패",
    description: "VAPID 키 생성에 실패했습니다.",
  },

  // 일반
  OPERATION_FAILED: {
    title: "작업 실패",
    description: "작업 중 오류가 발생했습니다.",
  },
  NETWORK_ERROR: {
    title: "네트워크 오류",
    description: "네트워크 연결을 확인해주세요.",
  },
  UNAUTHORIZED: {
    title: "권한 없음",
    description: "이 작업을 수행할 권한이 없습니다.",
  },
  UNKNOWN_ERROR: {
    title: "알 수 없는 오류",
    description: "예상치 못한 오류가 발생했습니다.",
  },
  DATA_LOAD_FAILED: {
    title: "데이터 로드 실패",
    description: "데이터를 불러오는 중 오류가 발생했습니다.",
  },

  // 내보내기 관련
  DATA_EXPORT_FAILED: {
    title: "내보내기 실패",
    description: "데이터 내보내기 중 오류가 발생했습니다.",
  },

  // 알림 설정 관련
  NOTIFICATION_SETTINGS_SAVE_FAILED: {
    title: "알림 설정 저장 실패",
    description: "알림 설정을 저장하는 중 오류가 발생했습니다.",
  },
} as const;

// Toast 메시지 표시 헬퍼 함수들
export function useCommonToast() {
  const { toast } = useToast();

  return {
    // 성공 메시지
    showSuccess: (messageKey: keyof typeof SUCCESS_MESSAGES) => {
      toast(SUCCESS_MESSAGES[messageKey]);
    },

    // 에러 메시지
    showError: (messageKey: keyof typeof ERROR_MESSAGES) => {
      toast({
        ...ERROR_MESSAGES[messageKey],
        variant: "destructive",
      });
    },

    // 커스텀 성공 메시지
    showCustomSuccess: (title: string, description?: string) => {
      toast({
        title,
        description,
      });
    },

    // 커스텀 에러 메시지
    showCustomError: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "destructive",
      });
    },

    // 원본 toast 함수 (특수한 경우에만 사용)
    toast,
  };
}

// 에러에서 메시지를 추출하는 유틸리티
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "알 수 없는 오류가 발생했습니다.";
}

// 공통 에러 핸들러
export function createCommonErrorHandler(
  toast: ReturnType<typeof useCommonToast>
) {
  return (error: unknown, fallbackMessageKey?: keyof typeof ERROR_MESSAGES) => {
    const errorMessage = getErrorMessage(error);

    if (fallbackMessageKey) {
      toast.showError(fallbackMessageKey);
    } else {
      toast.showCustomError("오류", errorMessage);
    }

    devLog.error("Error:", error);
  };
}
