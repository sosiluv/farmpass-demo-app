import { useCallback } from "react";
import { useCommonToast } from "@/lib/utils/notification/toast-messages";
import { useUpdateAvatarSeedMutation } from "@/lib/hooks/query/use-account-mutations";

export interface UseAvatarSeedManagerOptions {
  userId: string;
  onError?: (error: Error) => void;
  onSuccess?: (seed: string) => void;
}

export interface UseAvatarSeedManagerReturn {
  // 상태
  loading: boolean;
  error: Error | null;

  // 액션
  updateAvatarSeed: (seed: string) => Promise<void>;
  generateRandomSeed: () => string;

  // 유틸리티
  resetError: () => void;
}

export function useAvatarSeedManager(
  options: UseAvatarSeedManagerOptions
): UseAvatarSeedManagerReturn {
  const { userId, onError, onSuccess } = options;
  const { showError } = useCommonToast();

  // 커스텀 mutation 생성 - 토스트 제거된 버전
  const avatarSeedMutation = useUpdateAvatarSeedMutation();

  // 랜덤 seed 생성 함수
  const generateRandomSeed = useCallback((): string => {
    const adjectives = [
      "happy",
      "brave",
      "clever",
      "gentle",
      "mighty",
      "wise",
      "swift",
      "calm",
      "bright",
      "noble",
      "kind",
      "bold",
      "quick",
      "fair",
      "strong",
      "wise",
    ];

    const nouns = [
      "tiger",
      "eagle",
      "wolf",
      "bear",
      "lion",
      "dragon",
      "phoenix",
      "unicorn",
      "dolphin",
      "owl",
      "fox",
      "deer",
      "hawk",
      "panther",
      "falcon",
      "raven",
    ];

    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 1000);

    return `${randomAdjective}-${randomNoun}-${randomNumber}`;
  }, []);

  // 아바타 seed 업데이트 함수
  const updateAvatarSeed = useCallback(
    async (seed: string): Promise<void> => {
      try {
        await avatarSeedMutation.mutateAsync({ userId, seed });
        // 성공 콜백 호출
        if (onSuccess) {
          onSuccess(seed);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "아바타 seed 업데이트 중 오류가 발생했습니다.";

        // 에러 토스트
        showError("오류", errorMessage);

        // 에러 콜백 호출
        if (onError) {
          onError(error instanceof Error ? error : new Error(errorMessage));
        }
      }
    },
    [avatarSeedMutation, userId, showError, onSuccess, onError]
  );

  // 에러 리셋 함수
  const resetError = useCallback(() => {
    avatarSeedMutation.reset();
  }, [avatarSeedMutation]);

  return {
    // 상태
    loading: avatarSeedMutation.isPending,
    error: avatarSeedMutation.error,

    // 액션
    updateAvatarSeed,
    generateRandomSeed,

    // 유틸리티
    resetError,
  };
}
